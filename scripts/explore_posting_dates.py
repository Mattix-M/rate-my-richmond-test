"""Read-only discovery work; does not change website statistics or model outputs."""
import collections
import csv
import datetime
import json
import pathlib
import statistics

ROOT = pathlib.Path(__file__).resolve().parents[1]
with (ROOT / 'data/reviews_clean.csv').open(encoding='utf-8-sig', newline='') as source:
    rows = list(csv.DictReader(source))
assert len(rows) == len({r['review_key'] for r in rows}) == 12239
for r in rows:
    r['quality'] = int(r['quality'])
    r['year'] = int(r['review_year'])
    r['month'] = int(r['review_month'])
    datetime.date.fromisoformat(r['review_date'])
complete = [r for r in rows if 2003 <= r['year'] <= 2025]
report = {'source': 'data/reviews_clean.csv', 'completeYears': [2003, 2025], 'completeYearReviews': len(complete),
          'limits': ['The archive is not a random sample.', 'No posting time of day is available.',
                     'A date cluster cannot establish a reason for posting or shared authorship.',
                     'Older and newer reviews can concern different courses and platform versions.'],
          'monthly': [], 'yearly': [], 'busiestDates': []}
for month in range(1, 13):
    subset = [r for r in complete if r['month'] == month]
    report['monthly'].append({'month': month, 'reviews': len(subset),
        'oneStar': sum(r['quality'] == 1 for r in subset),
        'quality': statistics.mean(r['quality'] for r in subset)})
for year in range(2003, 2026):
    subset = [r for r in complete if r['year'] == year]
    report['yearly'].append({'year': year, 'reviews': len(subset),
        'quality': statistics.mean(r['quality'] for r in subset),
        'fiveStarShare': statistics.mean(r['quality'] == 5 for r in subset)})
dates = collections.defaultdict(list)
for r in rows:
    dates[r['review_date']].append(r)
for date, subset in sorted(dates.items(), key=lambda item: (-len(item[1]), item[0]))[:20]:
    report['busiestDates'].append({'date': date, 'reviews': len(subset),
        'professorIds': len({r['professor_id'] for r in subset}),
        'quality': statistics.mean(r['quality'] for r in subset)})
num = den = 0
for year in range(2003, 2026):
    september = [r for r in complete if r['year'] == year and r['month'] == 9]
    december = [r for r in complete if r['year'] == year and r['month'] == 12]
    if not september or not december:
        continue
    weight = len(september) * len(december) / (len(september) + len(december))
    num += weight * (statistics.mean(r['quality'] == 1 for r in september) - statistics.mean(r['quality'] == 1 for r in december))
    den += weight
report['septemberMinusDecemberOneStarWithinYear'] = num / den
report['positiveChanges'] = []
model = json.loads((ROOT / 'src/lib/data.json').read_text())
for professor in model['professors']:
    reviews = json.loads((ROOT / 'public/reviews' / (professor['id'] + '.json')).read_text())
    earlier = [r for r in reviews if 2002 <= r['year'] <= 2021]
    recent = [r for r in reviews if 2022 <= r['year'] <= 2026]
    if len(earlier) < 15 or len(recent) < 15:
        continue
    a = statistics.mean(r['quality'] for r in earlier)
    b = statistics.mean(r['quality'] for r in recent)
    if b > a:
        report['positiveChanges'].append({'id': professor['id'], 'name': professor['name'],
            'department': professor['department'], 'earlier': a, 'recent': b,
            'earlierCount': len(earlier), 'recentCount': len(recent), 'difference': b - a})
report['positiveChanges'].sort(key=lambda r: -r['difference'])
assert sum(r['reviews'] for r in report['monthly']) == len(complete)
target = ROOT / 'output/posting-date-findings.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(report, indent=2))
print('Exploratory findings saved privately; published statistics unchanged.')
