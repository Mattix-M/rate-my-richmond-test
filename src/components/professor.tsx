'use client';
import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {data, Professor, fmt, alphaText} from '@/lib/model';
import {courseKey, dateLabel, inPeriod, summarizeReviews} from '@/lib/review-stats';
import {PeriodToggle, usePeriod} from './shell';
import {SeriesChart} from './charts';
import {CompareButton} from './comparison-context';
import {useReviews} from './use-reviews';
import {RatingDistribution} from './rating-distribution';

export function ProfessorDetail({professor: p}: {professor: Professor}) {
  const {period} = usePeriod();
  const m = p[period];
  const {rows: reviews, error, retry} = useReviews(p.id);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [sort, setSort] = useState('newest');
  const [limit, setLimit] = useState(20);
  const [allCourses, setAllCourses] = useState(false);
  const subset = useMemo(() => inPeriod(reviews || [], period), [reviews, period]);
  const summary = useMemo(() => summarizeReviews(subset), [subset]);
  const selectedCourse = summary.courses.some(c => c.course === course) ? course : '';
  useEffect(() => setLimit(20), [period, search, course, sort]);
  const filtered = subset.filter(r => (!selectedCourse || courseKey(r.course) === selectedCourse) && `${r.comment} ${r.course} ${r.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'oldest' ? a.date.localeCompare(b.date) : sort === 'high' ? b.quality - a.quality : sort === 'low' ? a.quality - b.quality : sort === 'hard' ? b.difficulty - a.difficulty : sort === 'easy' ? a.difficulty - b.difficulty : b.date.localeCompare(a.date));
  const years = [...new Set(subset.map(r => r.year))].sort().map(year => {
    const s = summarizeReviews(subset.filter(r => r.year === year));
    return {year, reviews: s.count, quality: s.quality, difficulty: s.difficulty};
  });
  const earlier = summarizeReviews((reviews || []).filter(r => r.year >= 2002 && r.year <= 2021));
  const recent = summarizeReviews(inPeriod(reviews || [], 'recent'));
  const comparable = earlier.count >= 15 && recent.count >= 15;
  const rank = (dept = false) => {
    if (m?.bayesianQuality == null) return '—';
    const pool = data.professors.filter(q => q[period]?.ranked && q[period]?.bayesianQuality != null && (!dept || q.department === p.department));
    return `#${1 + pool.filter(q => q[period]!.bayesianQuality! > m.bayesianQuality!).length} / ${pool.length}`;
  };
  const dep = data.departments.find(d => d.department === p.department);
  return <>
    <Link href="/professors/" className="back-link">← All professors</Link>
    <section className="page-heading"><div><div className="eyebrow">{p.group}</div><h1>{p.name}</h1><p>{dep ? <Link href={`/departments/${dep.id}/`}>{p.department} ↗</Link> : p.department}</p></div><PeriodToggle/></section>
    <div className="profile-actions"><a href="#reviews" className="button dark">Read reviews ↓</a><CompareButton id={p.id} name={p.name}/></div>
    {m ? <><div className="metric-strip profile-metrics">{[['Average quality', fmt(m.quality)], ['Reported difficulty', fmt(m.difficulty)], ['Reviews', fmt(m.reviews, 0)], ['Latest review', reviews ? dateLabel(summary.latest) : error ? 'Unavailable' : 'Loading…']].map(([label, value]) => <div key={label}><span>{label}</span><strong className={label === 'Latest review' ? 'date-value' : ''}>{value}</strong></div>)}</div><p className="micro">Quality and difficulty use separate 1–5 scales. These figures cover all reviewed courses in the selected period.</p>
    <details className="method"><summary>Adjusted scores and ranking details</summary><div className="metric-strip">{[['Adjusted quality', fmt(m.bayesianQuality)], ['Adjusted difficulty', fmt(m.bayesianDifficulty)], ['Relative rating (Alpha)', fmt(m.alpha)], ['Rating disagreement (SD)', fmt(m.polarization)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="rank-strip"><span>Richmond quality <b>{rank()}</b></span><span>Department quality <b>{rank(true)}</b></span></div><p>Adjusted scores pull small samples toward the campus average. Ranks use eligible professors, and ties share a rank. {alphaText} {period === 'recent' ? 'Recent Alpha is unavailable.' : !m.ranked ? 'No eligible adjusted score is supplied for this professor.' : ''}</p></details></> : <p className="notice">No reviews in 2022–2026. Switch to All time to see this professor’s ratings.</p>}
    {reviews && summary.count > 0 && <section className="section"><div className="section-heading"><h2>More context</h2></div><div className="chart-pair"><div><h3>How students rated this professor</h3><RatingDistribution counts={summary.distribution.map(r => r.quality)}/></div><div><h3>Ratings by review year</h3><SeriesChart rows={years} x="year" series={[{key: 'quality', name: 'Quality', color: '#000066'}, {key: 'difficulty', name: 'Difficulty', color: '#990000'}]}/><p className="micro">Yearly averages can move a lot when only a few students post.</p></div></div>
      <div className="profile-context-grid"><div><h3>Common review tags</h3><ul className="tag-counts">{summary.tags.slice(0, 7).map(t => <li key={t.tag}>{t.tag}<span>{t.count} of {summary.count} reviews</span></li>)}</ul>{!summary.tags.length && <p className="micro">No tags in these reviews.</p>}<p className="micro">Each review counts once per tag. Not every review includes tags.</p></div><div><h3>Earlier and recent reviews</h3>{comparable ? <><div className="period-comparison">{[['2002–2021', earlier], ['2022–2026', recent]].map(([label, raw]) => {const s = raw as typeof earlier; return <div key={String(label)}><span>{String(label)}</span><strong>{fmt(s.quality)}</strong><p>Average quality · {s.count} reviews</p><p>Difficulty {fmt(s.difficulty)}</p></div>;})}</div><p className="micro">Separate time windows. Different courses and reviewers may explain a change; this does not establish a change in teaching.</p></> : <p className="notice">A comparison needs at least 15 reviews in each window. Earlier: {earlier.count}; recent: {recent.count}.</p>}</div></div>
      <details className="method"><summary>Reviewed courses ({summary.courses.length})</summary><p>Labels come from reviews, not an official course catalog. Averages are shown for courses with at least 15 reviews.</p><div className="table-scroll"><table><thead><tr><th>Course</th><th>Reviews</th><th>Quality</th><th>Difficulty</th></tr></thead><tbody>{summary.courses.slice(0, allCourses ? undefined : 8).map(c => <tr key={c.course}><td><button className="text-button" onClick={() => {setCourse(c.course); document.getElementById('reviews')?.scrollIntoView({behavior: 'smooth'});}}>{c.course} ↓</button></td><td>{c.count}</td><td>{c.count >= 15 ? fmt(c.quality) : '—'}</td><td>{c.count >= 15 ? fmt(c.difficulty) : '—'}</td></tr>)}</tbody></table></div>{summary.courses.length > 8 && <button className="button" onClick={() => setAllCourses(!allCourses)}>{allCourses ? 'Show fewer courses' : 'Show all courses'}</button>}</details>
    </section>}
    <section className="section" id="reviews"><div className="section-heading"><div><h2>Student reviews</h2><p>Original comments from anonymous Rate My Professors posts.</p></div></div>
      <div className="filters"><label className="search-field"><input aria-label="Search reviews" placeholder="Search comments, courses, or tags…" value={search} onChange={e => setSearch(e.target.value)}/></label><label><span>Course</span><select aria-label="Filter reviews by course" value={selectedCourse} onChange={e => setCourse(e.target.value)}><option value="">All reviewed courses</option>{summary.courses.map(c => <option key={c.course} value={c.course}>{c.course} ({c.count})</option>)}</select></label><label><span>Review order</span><select aria-label="Sort reviews" value={sort} onChange={e => setSort(e.target.value)}>{[['newest', 'Newest'], ['oldest', 'Oldest'], ['high', 'Highest quality score'], ['low', 'Lowest quality score'], ['hard', 'Highest difficulty score'], ['easy', 'Lowest difficulty score']].map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></label></div>
      {error ? <div className="notice">Couldn’t load the reviews. <button className="button" onClick={retry}>Try again</button></div> : !reviews ? <p className="empty" role="status">Loading original reviews…</p> : <><p className="micro" role="status">{filtered.length} matching reviews · Comments reflect individual opinions, including unverified claims.</p>{filtered.slice(0, limit).map(r => <article className="review" key={r.key}><div className="review-top"><div><strong>{r.course || 'Course not specified'}</strong><time dateTime={r.date}>{dateLabel(r.date)}</time></div><div className="review-scores"><span>Quality <b>{fmt(r.quality, 0)}</b></span><span>Difficulty <b>{fmt(r.difficulty, 0)}</b></span></div></div><p className="review-comment">{r.comment}</p><div className="tags">{r.tags.map((t, i) => <span key={`${t}-${i}`}>{t}</span>)}</div></article>)}{!filtered.length && <p className="empty">No reviews match these filters.</p>}{filtered.length > limit && <button className="button" onClick={() => setLimit(limit + 20)}>Show 20 more reviews</button>}</>}
    </section>
    {p.aliases.length > 0 && <details className="method"><summary>Names combined in this profile</summary><p>{p.aliases.join(', ')}. These documented name joins reproduce the source review counts and averages.</p></details>}
  </>;
}
