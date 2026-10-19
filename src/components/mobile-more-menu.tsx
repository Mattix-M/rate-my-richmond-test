'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState, type MouseEvent, type KeyboardEvent} from 'react';
import {Menu, X} from 'lucide-react';

const links = [['Compare', '/compare/'], ['Departments', '/departments/'], ['Statistics', '/statistics/'], ['About', '/about/'], ['Feedback', '/feedback/'], ['Data & updates', '/data/']];

export function MobileMoreMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {dialog.current?.close();}, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => {if (desktop.matches) dialog.current?.close();};
    desktop.addEventListener('change', closeOnDesktop);
    return () => {document.body.style.overflow = previousOverflow; desktop.removeEventListener('change', closeOnDesktop);};
  }, [open]);

  function show() {dialog.current?.showModal(); setOpen(true);}
  function backdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.current?.close();
  }
  function containTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]');
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
  }

  return <>
    <button type="button" aria-label="More navigation" aria-controls="mobile-more-navigation" aria-expanded={open} aria-haspopup="dialog" onClick={show}><Menu size={20}/><span>More</span></button>
    <dialog className="mobile-more-sheet" id="mobile-more-navigation" ref={dialog} aria-labelledby="mobile-more-title" onClose={() => setOpen(false)} onClick={backdropClick} onKeyDown={containTab}>
      <div className="more-sheet-handle" aria-hidden="true"/>
      <div className="more-sheet-heading"><h2 id="mobile-more-title">More</h2><button className="more-sheet-close" type="button" aria-label="Close more navigation" onClick={() => dialog.current?.close()}><X size={24}/></button></div>
      <nav className="more-sheet-links" aria-label="More pages">{links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined} onClick={() => dialog.current?.close()}>{label}</Link>)}</nav>
    </dialog>
  </>;
}
