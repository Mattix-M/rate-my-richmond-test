
'use client';
import Link from 'next/link';
import {data,fmt,profURL} from '@/lib/model';
import insights from '@/lib/insights.json';
import {PeriodToggle,usePeriod} from './shell';
import {SeriesChart,HorizontalBars} from './charts';
import {RatingDistribution} from './rating-distribution';
import {CompareButton} from './comparison-context';
function ResearchSection({number,title,children}:{number:string;title:string;children:React.ReactNode}){return <section className="research-section" id={`question-${number}`}><div className="question-number">{number}</div><div className="research-content"><h2>{title}</h2>{children}</div></section>}
function Comparison({broad=false}:{broad?:boolean}){const {period}=usePeriod();const r=data.comparisons.find(r=>r.Comparison===(broad?'Robins minus Broad STEM':'Robins minus Gottwald')&&r.Period===(period==='all'?'All-time':'2022-2026'))!;const gs=data.groups[period];const business=gs.find(g=>g.Cluster==='Robins Business')!;const sciences=gs.filter(g=>g.Cluster==='Gottwald Sciences'||broad&&g.Cluster==='Math & CS');const n=sciences.reduce((s,g)=>s+g.Reviews,0);const difficulty=sciences.reduce((s,g)=>s+g.Reviews*g['Review-weighted Difficulty'],0)/n;const rows=[{name:'Robins Business',difficulty:business['Review-weighted Difficulty'],reviews:business.Reviews},{name:broad?'Broad STEM':'Gottwald Sciences',difficulty,reviews:n}];const xpos=(v:number)=>80+(v+.75)/1*600;return <><HorizontalBars rows={rows} label="name" value="difficulty" title="Raw average difficulty"/><details className="method"><summary>Adjusted comparison and uncertainty</summary><div className="regression"><div className="regression-stats"><div><span>Adjusted difference</span><strong>{fmt(r.Estimate,3)}</strong></div><div><span>95% confidence interval</span><b>[{fmt(r['CI Low'],3)}, {fmt(r['CI High'],3)}]</b></div><div><span>p-value</span><b>{fmt(r['p-value'],4)}</b></div><div><span>Model N</span><b>{fmt(r.N,0)}</b></div></div><div className="ci-chart" role="img" aria-label={`Adjusted Robins minus ${broad?'Broad STEM':'Gottwald'} difference ${fmt(r.Estimate,3)}, 95% confidence interval ${fmt(r['CI Low'],3)} to ${fmt(r['CI High'],3)}`}><svg viewBox="0 0 760 140"><line x1="80" x2="680" y1="65" y2="65" stroke="#d1d8c9"/>{[-.75,-.5,-.25,0,.25].map(t=><g key={t}><line x1={xpos(t)} x2={xpos(t)} y1="25" y2="85" stroke={t===0?'#758774':'#e0e5da'} strokeDasharray="4 4"/><text x={xpos(t)} y="109" textAnchor="middle">{t===0?'0':fmt(t)}</text></g>)}<line x1={xpos(r['CI Low'])} x2={xpos(r['CI High'])} y1="55" y2="55" stroke="#000066" strokeWidth="4"/>{[r['CI Low'],r['CI High']].map(v=><line key={v} x1={xpos(v)} x2={xpos(v)} y1="46" y2="64" stroke="#000066" strokeWidth="2"/>)}<circle cx={xpos(r.Estimate)} cy="55" r="7" fill="#000066"><title>{`${r.Comparison}: ${fmt(r.Estimate,3)}`}</title></circle><text x="80" y="136">← Lower difficulty</text><text x="680" y="136" textAnchor="end">Higher difficulty →</text></svg></div><p className="micro">Adjusted difference in difficulty points · 95% CI · SE {fmt(r.SE,3)} · R² {fmt(r['R-squared'],3)}<br/>Controls: course level + review year. Model N differs from the raw review total; exact exclusion rules were not supplied. Source: business_vs_science_results.csv.</p></div></details><p className="plain-english">After accounting for course level and review year, Robins reviews still report lower difficulty{broad?', even with Math and CS included':''}.</p><p className="micro">{broad?'Broad STEM raw mean is a review-weighted combination of the supplied Gottwald and Math & CS summaries. ':''}Economics is excluded from Robins in both comparisons. This is an association in self-selected reviews, not a causal effect of attending a school.</p></>}
export function Statistics() {
  const {period} = usePeriod();
  const slice = insights.periods[period];
  const periodLabel = period === 'all' ? 'All time' : '2022–2026';
  const highBoth = data.professors.filter(p => p[period]?.ranked && p[period]!.quality >= 4 && p[period]!.difficulty >= 4).sort((a, b) => b[period]!.bayesianQuality! - a[period]!.bayesianQuality!).slice(0, 4);
  const highAlpha = data.professors.filter(p => p.all.alpha != null).sort((a, b) => b.all.alpha! - a.all.alpha!).slice(0, 4);
  const robinsDepartments = data.departments.filter(d => d.cluster === 'Robins Business').map(d => ({name: d.department, difficulty: d.review_weighted_difficulty, reviews: d.reviews})).sort((a, b) => b.difficulty - a.difficulty);
  return <>
    <section className="page-heading"><div><div className="eyebrow">Other fun statistics</div><h1>A few reasonable questions.</h1><p>I’m very extra.</p></div><PeriodToggle/></section>
    <div className="notebook-index">{[['01', 'Can students enjoy effort?'], ['02', 'Is RMP biased?'], ['03', 'Who beats expectations?'], ['04', 'Are students just bitchier?'], ['05', 'What happens when Robins meets numbers?'], ['06', 'Is Robins actually easier?'], ['07', 'Do harder classes get lower ratings?']].map(([n, label]) => <a key={n} href={`#question-${n}`}>{n} · {label} ↘</a>)}</div>
    <ResearchSection number="01" title="Can students enjoy a class that requires effort?">
      <p className="period-note">{periodLabel} · At least 4/5 for both raw quality and difficulty</p>
      <p className="plain-english">Against all odds, yes. Good job, guys.</p>
      <div className="insight-cards">{highBoth.map(p => {const m = p[period]!; return <article key={p.id}><h3><Link href={profURL(p)}>{p.name} ↗</Link></h3><p>{p.department}</p><dl className="mini-metrics"><div><dt>Quality</dt><dd>{fmt(m.quality)}</dd></div><div><dt>Difficulty</dt><dd>{fmt(m.difficulty)}</dd></div><div><dt>Reviews</dt><dd>{m.reviews}</dd></div></dl><CompareButton id={p.id} name={p.name}/></article>;})}</div>
      {!highBoth.length && <p className="notice">No eligible professors meet both thresholds in this period.</p>}
      <p className="micro">Ordered by adjusted quality and limited to professors with enough reviews. This is what students rated, not a measurement of how much entered their brains.</p>
    </ResearchSection>
    <ResearchSection number="02" title="Is Rate My Professors biased?">
      <p className="period-note">{periodLabel} · Three eligible professors with the largest spread in quality ratings</p>
      <p className="plain-english">Shocking discovery: RMP is biased. Who could have seen that coming?</p>
      <div className="insight-cards distribution-cards">{slice.disagreements.map(r => {const p = data.professors.find(p => p.id === r.id)!; return <article key={p.id}><h3><Link href={profURL(p)}>{p.name} ↗</Link></h3><p>Average quality {fmt(r.quality)} · Spread {fmt(r.sd)}</p><RatingDistribution counts={r.counts}/></article>;})}</div>
      <details className="method"><summary>How disagreement is measured</summary><p>Spread is the sample standard deviation of individual quality ratings. Larger values mean reviewers disagree more; they do not mean a professor is worse. The bars show the actual counts and percentages.</p></details>
    </ResearchSection>
    <ResearchSection number="03" title="Who gets better ratings than expected?">
      <span className="scope-label">All time · Alpha</span>
      <p className="plain-english">These professors get higher ratings than the model expects after accounting for difficulty, department, and year. Highly recommend these guys.</p>
      <div className="insight-cards">{highAlpha.map(p => <article key={p.id}><h3><Link href={profURL(p)}>{p.name} ↗</Link></h3><p>{p.department}</p><dl className="mini-metrics"><div><dt>Alpha</dt><dd>+{fmt(p.all.alpha)}</dd></div><div><dt>Quality</dt><dd>{fmt(p.all.quality)}</dd></div><div><dt>Difficulty</dt><dd>{fmt(p.all.difficulty)}</dd></div></dl><CompareButton id={p.id} name={p.name}/></article>)}</div>
      <p className="micro">Alpha is rating relative to expectations, not an official RMP score. Positive means higher than expected.</p>
    </ResearchSection>
    <ResearchSection number="04" title="Are students just bitchier now?">
      <span className="scope-label">All time · Raw yearly averages</span>
      <p className="plain-english">Not really. The raw trend does not show students steadily becoming harsher. We remain inconsistent.</p>
      <SeriesChart rows={data.timeTrend} x="review_year" series={[{key: 'mean_quality', name: 'Quality', color: '#000066'}, {key: 'mean_difficulty', name: 'Difficulty', color: '#990000'}]}/>
      <p className="micro">The mix of professors and courses changes every year, so this is not a controlled test of student bitchiness. Also, 2026 is partial.</p>
    </ResearchSection>
    <ResearchSection number="05" title="What happens when Robins students encounter numbers?">
      <span className="scope-label">All time · Robins departments</span>
      <p className="plain-english">Finance has the highest reported difficulty in Robins. Business and Marketing are at the other end. Numbers remain undefeated.</p>
      <HorizontalBars rows={robinsDepartments} label="name" value="difficulty" title="Average reported difficulty"/>
      <p className="micro">Raw department averages from the supplied summaries. This is a comparison of student ratings, not proof that one major requires more work.</p>
    </ResearchSection>
    <ResearchSection number="06" title="Is Robins actually easier?">
      <p className="period-note">{periodLabel} · Robins Business vs. Gottwald Sciences</p><Comparison/>
      <p className="aside-copy">The numbers say yes. The numbers also say Jepson is harder than Gottwald. So either accept both, or start arguing with the spreadsheet.</p>
      <details className="method"><summary>Check the comparison with Math & CS included</summary><Comparison broad/></details>
    </ResearchSection>
    <ResearchSection number="07" title="Do students rate harder classes lower?">
      <p className="period-note">{periodLabel} · Descriptive review averages</p><SeriesChart rows={slice.difficultyQuality} x="difficulty" series={[{key: 'quality', name: 'Average quality', color: '#000066'}]} yLabel="Average quality (1–5)"/>
      <div className="table-scroll"><table><caption className="sr-only">Quality by reported difficulty</caption><thead><tr><th>Difficulty score</th><th>Average quality</th><th>Reviews</th></tr></thead><tbody>{slice.difficultyQuality.map(r => <tr key={r.difficulty}><td>{r.difficulty}</td><td>{fmt(r.quality)}</td><td>{fmt(r.reviews, 0)}</td></tr>)}</tbody></table></div>
      <p className="plain-english">Are Richmond students academically rigorous, or are we just bitching because we wanted an easy class? The ratings lean toward option two.</p>
      <p className="micro">Each point is the average quality score for reviews at that difficulty level. It shows the pattern; it cannot prove that difficulty caused the rating.</p>
    </ResearchSection>
  </>;
}
