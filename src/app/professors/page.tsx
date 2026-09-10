import {Explorer} from '@/components/explorer';
import {PeriodToggle} from '@/components/shell';
export const metadata={title:'Professors'};
export default function Page(){return <><section className="page-heading"><div><div className="eyebrow">The professor explorer</div><h1>Choose wisely.</h1><p>Search, sort, and see what everyone had to say.</p></div><PeriodToggle/></section><Explorer table/></>}
