'use client';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import {data, fmt} from '@/lib/model';
import {usePeriod, PeriodToggle} from './shell';
import {Explorer} from './explorer';

export function Awards() {
  const {period} = usePeriod();
  const award = data.awards.find(a => a.Award === (period === 'all' ? 'Best all-time' : 'Best recent'))!;
  const professor = data.professors.find(p => p.id === award.id)!;
  const m = professor[period]!;
  const alpha = data.professors.filter(p => p.all.alpha != null).sort((a, b) => b.all.alpha! - a.all.alpha!)[0];
  const hardButLoved = data.professors.filter(p => p.id !== alpha.id && p[period]?.ranked && p[period]!.difficulty >= 4).sort((a, b) => b[period]!.bayesianQuality! - a[period]!.bayesianQuality!)[0];
  return <><div className="awards">
    <Link href={`/professors/${professor.id}/`} className="award award-0"><div className="eyebrow">Highest rated {period === 'recent' ? 'in recent reviews' : 'all time'}<ArrowUpRight size={18}/></div><h2>{professor.name}</h2><p>{professor.department}</p><p className="award-blurb">The highest adjusted quality score. Pretty straightforward.</p><div className="award-stats"><span><strong>{fmt(award.Score)}</strong>Adjusted quality</span><span><b>{fmt(m.quality)}</b>Raw quality</span><span><b>{m.reviews}</b>Reviews</span></div></Link>
    <Link href={`/professors/${alpha.id}/`} className="award award-alpha"><div className="eyebrow">Highest Alpha · all time <ArrowUpRight size={18}/></div><h2>{alpha.name}</h2><p>{alpha.department}</p><p className="award-blurb">Rated higher than expected after accounting for difficulty, department, and year. Highly recommend this guy.</p><div className="award-stats"><span><strong>+{fmt(alpha.all.alpha)}</strong>Alpha</span><span><b>{fmt(alpha.all.quality)}</b>Quality</span><span><b>{alpha.all.reviews}</b>Reviews</span></div></Link>
    <Link href={`/professors/${hardButLoved.id}/`} className="award award-1"><div className="eyebrow">Hard, still highly rated <ArrowUpRight size={18}/></div><h2>{hardButLoved.name}</h2><p>{hardButLoved.department}</p><p className="award-blurb">Difficulty above 4.0 and students still gave a good rating. Good job, guys.</p><div className="award-stats"><span><strong>{fmt(hardButLoved[period]!.bayesianQuality)}</strong>Adjusted quality</span><span><b>{fmt(hardButLoved[period]!.difficulty)}</b>Difficulty</span><span><b>{hardButLoved[period]!.reviews}</b>Reviews</span></div></Link>
  </div><p className="micro">Adjusted for review count · {period === 'all' ? '20-review minimum' : '15-review minimum'} · Ratings reflect student reviews (again... biased). <Link href="/about/#methodology">How the numbers work ↗</Link></p></>;
}
export function Home() {
  const {period} = usePeriod();
  return <><section className="page-heading home-heading"><div><div className="eyebrow">University of Richmond professor reviews</div><h1>Rate My Richmond<span className="brand-dot">.</span></h1></div><PeriodToggle/></section><div className="edition"><span>{fmt(period === 'all' ? data.meta.reviews : data.meta.recentReviews, 0)} anonymous and probably biased reviews.</span><a href="#the-plot">Explore the graph <ArrowRight size={15}/></a></div><Awards/>
    <section className="section" id="the-plot"><div className="section-heading"><div><div className="eyebrow">Quality and difficulty</div><h2>Explore the ratings</h2><p>A difficult course is NOT a bad course. See both measures together.</p></div><Link className="text-link" href="/professors/">View professor list <ArrowUpRight size={17}/></Link></div><Explorer/></section>
    <section className="notebook-teaser"><div><span className="eyebrow">Statistics</span><h2>What the reviews show</h2><p>How ratings vary, where students disagree, and what has changed over time.</p></div><Link className="button dark" href="/statistics/">Explore the findings <ArrowRight size={18}/></Link></section>
  </>;
}
