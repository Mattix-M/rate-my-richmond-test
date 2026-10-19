import {randomUUID} from 'node:crypto';
import {get, put, BlobPreconditionFailedError} from '@vercel/blob';
import {NextRequest, NextResponse} from 'next/server';
import {FEEDBACK_COOKIE, parseFeedback, readVisitor, sameOrigin, signVisitor, type Vote} from '@/lib/feedback-policy';

export const runtime = 'nodejs';
export const maxDuration = 15;

type Entry = {id: string; category: string; message: string; createdAt: string};
type RecordData = {version: 1; vote: Vote | null; updatedAt: string; lastVoteAt: number; lastFeedbackAt: number; messages: Entry[]};
const empty = (): RecordData => ({version: 1, vote: null, updatedAt: '', lastVoteAt: 0, lastFeedbackAt: 0, messages: []});
const pathFor = (id: string) => `feedback/visitors/${id}.json`;
function reply(body: object, status = 200) {
  return NextResponse.json(body, {status, headers: {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'}});
}
async function read(id: string) {
  const blob = await get(pathFor(id), {access: 'private', useCache: false});
  if (!blob) return {data: empty(), etag: undefined};
  if (blob.statusCode !== 200) throw new Error('Unexpected storage response');
  const data = await new Response(blob.stream).json() as RecordData;
  return {data, etag: blob.blob.etag};
}

export async function GET(request: NextRequest) {
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) return reply({error: 'Feedback is unavailable right now. Try again later.'}, 503);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return reply({error: 'Open feedback on this website.'}, 403);
  const id = readVisitor(request.cookies.get(FEEDBACK_COOKIE)?.value, secret);
  if (!id) return reply({vote: null});
  try {return reply({vote: (await read(id)).data.vote});}
  catch {return reply({error: 'Couldn’t load your vote. You can try again.'}, 503);}
}

export async function POST(request: NextRequest) {
  // Next may use an internal localhost URL. Compare with the host the browser
  // actually requested; production traffic reaches Vercel over HTTPS.
  const browserUrl = new URL(request.url);
  browserUrl.host = request.headers.get('host') ?? browserUrl.host;
  if (process.env.NODE_ENV === 'production' && browserUrl.hostname !== '127.0.0.1' && browserUrl.hostname !== 'localhost') browserUrl.protocol = 'https:';
  if (!sameOrigin(request.headers.get('origin'), browserUrl.href)) return reply({error: 'Send feedback from this website.'}, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply({error: 'Expected JSON.'}, 415);
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) return reply({error: 'Feedback is unavailable right now. Try again later.'}, 503);
  // Bound streamed bodies too, even when Content-Length is missing or incorrect.
  let size = 0;
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) return reply({error: 'Add a vote or a message.'}, 400);
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 8192) {await reader.cancel(); return reply({error: 'That message is too long.'}, 413);}
    chunks.push(chunk.value);
  }
  let raw: unknown;
  try {raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch {return reply({error: 'Couldn’t read that submission.'}, 400);}
  const input = parseFeedback(raw);
  if (!input) return reply({error: 'Choose a vote, or write a message between 3 and 1,500 characters.'}, 400);
  const id = readVisitor(request.cookies.get(FEEDBACK_COOKIE)?.value, secret) ?? randomUUID();
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const {data, etag} = await read(id);
      const now = Date.now();
      const last = input.type === 'vote' ? data.lastVoteAt : data.lastFeedbackAt;
      if (now - last < (input.type === 'vote' ? 3000 : 60000)) return reply({error: input.type === 'vote' ? 'Give it a few seconds before changing your vote.' : 'Give it a minute before sending another message.'}, 429);
      if (input.type === 'feedback' && data.messages.length >= 10) return reply({error: 'You’ve sent 10 ideas already. Thanks for all the feedback.'}, 429);
      const updated: RecordData = {...data, updatedAt: new Date(now).toISOString()};
      if (input.type === 'vote') {updated.vote = input.vote; updated.lastVoteAt = now;}
      else {
        updated.lastFeedbackAt = now;
        updated.messages = [...data.messages, {id: randomUUID(), category: input.category, message: input.message, createdAt: updated.updatedAt}];
      }
      try {
        await put(pathFor(id), JSON.stringify(updated), {access: 'private', addRandomSuffix: false, allowOverwrite: Boolean(etag), ...(etag ? {ifMatch: etag} : {}), contentType: 'application/json', cacheControlMaxAge: 60});
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError && attempt < 2) continue;
        throw error;
      }
      const response = reply({ok: true, vote: updated.vote});
      response.cookies.set(FEEDBACK_COOKIE, signVisitor(id, secret), {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180});
      return response;
    }
  } catch {
    // Submissions and credentials must never appear in public errors or logs.
    return reply({error: 'Couldn’t save that right now. Your message is still here; try again later.'}, 503);
  }
  return reply({error: 'Your submission changed in another tab. Try again.'}, 409);
}
