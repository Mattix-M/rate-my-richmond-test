'use client';

import {data, fmt} from '@/lib/model';
import {usePeriod} from './shell';
import {HorizontalBars} from './charts';

export function SchoolComparison({broad = false}: {broad?: boolean}) {
  const {period} = usePeriod();
  const comparison = broad ? 'Robins minus Broad STEM' : 'Robins minus Gottwald';
  const r = data.comparisons.find(row => row.Comparison === comparison && row.Period === (period === 'all' ? 'All-time' : '2022-2026'))!;
  const groups = data.groups[period];
  const business = groups.find(g => g.Cluster === 'Robins Business')!;
  const sciences = groups.filter(g => g.Cluster === 'Gottwald Sciences' || broad && g.Cluster === 'Math & CS');
  const reviews = sciences.reduce((sum, g) => sum + g.Reviews, 0);
  const difficulty = sciences.reduce((sum, g) => sum + g.Reviews * g['Review-weighted Difficulty'], 0) / reviews;
  const jepson = groups.find(g => g.Cluster === 'Jepson')!;
  const rows = [
    {name: 'Robins Business', difficulty: business['Review-weighted Difficulty'], reviews: business.Reviews},
    {name: broad ? 'Gottwald + Math & CS' : 'Gottwald Sciences', difficulty, reviews},
    ...(!broad ? [{name: 'Jepson', difficulty: jepson['Review-weighted Difficulty'], reviews: jepson.Reviews}] : []),
  ];
  const xpos = (v: number) => 80 + (v + .75) * 600;
  return <>
    <HorizontalBars rows={rows} label="name" value="difficulty" title="Average reported difficulty"/>
    <details className="method"><summary>Adjusted comparison and how it works</summary>
      {!broad && <p>The raw averages put Jepson slightly above Robins and Gottwald. This is not an adjusted test of Jepson, and the difference from Gottwald is small. These are student-reported difficulty scores.</p>}
      <p>The model below compares Robins with {broad ? 'Gottwald plus Math & CS' : 'Gottwald'}, accounting for course level and review year. Economics is separate from Robins. It describes self-selected reviews, not a causal effect of attending a school.</p>
      <div className="regression">
        <div className="regression-stats"><div><span>Adjusted difference</span><strong>{fmt(r.Estimate, 3)}</strong></div><div><span>95% confidence interval</span><b>[{fmt(r['CI Low'], 3)}, {fmt(r['CI High'], 3)}]</b></div><div><span>p-value</span><b>{fmt(r['p-value'], 4)}</b></div><div><span>Model N</span><b>{fmt(r.N, 0)}</b></div></div>
        <div className="ci-chart" role="img" aria-label={`Adjusted ${comparison}: ${fmt(r.Estimate, 3)}, 95% confidence interval ${fmt(r['CI Low'], 3)} to ${fmt(r['CI High'], 3)}`}>
          <svg viewBox="0 0 760 140"><line x1="80" x2="680" y1="65" y2="65" stroke="#d1d8c9"/>{[-.75, -.5, -.25, 0, .25].map(t => <g key={t}><line x1={xpos(t)} x2={xpos(t)} y1="25" y2="85" stroke={t === 0 ? '#758774' : '#e0e5da'} strokeDasharray="4 4"/><text x={xpos(t)} y="109" textAnchor="middle">{t === 0 ? '0' : fmt(t)}</text></g>)}<line x1={xpos(r['CI Low'])} x2={xpos(r['CI High'])} y1="55" y2="55" stroke="#000066" strokeWidth="4"/>{[r['CI Low'], r['CI High']].map(v => <line key={v} x1={xpos(v)} x2={xpos(v)} y1="46" y2="64" stroke="#000066" strokeWidth="2"/>)}<circle cx={xpos(r.Estimate)} cy="55" r="7" fill="#000066"/><text x="80" y="136">Lower difficulty</text><text x="680" y="136" textAnchor="end">Higher difficulty</text></svg>
        </div>
        <p className="micro">Difficulty points · 95% CI · SE {fmt(r.SE, 3)} · R² {fmt(r['R-squared'], 3)}. Controls: course level and review year. Model N differs from the raw review total; exact exclusion rules were not supplied. Source: business_vs_science_results.csv.</p>
      </div>
    </details>
  </>;
}
