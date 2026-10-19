'use client';
import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {MATCHUP_VERSION} from '@/lib/daily-matchups';

const SEEN = 'rmr-urdle-invite-v1';

export function UrdleInvite() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  useEffect(() => {
    if (pathname === '/games' || pathname.startsWith('/games/')) {
      shown.current = true;
      setOpen(false);
      try {sessionStorage.setItem(SEEN, '1'); localStorage.setItem(SEEN, '1');} catch {}
      return;
    }
    if (shown.current) return;
    try {
      if (localStorage.getItem(SEEN) || sessionStorage.getItem(SEEN)) return;
      const history = JSON.parse(localStorage.getItem(`urdle:${MATCHUP_VERSION}`) || '{}');
      if (history && Object.values(history).some(picks => Array.isArray(picks) && picks.length > 0)) return;
    } catch {}
    const timer = window.setTimeout(() => {
      shown.current = true;
      // Mark on display so navigation cannot repeatedly interrupt a new visitor.
      try {sessionStorage.setItem(SEEN, '1'); localStorage.setItem(SEEN, '1');} catch {}
      setOpen(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {if (event.key === 'Escape') setOpen(false);};
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [open]);
  if (!open) return null;
  return <aside className="game-invite" aria-labelledby="game-invite-title">
    <button type="button" className="invite-close" aria-label="Dismiss game invitation" onClick={() => setOpen(false)}>×</button>
    <span className="eyebrow">There’s a game too</span>
    <h2 id="game-invite-title">Try URdle.</h2>
    <p>Five pairs of classes. Guess which one students rated harder.</p>
    <div><Link className="button dark" href="/games/" onClick={() => setOpen(false)}>Play URdle</Link><button className="text-button" onClick={() => setOpen(false)}>Maybe later</button></div>
  </aside>;
}
