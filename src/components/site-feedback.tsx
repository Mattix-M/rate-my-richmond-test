'use client';
import Link from 'next/link';
import {useEffect, useId, useRef, useState, type FormEvent} from 'react';
import {ThumbsDown, ThumbsUp} from 'lucide-react';

type Vote = 'like' | 'dislike';
export function SiteFeedback({full = false}: {full?: boolean}) {
  const id = useId();
  const [vote, setVote] = useState<Vote | null>(null);
  const [busy, setBusy] = useState(false);
  const [voteStatus, setVoteStatus] = useState('');
  const [formStatus, setFormStatus] = useState('');
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Feature idea');
  const [website, setWebsite] = useState('');
  const interacted = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/feedback/', {cache: 'no-store', signal: controller.signal})
      .then(response => response.ok ? response.json() : null)
      .then(data => {if (!interacted.current && (data?.vote === 'like' || data?.vote === 'dislike')) setVote(data.vote);})
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function submit(input: object) {
    const response = await fetch('/api/feedback/', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...input, website})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Couldn’t save that. Try again.');
    return data;
  }
  async function rate(next: Vote) {
    if (busy || next === vote) return;
    interacted.current = true;
    setBusy(true); setVoteStatus('');
    try {await submit({type: 'vote', vote: next}); setVote(next); setVoteStatus('Vote saved. Thanks.');}
    catch (error) {setVoteStatus(error instanceof Error ? error.message : 'Couldn’t save your vote. Try again.');}
    finally {setBusy(false);}
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setFormStatus(''); setError(false);
    try {await submit({type: 'feedback', category, message}); setMessage(''); setFormStatus('Got it. Thanks.');}
    catch (error) {setError(true); setFormStatus(error instanceof Error ? error.message : 'Couldn’t send that. Your message is still here.');}
    finally {setBusy(false);}
  }
  return <section className={`site-feedback${full ? ' feedback-full' : ''}`} aria-labelledby={`${id}-title`}>
    <div className="feedback-intro"><span className="eyebrow">Still working on this</span><h2 id={`${id}-title`}>{full ? 'How’s the website?' : 'Useful?'}</h2><p>{full ? 'Be honest. That’s the point.' : 'Or did you just come here to read the reviews?'}</p></div>
    <div className="feedback-controls"><div className="feedback-votes" role="group" aria-label="Rate the website overall"><button type="button" aria-pressed={vote === 'like'} disabled={busy} onClick={() => rate('like')}><ThumbsUp size={18} aria-hidden="true"/>Like it</button><button type="button" aria-pressed={vote === 'dislike'} disabled={busy} onClick={() => rate('dislike')}><ThumbsDown size={18} aria-hidden="true"/>Not really</button></div><p className="feedback-status" role="status">{voteStatus || (vote ? 'Your vote is saved. You can change it.' : 'This rates the website, not a professor.')}</p>{!full && <Link className="text-link" href="/feedback/">Have an idea? Leave feedback.</Link>}</div>
    {full && <form className="feedback-form" onSubmit={send}>
      <h3>What should I add? What should I fix?</h3>
      <p>New games, missing features, things that look weird on your phone. Send whatever.</p>
      <label htmlFor={`${id}-category`}>What’s it about?</label><select id={`${id}-category`} value={category} onChange={event => setCategory(event.target.value)}>{['Feature idea', 'Game idea', 'Something broke', 'Other'].map(option => <option key={option}>{option}</option>)}</select>
      <label htmlFor={`${id}-message`}>Your feedback</label><textarea id={`${id}-message`} value={message} onChange={event => setMessage(event.target.value)} minLength={3} maxLength={1500} rows={6} required placeholder="I think you should…" aria-describedby={`${id}-privacy`}/>
      <div className="feedback-honey" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this empty</label><input id={`${id}-website`} value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off"/></div>
      <p className="micro" id={`${id}-privacy`}>No name or email needed. Feedback stays private. Please leave out personal info.</p>
      <div className="feedback-submit"><button type="submit" className="button dark" disabled={busy || message.trim().length < 3}>{busy ? 'Saving…' : 'Send feedback'}</button><span className="micro">{message.length.toLocaleString()} / 1,500</span></div>
      <p className={`feedback-status${error ? ' feedback-error' : ''}`} role="status">{formStatus}</p>
    </form>}
  </section>;
}
