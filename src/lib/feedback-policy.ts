import {createHmac, timingSafeEqual} from 'node:crypto';

export const FEEDBACK_COOKIE = 'rmr-feedback-v1';
export type Vote = 'like' | 'dislike';
export const CATEGORIES = ['Feature idea', 'Game idea', 'Something broke', 'Other'] as const;
export type FeedbackInput = {type: 'vote'; vote: Vote} | {type: 'feedback'; category: typeof CATEGORIES[number]; message: string};

export function parseFeedback(value: unknown): FeedbackInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (input.website) return null; // Unseen field: ordinary visitors leave this empty.
  if (input.type === 'vote' && (input.vote === 'like' || input.vote === 'dislike')) return {type: 'vote', vote: input.vote};
  if (input.type !== 'feedback' || typeof input.message !== 'string' || !CATEGORIES.includes(input.category as typeof CATEGORIES[number])) return null;
  const message = input.message.trim();
  if (message.length < 3 || message.length > 1500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message)) return null;
  return {type: 'feedback', category: input.category as typeof CATEGORIES[number], message};
}

function signature(id: string, secret: string) {
  return createHmac('sha256', secret).update(`rmr-feedback-v1:${id}`).digest('hex');
}
export function signVisitor(id: string, secret: string) {return `${id}.${signature(id, secret)}`;}
export function readVisitor(cookie: string | undefined, secret: string): string | null {
  if (!cookie || !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(cookie)) return null;
  const [id, supplied] = cookie.split('.');
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)) return null;
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(signature(id, secret), 'hex')) ? id : null;
}

export function sameOrigin(origin: string | null, requestUrl: string) {
  return origin !== null && origin === new URL(requestUrl).origin;
}
