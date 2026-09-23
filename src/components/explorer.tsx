'use client';
import {useMemo, useState, useCallback, useEffect} from 'react';
import Link from 'next/link';
import {Search, ArrowUpRight} from 'lucide-react';
import {ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ZAxis} from 'recharts';
import {data, fmt, departments, groups, alphaText, profURL, Professor, Metrics} from '@/lib/model';
import {usePeriod} from './shell';
import {useExplorerTools} from './use-explorer-tools';
import {CompareButton} from './comparison-context';
export type Point = Professor & Metrics;

export function ProfessorScatter({points, search = ''}: {points: Point[]; search?: string}) {
  const {period} = usePeriod();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const plot = points.map(p => ({...p, highlight: !!search && p.name.toLowerCase().includes(search.toLowerCase())}));
  const matches = plot.filter(p => p.highlight);
  const chosen = plot.find(p => p.id === selectedId);
  const select = (v: unknown) => {const p = v as Point; if (p?.id) setSelectedId(p.id);};
  return <>
    <div className="scatter-wrap" aria-label="Professor quality versus reported difficulty">
      <div className="quadrant q1">Higher ratings · lower difficulty</div><div className="quadrant q2">Higher ratings · higher difficulty</div>
      <div className="quadrant q3">Lower ratings · lower difficulty</div><div className="quadrant q4">Lower ratings · higher difficulty</div>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}><ScatterChart margin={{top: 30, right: 22, bottom: 36, left: 2}}>
        <CartesianGrid stroke="#e8e7ed" strokeDasharray="2 4"/>
        <XAxis type="number" dataKey="difficulty" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} name="Average difficulty" tickLine={false} axisLine={false} label={{value: 'Reported difficulty →', position: 'bottom', offset: 15}}/>
        <YAxis type="number" dataKey="quality" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} name="Average quality" width={48} tickLine={false} axisLine={false} label={{value: 'Average quality →', angle: -90, position: 'insideLeft', offset: 8}}/>
        <ZAxis type="number" dataKey="reviews" range={[65, 230]} domain={[1, 200]}/>
        <ReferenceLine x={data.means[period].difficulty} stroke="#aaaab9" strokeDasharray="5 5"/><ReferenceLine y={data.means[period].quality} stroke="#aaaab9" strokeDasharray="5 5"/>
        <Tooltip cursor={{strokeDasharray: '3 3'}} content={({active, payload}) => {
          if (!active || !payload?.length) return null;
          const p = payload[0].payload as Point;
          return <div className="chart-tooltip"><strong>{p.name}</strong><span>{p.department} · {fmt(p.reviews, 0)} reviews</span><dl><dt>Quality</dt><dd>{fmt(p.quality)}</dd><dt>Difficulty</dt><dd>{fmt(p.difficulty)}</dd></dl><small>Tap or click to select</small></div>;
        }}/>
        <Scatter name="Professors" data={plot.filter(p => !p.highlight)} fill="#000066" fillOpacity={search ? .28 : .65} stroke="#faf9f7" strokeWidth={1} onClick={select} style={{cursor: 'pointer'}} isAnimationActive={false}/>
        {matches.length > 0 && <Scatter name="Search matches" data={matches} fill="#990000" stroke="#660000" strokeWidth={2} onClick={select} style={{cursor: 'pointer'}} isAnimationActive={false}/>}
      </ScatterChart></ResponsiveContainer>
    </div>
    <div className="chart-caption"><span><i className="dot"/> One dot = one professor · Size = review count</span><span>Dashed lines = Richmond review averages</span></div>
    {chosen && <div className="selected-professor" aria-live="polite"><div><strong>{chosen.name}</strong><p>{chosen.department} · {chosen.reviews} reviews</p><p>Quality {fmt(chosen.quality)} · Difficulty {fmt(chosen.difficulty)}</p></div><Link className="button" href={profURL(chosen)}>View professor →</Link><CompareButton id={chosen.id} name={chosen.name}/></div>}
    {matches.length > 0 && <div className="search-matches">Matching professors: {matches.slice(0, 8).map(p => <button className="text-button" key={p.id} onClick={() => setSelectedId(p.id)}>{p.name}</button>)}</div>}
    <p className="micro">Both scales run from 1 to 5. Tap or click a dot for details. You can also find names in the <Link href="/professors/">professor list</Link>.</p>
    {points.length === 0 && <p className="empty">No professors match these filters. Try fewer restrictions.</p>}
  </>;
}

