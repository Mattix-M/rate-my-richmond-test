import {SiteFeedback} from '@/components/site-feedback';

export const metadata = {title: 'Feedback', description: 'Got a game idea? Found something broken? Leave private feedback for Rate My Richmond.'};
export default function FeedbackPage() {
  return <><section className="page-heading centered-heading"><div><div className="eyebrow">Feedback</div><h1>What do you think?</h1><p>This is still a work in progress.</p></div></section><SiteFeedback full/></>;
}
