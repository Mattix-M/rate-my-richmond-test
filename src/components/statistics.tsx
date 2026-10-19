
'use client';
import {useState} from 'react';
import Link from 'next/link';
import {data,fmt} from '@/lib/model';
import insights from '@/lib/insights.json';
import {PeriodToggle,usePeriod} from './shell';
import {SeriesChart} from './charts';
import {SchoolComparison} from './school-comparison';
import {rankOneStarCourses,zeroOneStarCourses,rankDifficultyCourses,type OneStarOrder} from '@/lib/statistics-research';
function ResearchSection({number,title,children}:{number:string;title:string;children:React.ReactNode}){return <section className="research-section" id={`question-${number}`}><div className="question-number">{number}</div><div className="research-content"><h2>{title}</h2>{children}</div></section>}
export function Statistics() {
  const {period} = usePeriod();
  const [oneStarOrder, setOneStarOrder] = useState<OneStarOrder>('share');
  const slice = insights.periods[period];
  const research = insights.research.periods[period];
  const courses = insights.research.courses;
  const periodLabel = period === 'all' ? 'All time' : '2022–2026';
  const popular = courses.filter(c => c[period]).sort((a, b) => b[period]!.reviews - a[period]!.reviews || a.code.localeCompare(b.code)).slice(0, 5);
  const hardDepartments = ['Political Science', 'Chemistry', 'Mathematics'].map(name => research.hardDepartments.find(d => d.department === name)).filter(d => d != null);
  const poliSci = hardDepartments.find(d => d.department === 'Political Science')!;
  const poliSciPositive = (poliSci.distribution[3] + poliSci.distribution[4]) / poliSci.reviews * 100;
  const math = hardDepartments.find(d => d.department === 'Mathematics')!;
  const mathPositive = (math.distribution[3] + math.distribution[4]) / math.reviews * 100;
  const oneStarCourses = rankOneStarCourses(courses, period, oneStarOrder).slice(0, 5);
  const positiveExamples = zeroOneStarCourses(courses, period);
  const maxOneStarCount = Math.max(1, ...oneStarCourses.map(c => c[period]!.distribution[0]));
  const peakShare = research.peakMonthReviews / research.monthlyReviews * 100;
  const maxMonth = Math.max(...research.months.map(m => m.reviews));
  const levels = insights.research.periods.all.levels.filter(d => d.professors >= 5);
  const hardest = rankDifficultyCourses(courses, period).slice(0, 5);
  return <>
    <section className="page-heading"><div><div className="eyebrow">The statistics</div><h1>A few reasonable questions.</h1><p>I’m very extra.</p></div><PeriodToggle/></section>
    <nav className="notebook-index" aria-label="Statistics questions">{[['01', 'Most-reviewed class'], ['02', 'One-star reviews'], ['03', 'Harder = lower ratings?'], ['04', 'Who forgives hard classes?'], ['05', 'Goated classes'], ['06', 'Robins vs. Gotty'], ['07', 'When do people post?'], ['08', 'Are we getting bitchier?'], ['09', 'Intro vs. advanced classes'], ['10', 'Highest reported difficulty']].map(([n, label]) => <a key={n} href={`#question-${n}`}>{n} · {label}</a>)}</nav>
    <p className="statistics-context">Anonymous and probably biased. Use your brain.</p>
    <ResearchSection number="01" title="What is the most reviewed class?">
      <p className="period-note">{periodLabel} · Most-reviewed named courses</p>
      <p className="plain-english">{popular[0].code}, with {fmt(popular[0][period]!.reviews, 0)} reviews.</p>
      <p className="author-backstory">Fun fact: ECON101 was my first introduction to economics. That led me to econometrics, and eventually to this website. So shoutout ECON101, I guess.</p>
      <ol className="popular-courses">{popular.map(c => <li key={c.code}><Link href={`/courses/?course=${c.code}&period=${period}`}><span><b>{c.code}</b><span>{c.title}</span></span><strong>{fmt(c[period]!.reviews, 0)}<small>reviews</small></strong></Link></li>)}</ol>
      <details className="method"><summary>What about FYS100?</summary>{research.fys && <p>FYS100 has more: {fmt(research.fys.reviews, 0)} reviews across {research.fys.professors} professors. It combines different seminar topics, so it sits outside this list.</p>}<p>Review count isn’t enrollment. These are named courses with 30+ reviews in the full archive, excluding generic seminar and special-topic labels.</p></details>
    </ResearchSection>
    <ResearchSection number="02" title={oneStarOrder === 'share' ? 'Which classes get the biggest share of one-star reviews?' : 'Which classes get the most one-star reviews?'}>
      <p className="period-note">{periodLabel} · Named courses with at least 30 reviews in this period</p>
      <p className="plain-english">This one isn’t shocking to me.</p>
      <div className="segmented one-star-controls" role="group" aria-label="Rank one-star reviews"><button type="button" aria-pressed={oneStarOrder === 'share'} onClick={() => setOneStarOrder('share')}>By share</button><button type="button" aria-pressed={oneStarOrder === 'count'} onClick={() => setOneStarOrder('count')}>By count</button></div>
      <p className="sr-only" aria-live="polite">{oneStarOrder === 'share' ? 'Sorted by percentage of reviews giving quality 1/5.' : 'Sorted by number of reviews giving quality 1/5.'}</p>
      <ol className="one-star-courses">{oneStarCourses.map(c => {const s = c[period]!; const n = s.distribution[0]; const share = n / s.reviews * 100; return <li key={c.code}><Link href={`/courses/?course=${c.code}&period=${period}`}><div className="one-star-course-name"><b>{c.code}</b><span>{c.title}</span></div><div className="one-star-course-result"><strong>{oneStarOrder === 'share' ? `${fmt(share, 1)}%` : fmt(n, 0)}</strong><span>{n} of {s.reviews} reviews{oneStarOrder === 'count' ? ` · ${fmt(share, 1)}%` : ''}</span></div><div className="one-star-track" aria-hidden="true"><i style={{width: `${oneStarOrder === 'share' ? share : n / maxOneStarCount * 100}%`}}/></div></Link></li>;})}</ol>
      <details className="method"><summary>What exactly are we counting?</summary><p>One-star share = reviews giving quality 1/5 ÷ all reviews for that course in the selected period. “By count” uses the number of one-star reviews instead, so heavily reviewed classes can move up.</p><p>At least 30 reviews in the selected period. Exact codes with matched catalog names; generic seminar and special-topic labels are excluded. These are student ratings, not a list of bad classes or bad professors.</p></details>
    </ResearchSection>
    <ResearchSection number="03" title="Do we give harder classes lower quality ratings?">
      <p className="period-note">{periodLabel} · Average quality at each reported difficulty score</p>
      <p className="plain-english">Yes. Harder class = lower quality rating :(<br/>Whether that’s academic judgment or post-final emotion is between us.</p>
      <SeriesChart rows={slice.difficultyQuality} x="difficulty" series={[{key: 'quality', name: 'Average quality', color: '#000066'}]} yLabel="Average quality (1–5)"/>
      <details className="method"><summary>Exact averages and review counts</summary><p>Students give separate scores for difficulty and quality. We group reviews by difficulty and average their quality ratings. That describes the reviews; it doesn’t prove harder courses are worse or explain why students gave those scores.</p><div className="table-scroll"><table><caption className="sr-only">Quality by reported difficulty</caption><thead><tr><th>Difficulty score</th><th>Average quality</th><th>Reviews</th></tr></thead><tbody>{slice.difficultyQuality.map(r => <tr key={r.difficulty}><td>{r.difficulty}</td><td>{fmt(r.quality)}</td><td>{fmt(r.reviews, 0)}</td></tr>)}</tbody></table></div></details>
    </ResearchSection>
    <ResearchSection number="04" title="Who’s more forgiving about hard classes?">
      <p className="period-note">{periodLabel} · Reviews reporting difficulty 4 or 5</p>
      <p className="plain-english">Poli Sci: {fmt(poliSciPositive, 1)}%. Math: {fmt(mathPositive, 1)}%. Bit of a gap.</p>
      <div className="hard-review-chart" role="group" aria-label="Share of hard-class reviews giving quality four or five out of five"><h3>Hard reviews that still give high quality ratings</h3>{hardDepartments.map(d => {const positive = d.distribution[3] + d.distribution[4]; const pct = positive / d.reviews * 100; return <div className="hard-review-row" key={d.department}><div><b>{d.department}</b><small>{positive} of {d.reviews} reviews</small></div><div className="hard-review-track" aria-hidden="true"><i style={{width: `${pct}%`}}/></div><strong>{fmt(pct, 1)}%</strong></div>;})}</div>
      <details className="method"><summary>Other departments and the exact counts</summary><p>This compares reviews reporting difficulty 4 or 5. The percentage is the share also giving quality 4 or 5. The gap is real in this archive; it doesn’t tell us whether students are more forgiving or whether their courses and experiences differ.</p><div className="table-scroll"><table><caption className="sr-only">Quality ratings among reviews reporting difficulty four or five</caption><thead><tr><th>Department</th><th>Quality 4–5</th><th>Hard reviews</th></tr></thead><tbody>{research.hardDepartments.filter(d => d.reviews >= (period === 'all' ? 50 : 20)).sort((a, b) => (b.distribution[3] + b.distribution[4]) / b.reviews - (a.distribution[3] + a.distribution[4]) / a.reviews).map(d => <tr key={d.department}><td>{d.department}</td><td>{fmt((d.distribution[3] + d.distribution[4]) / d.reviews * 100, 1)}%</td><td>{d.reviews}</td></tr>)}</tbody></table></div><p>Departments with at least {period === 'all' ? 50 : 20} hard reviews in this period. Department labels come from the review export.</p></details>
    </ResearchSection>
    <ResearchSection number="05" title="Which classes are Goated?">
      <p className="period-note">{periodLabel} · Zero one-star reviews · At least 30 reviews in this period</p>
      <p className="plain-english">By Goated, I mean no one-star reviews. Personally, a goated class is one you actually enjoyed. Don’t let a one-star review talk you out of it. {period === 'all' ? 'But apparently Intensive Intermediate French is where it’s at.' : 'The all-time reviews say Intensive Intermediate French is where it’s at.'}</p>
      <div className="positive-course-examples">{positiveExamples.map(c => {const s = c[period]; return <article key={c.code}><Link href={`/courses/?course=${c.code}&period=${period}`}><span className="eyebrow">{c.code}</span><h3>{c.title}</h3></Link>{s ? <><strong>{s.distribution[0]}<span> of {s.reviews}</span></strong><p>reviews gave one star</p><dl><div><dt>Average quality</dt><dd>{fmt(s.quality)} / 5</dd></div><div><dt>Professors</dt><dd>{s.professors}</dd></div></dl></> : <p>No reviews in this period.</p>}</article>;})}</div>
      {!positiveExamples.length && <p className="notice">No named courses meet both conditions in this period.</p>}
      <details className="method"><summary>What qualifies?</summary><p>Every named course in the eligible pool with 30+ reviews in this period and zero quality scores of 1/5. That doesn’t mean every review is five stars.</p></details>
    </ResearchSection>
    <ResearchSection number="06" title="Robins vs. Gotty">
      <p className="period-note">{periodLabel} · Average reported difficulty</p>
      <p className="plain-english">A classic debate. And apparently Jepson is harder than both.</p>
      <SchoolComparison/>
      <p className="aside-copy">I think Robins and Gotty can agree that this is simply not true.</p>
      <p className="author-backstory">Personal bias: I still think my math/stats classes are probably harder anyway.</p>
      <details className="method"><summary>Check it with Math & CS included</summary><SchoolComparison broad/></details>
    </ResearchSection>
    <ResearchSection number="07" title="When do people write the reviews?">
      <p className="period-note">{research.monthlyYears} · Complete calendar years</p>
      <p className="plain-english">{fmt(peakShare, 1)}% of reviews come from April, November and December. Around the end of the semester. Makes sense. But the September reviews? Bro, the class just started.</p>
      <div className="posting-months" role="group" aria-label={`Review counts by month, ${research.monthlyYears}`}>{research.months.map(m => <div key={m.month}><span>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month - 1]}</span><div aria-hidden="true"><i style={{width: `${m.reviews / maxMonth * 100}%`}}/></div><b>{fmt(m.reviews, 0)}</b></div>)}</div>
      <details className="method"><summary>Dates and counts</summary><p>{fmt(research.peakMonthReviews, 0)} of {fmt(research.monthlyReviews, 0)} reviews fall in those three months. Partial boundary years are excluded so the scrape date doesn’t distort the pattern. Posting dates don’t establish why people posted.</p></details>
    </ResearchSection>
    <ResearchSection number="08" title="Are we getting bitchier?">
      <p className="period-note">All time only · Raw yearly averages</p>
      <p className="plain-english">No, we are consistent.</p>
      <SeriesChart rows={data.timeTrend} x="review_year" series={[{key: 'mean_quality', name: 'Quality', color: '#000066'}, {key: 'mean_difficulty', name: 'Difficulty', color: '#990000'}]}/>
      <details className="method"><summary>What the yearly trend can tell us</summary><p>Each point is a raw yearly average. The mix of professors, courses and reviewers changes, so this doesn’t track the same students becoming nicer. 2026 is partial. This historical chart stays all-time when the page period changes.</p></details>
    </ResearchSection>
    <ResearchSection number="09" title="Do we like advanced classes more?">
      <p className="period-note">All time only · Same professors, different course levels</p>
      <p className="plain-english">In History and CS, yes. Maybe choosing a subject we actually like helps.</p>
      <div className="level-findings">{levels.map(d => <div key={d.department}><h3>{d.department}</h3><strong>+{fmt(d.meanWithinProfessorDifference)}<small>quality points in 300/400-level courses</small></strong><p>{d.professors} professors · {d.lower.reviews + d.upper.reviews} reviews</p></div>)}</div>
      <details className="method"><summary>How this comparison works</summary><p>Each professor needs at least three reviews in both 100/200-level and 300/400-level courses. We calculate each professor’s quality-rating difference, then average those differences equally. FYS and CORE are excluded. This is a raw within-professor comparison, without year or difficulty controls.</p><p>The reviewers and courses differ; we cannot test whether choosing a major explains the gap. Recent reviews have only one eligible professor per department, so this section uses the full archive.</p></details>
    </ResearchSection>
    <ResearchSection number="10" title="Which classes did we rate the hardest?">
      <p className="period-note">{periodLabel} · Named courses with at least 30 reviews in this period</p>
      <p className="plain-english">{hardest[0].code === 'ECON271' ? 'Microtheory. I personally disagree, but alas.' : `${hardest[0].code}. That’s the top reported difficulty in this list.`}</p>
      <ol className="one-star-courses difficulty-courses">{hardest.map(c => {const s = c[period]!; return <li key={c.code}><Link href={`/courses/?course=${c.code}&period=${period}`}><div className="one-star-course-name"><b>{c.code}</b><span>{c.title}</span></div><div className="one-star-course-result"><strong>{fmt(s.difficulty)}<small> / 5</small></strong><span>{s.reviews} reviews</span></div><div className="one-star-track" aria-hidden="true"><i style={{width: `${s.difficulty / 5 * 100}%`}}/></div></Link></li>;})}</ol>
      <details className="method"><summary>What this ranking means</summary><p>Raw average difficulty from 1 to 5, with at least 30 reviews in the selected period. The list covers exact course codes with matched catalog names and excludes generic seminar/special-topic codes. It is not a ranking of every course offered, and the professors, years and reviewers are mixed together.</p></details>
    </ResearchSection>
  </>;
}