const sortOptions = [['best', 'Highest rated'], ['worst', 'Lowest rated'], ['hardest', 'Highest reported difficulty'], ['easiest', 'Lowest reported difficulty'], ['reviews', 'Most reviews'], ['alpha', 'Highest rating relative to expectations'], ['lowAlpha', 'Lowest rating relative to expectations'], ['polarization', 'Most disagreement in ratings']];
export function ProfessorTable({points, sort = 'best'}: {points: Point[]; sort?: string}) {
  const [limit, setLimit] = useState(40);
  useEffect(() => setLimit(40), [sort, points]);
  const field = sort === 'hardest' || sort === 'easiest' ? 'bayesianDifficulty' : sort === 'reviews' ? 'reviews' : sort === 'alpha' || sort === 'lowAlpha' ? 'alpha' : sort === 'polarization' ? 'polarization' : 'bayesianQuality';
  const asc = ['worst', 'easiest', 'lowAlpha'].includes(sort);
  const sorted = [...points].sort((a, b) => {
    const x = a[field], y = b[field];
    return x == null ? y == null ? a.name.localeCompare(b.name) : 1 : y == null ? -1 : (asc ? x - y : y - x) || a.name.localeCompare(b.name);
  });
  return <>
    <div className="table-scroll professor-table"><table><thead><tr><th>Professor</th><th>Quality</th><th>Difficulty</th><th>Reviews</th><th>Adjusted quality</th><th>{field === 'alpha' ? 'Relative rating (Alpha)' : field === 'polarization' ? 'Rating spread (SD)' : 'Adjusted difficulty'}</th><th>Compare</th></tr></thead><tbody>
      {sorted.slice(0, limit).map(p => <tr key={p.id}>
        <td><Link className="prof-link" href={profURL(p)}>{p.name}<ArrowUpRight size={15}/></Link><span className="subcell">{p.department}</span></td>
        <td data-label="Quality"><span className="rating">{fmt(p.quality)}</span></td><td data-label="Difficulty">{fmt(p.difficulty)}</td><td data-label="Reviews">{fmt(p.reviews, 0)}</td><td data-label="Adjusted quality">{fmt(p.bayesianQuality)}</td>
        <td data-label={field === 'alpha' ? 'Relative rating' : field === 'polarization' ? 'Rating spread' : 'Adjusted difficulty'}>{fmt(field === 'alpha' ? p.alpha : field === 'polarization' ? p.polarization : p.bayesianDifficulty)}</td>
        <td><CompareButton id={p.id} name={p.name}/></td>
      </tr>)}
    </tbody></table></div>
    {sorted.length === 0 && <p className="empty">No professors match. Try clearing a filter or lowering the minimum review count.</p>}
    {sorted.length > limit && <button className="button" onClick={() => setLimit(limit + 40)}>Show 40 more</button>}
    <p className="micro">Quality and difficulty sorts use scores adjusted for review count. Missing adjusted scores appear last. <Link href="/about/#methodology">How ratings work ↗</Link></p>
    {(sort === 'alpha' || sort === 'lowAlpha') && <p className="micro">{alphaText}</p>}
  </>;
}

export function Explorer({fixedDepartment, table = false}: {fixedDepartment?: string; table?: boolean}) {
  const {period, setPeriod} = usePeriod();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(fixedDepartment || '');
  const [group, setGroup] = useState('');
  const [minOverride, setMin] = useState<number | null>(null);
  const min = minOverride ?? (period === 'all' ? 20 : 15);
  const [sort, setSort] = useState('best');
  const [open, setOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const storageKey = `rmr-filters:${fixedDepartment || (table ? 'list' : 'plot')}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved) {
        if (typeof saved.search === 'string') setSearch(saved.search);
        if (!fixedDepartment && departments.includes(saved.department)) setDepartment(saved.department);
        if (groups.includes(saved.group)) setGroup(saved.group);
        if ([1, 5, 15, 20, 30, 50, 100].includes(saved.minOverride)) setMin(saved.minOverride);
        if (sortOptions.some(([value]) => value === saved.sort)) setSort(saved.sort);
      }
    } catch {}
    setRestored(true);
  }, [storageKey, fixedDepartment]);
  useEffect(() => {if (restored) try {sessionStorage.setItem(storageKey, JSON.stringify({search, department, group, minOverride, sort}));} catch {}}, [restored, storageKey, search, department, group, minOverride, sort]);
  const applyFilters = useCallback((v: {search: string; department: string; group: string; minimumReviews: number; period: 'all' | 'recent'}) => {setSearch(v.search); setDepartment(v.department); setGroup(v.group); setMin(v.minimumReviews); setPeriod(v.period);}, [setPeriod]);
  useExplorerTools(applyFilters, fixedDepartment);
  const points = useMemo(() => data.professors.flatMap(p => {const m = p[period]; return m && m.reviews >= min && (!department || p.department === department) && (!group || p.group === group) ? [{...p, ...m}] : [];}), [period, min, department, group]);
  const filtered = useMemo(() => table ? points.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : points, [table, points, search]);
  return <div className="explorer">
    <div className="explorer-search"><label className="search-field"><Search size={18}/><input type="search" aria-label="Search professors" placeholder="Find your professor…" value={search} onChange={e => setSearch(e.target.value)}/></label><button className="button mobile-only" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide filters' : 'Filters & sort'}</button></div>
    <div className={`filters explorer-filters ${open ? 'filters-open' : ''}`}>
      {!fixedDepartment && <label><span>Department</span><select aria-label="Department" value={department} onChange={e => setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d => <option key={d}>{d}</option>)}</select></label>}
      <label><span>Academic group</span><select aria-label="Academic group" value={group} onChange={e => setGroup(e.target.value)}><option value="">All academic groups</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label>
      <label><span>Minimum reviews</span><select aria-label="Minimum reviews" value={min} onChange={e => setMin(+e.target.value)}>{[1, 5, 15, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}+ reviews</option>)}</select></label>
      {table && <label><span>Sort by</span><select aria-label="Sort professors" value={sort} onChange={e => setSort(e.target.value)}>{sortOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
    </div>
    <div className="results-meta"><span>{fmt(filtered.length, 0)} professors · {period === 'all' ? 'All time' : '2022–2026'} · {min}+ reviews</span><button onClick={() => {setSearch(''); setDepartment(fixedDepartment || ''); setGroup(''); setMin(null); setSort('best');}}>Reset filters</button></div>
    {table ? <ProfessorTable points={filtered} sort={sort}/> : <ProfessorScatter points={points} search={search}/>}
  </div>;
}
