"""Build descriptive insights from the existing, validated review exports.

No regressions or original rankings are refitted. Run after prepare_data.py.
"""
import collections
import json
import pathlib
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def summarize(rows):
    return {
        'reviews': len(rows),
        'quality': statistics.mean(r['quality'] for r in rows),
        'difficulty': statistics.mean(r['difficulty'] for r in rows),
    }

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
