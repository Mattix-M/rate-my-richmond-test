"""Build descriptive insights from the existing, validated review exports.

No regressions or original rankings are refitted. Run after prepare_data.py.
"""
import collections
import csv
import json
import pathlib
import re
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def summarize(rows):
    return {
        'reviews': len(rows),
        'quality': statistics.mean(r['quality'] for r in rows),
        'difficulty': statistics.mean(r['difficulty'] for r in rows),
    }

def research_summary(rows):
    if not rows:
        return None
    return {**summarize(rows), 'professors': len({r['pid'] for r in rows}),
            'distribution': [sum(r['quality'] == n for r in rows) for n in range(1, 6)]}

def research(all_rows):
    """Reproducible descriptive findings; no exploratory regression estimates shipped."""
    departments = {r['review_key']: r['department'] for r in csv.DictReader(
        (ROOT / 'data/reviews_clean.csv').open(encoding='utf-8-sig'))}
    corpus = [{**row, 'pid': pid, 'department': departments[row['key']],
               'code': re.sub(r'[\s-]+', '', row['course'].upper())}
              for pid, rows in all_rows.items() for row in rows]
    verified = json.loads((ROOT / 'src/lib/course-titles.json').read_text())
    catalog = json.loads((ROOT / 'src/lib/catalog-titles.json').read_text())
    by_course = collections.defaultdict(list)
    for row in corpus:
        if re.fullmatch(r'[A-Z]{2,5}\d{3}[A-Z]?', row['code']):
            by_course[row['code']].append(row)
    courses = []
    for code, rows in sorted(by_course.items()):
        titles = ([verified[code]['title']] if verified.get(code, {}).get('title') else []) + catalog['courses'].get(code, {}).get('titles', [])
        generic = code.startswith(('FYS', 'CORE')) or code.endswith(('199', '299', '399'))
        if len(rows) < 30 or not titles or generic:
            continue
        courses.append({'code': code, 'title': titles[0], 'all': research_summary(rows),
                        'recent': research_summary([r for r in rows if 2022 <= r['year'] <= 2026])})
    periods = {}
    for period in ('all', 'recent'):
        rows = corpus if period == 'all' else [r for r in corpus if 2022 <= r['year'] <= 2026]
        hard = collections.defaultdict(list)
        for row in rows:
            if row['difficulty'] >= 4:
                hard[row['department']].append(row)
        hard_departments = [{'department': dept, **research_summary(rs)} for dept, rs in sorted(hard.items()) if len(rs) >= 20]
        levels = []
        for dept in ('History', 'Computer Science'):
            groups = collections.defaultdict(lambda: [[], []])
            for row in rows:
                match = re.fullmatch(r'[A-Z]{2,5}([1-4])\d{2}[A-Z]?', row['code'])
                if row['department'] == dept and match and not row['code'].startswith(('FYS', 'CORE')):
                    groups[row['pid']][int(match[1] in ('3', '4'))].append(row)
            paired = [v for v in groups.values() if len(v[0]) >= 3 and len(v[1]) >= 3]
            if not paired:
                continue
            low = [r for a, _ in paired for r in a]
            high = [r for _, b in paired for r in b]
            differences = [statistics.mean(r['quality'] for r in b) - statistics.mean(r['quality'] for r in a) for a, b in paired]
            levels.append({'department': dept, 'professors': len(paired),
                           'lower': research_summary(low), 'upper': research_summary(high),
                           'meanWithinProfessorDifference': statistics.mean(differences)})
        # Exclude partial boundary years so seasonality is not skewed by the scrape date.
        monthly_rows = [r for r in rows if 2003 <= r['year'] <= 2025]
        months = collections.Counter(int(r['date'][5:7]) for r in monthly_rows)
        periods[period] = {'reviews': len(rows), 'hardDepartments': hard_departments, 'levels': levels,
                           'months': [{'month': m, 'reviews': months[m]} for m in range(1, 13)],
                           'monthlyReviews': len(monthly_rows),
                           'monthlyYears': '2003–2025' if period == 'all' else '2022–2025',
                           'peakMonthReviews': sum(months[m] for m in (4, 11, 12)),
                           'fys': research_summary([r for r in rows if r['code'] == 'FYS100'])}
    return {'courses': courses, 'periods': periods}

def build():
    data = json.loads((ROOT / 'src/lib/data.json').read_text())
    output = {'periods': {}, 'changes': [], 'eligibleChanges': 0}
    all_rows = {}
    for p in data['professors']:
        rows = json.loads((ROOT / 'public/reviews' / (p['id'] + '.json')).read_text())
        assert len(rows) == p['all']['reviews']
        assert len({r['key'] for r in rows}) == len(rows)
        all_rows[p['id']] = rows
        earlier = [r for r in rows if 2002 <= r['year'] <= 2021]
        recent = [r for r in rows if 2022 <= r['year'] <= 2026]
        if len(earlier) >= 15 and len(recent) >= 15:
            a, b = summarize(earlier), summarize(recent)
            output['changes'].append({'id': p['id'], 'earlier': a, 'recent': b, 'change': b['quality'] - a['quality']})
    output['eligibleChanges'] = len(output['changes'])
    output['changes'] = sorted(output['changes'], key=lambda r: (-abs(r['change']), r['id']))[:6]
    for period in ('all', 'recent'):
        disagreements, course_comparisons, corpus = [], [], []
        for p in data['professors']:
            rows = all_rows[p['id']]
            if period == 'recent':
                rows = [r for r in rows if 2022 <= r['year'] <= 2026]
            corpus.extend(rows)
            metrics = p[period]
            if metrics and metrics['ranked'] and metrics['polarization'] is not None:
                counts = [sum(r['quality'] == rating for r in rows) for rating in range(1, 6)]
                assert sum(counts) == metrics['reviews']
                disagreements.append({'id': p['id'], 'sd': metrics['polarization'], 'counts': counts, 'quality': metrics['quality']})
            by_course = collections.defaultdict(list)
            for r in rows:
                code = ''.join(r['course'].upper().split())
                if code:
                    by_course[code].append(r)
            courses = [{'course': code, **summarize(rs)} for code, rs in by_course.items() if len(rs) >= 15]
            if len(courses) >= 2:
                courses.sort(key=lambda r: (r['difficulty'], r['course']))
                low, high = courses[0], courses[-1]
                course_comparisons.append({'id': p['id'], 'lower': low, 'higher': high, 'difference': high['difficulty'] - low['difficulty']})
        expected = data['meta']['reviews'] if period == 'all' else data['meta']['recentReviews']
        assert len(corpus) == expected
        output['periods'][period] = {
            'disagreements': sorted(disagreements, key=lambda r: (-r['sd'], r['id']))[:3],
            'courses': sorted(course_comparisons, key=lambda r: (-r['difference'], r['id']))[:3],
            'difficultyQuality': [{'difficulty': d, **summarize([r for r in corpus if r['difficulty'] == d])} for d in range(1, 6)],
        }
    output['research'] = research(all_rows)
    return output

if __name__ == '__main__':
    output = build()
    path = ROOT / 'src/lib/insights.json'
    if '--check' in sys.argv:
        assert json.loads(path.read_text()) == output, 'Derived insights are out of date'
        print('PASS: descriptive insights, disjoint periods, review counts, and course thresholds')
    else:
        path.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
        print(f"Generated descriptive insights; {output['eligibleChanges']} professors qualify for separate-period comparisons")
