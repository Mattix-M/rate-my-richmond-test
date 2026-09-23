import {fmt} from '@/lib/model';

export function RatingDistribution({counts, label = 'Quality ratings'}: {counts: number[]; label?: string}) {
  const total = counts.reduce((sum, n) => sum + n, 0);
  return <div className="rating-distribution" role="group" aria-label={label}>
    <p className="micro">{label} · {total} reviews</p>
    {[5, 4, 3, 2, 1].map(rating => {
      const n = counts[rating - 1] || 0;
      const percent = total ? n / total * 100 : 0;
      return <div className="distribution-row" key={rating}><span>{rating}/5</span><div className="distribution-track"><i style={{width: `${percent}%`}}/></div><span>{n} <small>({fmt(percent, 0)}%)</small></span></div>;
    })}
  </div>;
}
