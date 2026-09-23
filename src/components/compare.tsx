'use client';
import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import Link from 'next/link';
import {data, fmt, profURL, type Review} from '@/lib/model';
import {courseKey, dateLabel, inPeriod, sharedCourses, summarizeReviews} from '@/lib/review-stats';
import {cleanComparisonIds, useComparison} from './comparison-context';
import {PeriodToggle, usePeriod} from './shell';
import {RatingDistribution} from './rating-distribution';

type Entry = {rows: Review[] | null; error: boolean};
export function Compare() {
  const {ids, setIds, toggle} = useComparison();
  const {period, setPeriod} = usePeriod();
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [attempt, setAttempt] = useState(0);
  const [course, setCourse] = useState('');
  const [pair, setPair] = useState('0,1');
  const [copied, setCopied] = useState(false);
  const key = ids.join(',');
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('ids')) setIds(cleanComparisonIds((params.get('ids') || '').split(',')));
      if (params.get('period') === 'recent' || params.get('period') === 'all') setPeriod(params.get('period') as 'all' | 'recent');
      setReady(true);
    };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [setIds, setPeriod]);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    url.searchParams.set('ids', key); url.searchParams.set('period', period);
    window.history.replaceState(null, '', url); setCopied(false);
  }, [key, period, ready]);
  useEffect(() => {
    const controller = new AbortController();
    setEntries({}); setCourse(''); setPair('0,1');
    for (const id of key.split(',').filter(Boolean)) {
      fetch(`/reviews/${id}.json`, {signal: controller.signal})
        .then(r => {if (!r.ok) throw new Error(); return r.json() as Promise<Review[]>;})
        .then(rows => {if (!controller.signal.aborted) setEntries(current => ({...current, [id]: {rows, error: false}}));})
        .catch(() => {if (!controller.signal.aborted) setEntries(current => ({...current, [id]: {rows: null, error: true}}));});
    }
    return () => controller.abort();
  }, [key, attempt]);
  const professors = ids.flatMap(id => data.professors.find(p => p.id === id) || []);
  const available = professors.every(p => entries[p.id]?.rows != null);
  const shared = available ? sharedCourses(professors.map(p => inPeriod(entries[p.id].rows!, period))) : [];
  const selectedCourse = shared.includes(course) ? course : '';
  const visiblePair = ids.length === 3 ? pair.split(',').map(Number) : [0, 1];
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? data.professors.filter(p => !ids.includes(p.id) && `${p.name} ${p.department}`.toLowerCase().includes(term)).slice(0, 8) : [];
  }, [search, ids]);
  return <>
    <section className="page-heading"><div><div className="eyebrow">Professor comparison</div><h1>Compare professors</h1><p>Ratings, courses, and the reviews behind them. Choose up to three professors.</p></div><PeriodToggle/></section>
    <div className="compare-controls"><label className="compare-search"><span>Add a professor</span><input type="search" aria-label="Find a professor to compare" placeholder="Search by name or department…" value={search} onChange={e => setSearch(e.target.value)}/></label><Link className="button" href="/professors/">Browse all professors</Link>{ids.length > 0 && <button className="button" type="button" onClick={async () => {try {await navigator.clipboard.writeText(window.location.href); setCopied(true);} catch {setCopied(false); window.prompt('Copy this comparison link', window.location.href);}}}>{copied ? 'Link copied' : 'Copy comparison link'}</button>}</div>
    {search.trim() && <div className="compare-results" aria-label="Professor search results">{results.length ? results.map(p => <button type="button" disabled={ids.length >= 3} key={p.id} onClick={() => {toggle(p.id); setSearch('');}}><strong>{p.name}</strong><span>{p.department}</span><small>{ids.length >= 3 ? 'Remove a professor first' : 'Add +'}</small></button>) : <p>No other professors match that search.</p>}</div>}
    <p className="micro" role="status">{professors.length} of 3 selected{copied ? ' · Comparison link copied' : ''}</p>
    {professors.length === 0 ? <div className="empty-state"><h2>Start with two names.</h2><p>Search above, or use the Compare button on any professor page.</p></div> : <>
      <div className="comparison-options"><label>Compare reviews for<select aria-label="Shared course" value={selectedCourse} onChange={e => setCourse(e.target.value)}><option value="">All reviewed courses</option>{shared.map(code => <option key={code}>{code}</option>)}</select></label>{ids.length === 3 && <label className="mobile-only">Show on this screen<select aria-label="Visible comparison pair" value={pair} onChange={e => setPair(e.target.value)}>{[[0, 1], [0, 2], [1, 2]].map(([a, b]) => <option key={`${a},${b}`} value={`${a},${b}`}>{professors[a].name} + {professors[b].name}</option>)}</select></label>}</div>
      <p className="micro">{selectedCourse ? 'Course-specific averages are unadjusted. The campus-wide adjusted ranking does not apply to one course.' : available && ids.length > 1 && !shared.length ? 'No matching course labels in this period. These professors may teach different courses.' : 'Shared-course options use matching review labels, normalized for capitalization and spaces.'}</p>
      <div className="compare-grid" style={{'--compare-columns': professors.length, '--mobile-columns': Math.min(2, professors.length)} as CSSProperties}>{professors.map((p, index) => {
        const entry = entries[p.id];
        const rows = entry?.rows ? inPeriod(entry.rows, period).filter(r => !selectedCourse || courseKey(r.course) === selectedCourse) : [];
        const summary = summarizeReviews(rows); const metrics = p[period];
        return <article className={`compare-card ${visiblePair.includes(index) ? '' : 'mobile-hidden'}`} key={p.id}><header className="compare-card-heading"><button className="remove-compare" type="button" aria-label={`Remove ${p.name}`} onClick={() => toggle(p.id)}>×</button><h2><Link href={profURL(p)}>{p.name}</Link></h2><p>{p.department}</p></header>
          {!entry ? <p className="empty" role="status">Loading reviews…</p> : entry.error ? <div className="notice"><p>Couldn’t load reviews.</p><button type="button" className="button" onClick={() => setAttempt(a => a + 1)}>Try again</button></div> : <>
            {!summary.count && <p className="notice">No reviews in this period.</p>}
            <dl className="comparison-metrics"><div><dt>Average quality <small>1–5</small></dt><dd>{fmt(summary.quality)}</dd></div><div><dt>Reported difficulty <small>1–5</small></dt><dd>{fmt(summary.difficulty)}</dd></div><div><dt>Reviews</dt><dd>{summary.count}</dd></div><div><dt>Adjusted quality</dt><dd>{selectedCourse ? '—' : fmt(metrics?.bayesianQuality)}</dd></div><div><dt>Latest review</dt><dd className="date-value">{dateLabel(summary.latest)}</dd></div></dl>
            {!selectedCourse && metrics && metrics.bayesianQuality == null && <p className="micro">No eligible adjusted score for this period.</p>}
            <RatingDistribution counts={summary.distribution.map(r => r.quality)}/>
            <h3>Common review tags</h3><ul className="tag-counts">{summary.tags.slice(0, 5).map(t => <li key={t.tag}>{t.tag} <span>{t.count}/{summary.count}</span></li>)}</ul>{!summary.tags.length && <p className="micro">No tags in these reviews.</p>}
            <h3>Reviewed courses</h3><ul className="course-counts">{summary.courses.slice(0, 5).map(c => <li key={c.course}>{c.course}<span>{c.count} reviews</span></li>)}</ul>
            <Link className="button" href={`${profURL(p)}#reviews`}>Read reviews →</Link>
          </>}
        </article>;
      })}</div><p className="micro">Quality and difficulty are separate 1–5 review scores. Adjusted quality accounts for review count; it does not adjust for the specific course. Tags count reviews mentioning each tag.</p>
    </>}
  </>;
}
