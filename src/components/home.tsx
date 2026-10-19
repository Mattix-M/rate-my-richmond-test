'use client';
import Link from 'next/link';

import {data, fmt} from '@/lib/model';
import {usePeriod, PeriodToggle} from './shell';
import {Explorer} from './explorer';
import {UrdleCard} from './course-matchups';
import {SiteFeedback} from './site-feedback';

export function Awards() {
  const {period} = usePeriod();
  const award = data.awards.find(a => a.Award === (period === 'all' ? 'Best all-time' : 'Best recent'))!;
  const professor = data.professors.find(p => p.id === award.id)!;
  const m = professor[period]!;
  const alpha = data.professors.filter(p => p.all.alpha != null).sort((a, b) => b.all.alpha! - a.all.alpha!)[0];
  const hardButLoved = data.professors.filter(p => p.id !== alpha.id && p[period]?.ranked && p[period]!.difficulty >= 4).sort((a, b) => b[period]!.bayesianQuality! - a[period]!.bayesianQuality!)[0];
  return <><div className="awards">
    <Link href={`/professors/${professor.id}/`} className="award award-0"><div className="eyebrow">Highest rated {period === 'recent' ? 'in recent reviews' : 'all time'}</div><h2>{professor.name}</h2><p>{professor.department}</p><p className="award-blurb">Highest adjusted quality score.</p><div className="award-stats"><span><strong>{fmt(award.Score)}</strong>Adjusted quality</span><span><b>{fmt(m.quality)}</b>Raw quality</span><span><b>{m.reviews}</b>Reviews</span></div></Link>
    <Link href={`/professors/${alpha.id}/`} className="award award-alpha"><div className="eyebrow">Highest Alpha · all time </div><h2>{alpha.name}</h2><p>{alpha.department}</p><p className="award-blurb">Rated higher than expected. Highly recommend.</p><div className="award-stats"><span><strong>+{fmt(alpha.all.alpha)}</strong>Alpha</span><span><b>{fmt(alpha.all.quality)}</b>Quality</span><span><b>{alpha.all.reviews}</b>Reviews</span></div></Link>
    <Link href={`/professors/${hardButLoved.id}/`} className="award award-1"><div className="eyebrow">Hard, still highly rated </div><h2>{hardButLoved.name}</h2><p>{hardButLoved.department}</p><p className="award-blurb">High difficulty and high quality.</p><div className="award-stats"><span><strong>{fmt(hardButLoved[period]!.bayesianQuality)}</strong>Adjusted quality</span><span><b>{fmt(hardButLoved[period]!.difficulty)}</b>Difficulty</span><span><b>{hardButLoved[period]!.reviews}</b>Reviews</span></div></Link>
  </div><p className="micro">Adjusted for review count · {period === 'all' ? '20-review minimum' : '15-review minimum'} · Ratings reflect student reviews (again... biased). <Link href="/about/#methodology">How the numbers work</Link></p></>;
}
export function Home() {
  const {period} = usePeriod();
  return <><section className="page-heading home-heading"><div><div className="eyebrow">University of Richmond professor reviews</div><h1>Rate My Richmond<span className="brand-dot">.</span></h1></div><PeriodToggle/></section><div className="edition"><span>{fmt(period === 'all' ? data.meta.reviews : data.meta.recentReviews, 0)} anonymous and probably biased reviews.</span><a href="#the-plot">Explore the graph </a></div>
    <form className="home-professor-search" action="/professors/" role="search"><input type="hidden" name="period" value="all"/><label htmlFor="home-professor">Who are you looking for?</label><div><input id="home-professor" type="search" name="q" placeholder="Professor’s name" required/><button className="button dark" type="submit">Find professor</button></div><span>All professors with at least one review.</span></form><div className="home-tools"><Link href="/courses/"><span className="eyebrow">01 · Course search</span><h2>Find your class.</h2><p>See who’s taught it and what students said.</p><span className="text-link">Find a course</span></Link><Link href="/courses/?saved=1"><span className="eyebrow">02 · Your shortlist</span><h2>Your saved courses.</h2><p>Save a few now. Figure out your schedule later.</p><span className="text-link">Open saved courses</span></Link></div><Awards/>
    <aside className="home-author-note" aria-label="A note from the author"><span>Note from the author</span><p>Also trying to prove that statistics is actually pretty cool.</p></aside>
    <section className="section" id="the-plot"><div className="section-heading"><div><div className="eyebrow">Quality and difficulty</div><h2>Explore the ratings</h2><p>Hard doesn’t mean bad. Look at both ratings.</p></div><Link className="text-link" href="/professors/">View professor list </Link></div><Explorer/></section>
    <UrdleCard/><section className="notebook-teaser"><div><span className="eyebrow">Statistics</span><h2>A few reasonable questions.</h2><p>I’m very extra.</p></div><Link className="button dark" href="/statistics/">See the numbers </Link></section>
    <SiteFeedback/>
  </>;
}
