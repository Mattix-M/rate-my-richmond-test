import {Explorer} from '@/components/explorer';
import {PeriodToggle} from '@/components/shell';
export const metadata={title:'Professors'};
export default function Page(){return <><section className="page-heading"><div><div className="eyebrow">The professor explorer</div><h1>Find a professor</h1><p>Search ratings, read the original reviews, and compare professors.</p></div><PeriodToggle/></section><Explorer table/></>}
