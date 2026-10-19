"""Exploratory department/course research. Run with bundled Python + NumPy.

Never writes source data, website insights, award scores, or model outputs.
All model estimates here are exploratory associations, not causal effects.
"""
import collections
import csv
import itertools
import json
import math
import pathlib
import re
import statistics as st
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
rows = list(csv.DictReader((ROOT / 'data/reviews_clean.csv').open(encoding='utf-8-sig')))
lookup = {r['review_key']: r for r in rows}
model = json.loads((ROOT / 'src/lib/data.json').read_text())
index = json.loads((ROOT / 'public/courses-index.json').read_text())
courses = {c['code']: c for c in index['courses']}
for professor in model['professors']:
    for r in json.loads((ROOT / 'public/reviews' / (professor['id'] + '.json')).read_text()):
        lookup[r['key']]['pid'] = professor['id']
assert len(rows) == len(lookup) == 12239 and all(r.get('pid') for r in rows)
for r in rows:
    r['q'], r['d'], r['year'] = int(r['quality']), int(r['difficulty']), int(r['review_year'])
    r['code'] = re.sub(r'[\s-]+', '', r['course_raw'].upper())
    match = re.fullmatch(r'[A-Z]{2,5}(\d{3})[A-Z]?', r['code'])
    number = int(match[1]) if match else 0
    r['level'] = str(number // 100 * 100) if 100 <= number < 500 else 'Unknown'
    r['named'] = r['code'] in courses and bool(courses[r['code']]['titles'])
    r['tags_normalized'] = {t.lower().strip() for t in r['tags'].split(' | ') if t}

def summary(rs):
    if not rs:
        return None
    return {'n': len(rs), 'professors': len({r['pid'] for r in rs}),
            'q': st.mean(r['q'] for r in rs), 'd': st.mean(r['d'] for r in rs),
            'oneStar': sum(r['q'] == 1 for r in rs), 'fiveStar': sum(r['q'] == 5 for r in rs),
            'positive': sum(r['q'] >= 4 for r in rs),
            'distribution': [sum(r['q'] == q for r in rs) for q in range(1, 6)]}

def prof_balanced(rs, minimum=5):
    gs = collections.defaultdict(list)
    for r in rs:
        gs[r['pid']].append(r)
    eligible = [v for v in gs.values() if len(v) >= minimum]
    return {'professors': len(eligible), 'n': sum(map(len, eligible)),
            'q': st.mean(st.mean(r['q'] for r in v) for v in eligible) if eligible else None,
            'positiveShare': st.mean(st.mean(r['q'] >= 4 for r in v) for v in eligible) if eligible else None}

def fit(rs, response='q', hard_only=False):
    counts = collections.Counter(r['department'] for r in rs)
    eligible = sorted(d for d, n in counts.items() if n >= (50 if hard_only else 100))
    rs = [r for r in rs if r['department'] in eligible]
    design, labels = [np.ones(len(rs))], ['intercept']
    factors = [('department', eligible), ('d', sorted({r['d'] for r in rs})),
               ('level', sorted({r['level'] for r in rs})), ('year', sorted({r['year'] for r in rs}))]
    for key, levels in factors:
        for value in levels[1:]:
            design.append(np.array([r[key] == value for r in rs], dtype=float))
            labels.append(f'{key}:{value}')
    x = np.column_stack(design)
    y = np.array([float(r[response]) for r in rs])
    beta = np.linalg.lstsq(x, y, rcond=None)[0]
    residual = y - x @ beta
    ids = sorted({r['pid'] for r in rs})
    ident = {v: i for i, v in enumerate(ids)}
    scores = np.zeros((len(ids), x.shape[1]))
    np.add.at(scores, [ident[r['pid']] for r in rs], x * residual[:, None])
    bread = np.linalg.pinv(x.T @ x)
    cov = bread @ scores.T @ scores @ bread
    cov *= len(ids) / (len(ids) - 1) * (len(rs) - 1) / (len(rs) - x.shape[1])
    comparisons = []
    for a, b in itertools.combinations(eligible, 2):
        contrast = np.zeros(x.shape[1])
        if a != eligible[0]:
            contrast[labels.index(f'department:{a}')] = 1
        if b != eligible[0]:
            contrast[labels.index(f'department:{b}')] -= 1
        diff = float(contrast @ beta)
        se = float(np.sqrt(max(0, contrast @ cov @ contrast)))
        p = math.erfc(abs(diff / se) / math.sqrt(2)) if se else 0
        comparisons.append({'a': a, 'b': b, 'difference': diff, 'se': se,
            'ci95': [diff - 1.96 * se, diff + 1.96 * se], 'p': p})
    ordered = sorted(comparisons, key=lambda r: r['p'])
    last = 1
    for rank in range(len(ordered), 0, -1):
        last = min(last, ordered[rank - 1]['p'] * len(ordered) / rank)
        ordered[rank - 1]['bhAdjustedP'] = last
    return {'n': len(rs), 'professors': len(ids), 'departments': eligible,
            'controls': ['exact difficulty score', '100/200/300/400/unknown course level', 'review year'],
            'uncertainty': 'Professor-clustered sandwich standard errors; normal-approximation intervals; BH adjustment across all department pairs in this fit.',
            'comparisons': comparisons}

out = {'source': 'data/reviews_clean.csv + existing canonical review-key joins + exact-code catalog title matches',
       'limits': ['Exploratory comparisons, selected after looking at this archive.', 'Self-selected reviewers and student-reported measures.',
                  'Neither course difficulty nor department attendance is randomly assigned.', 'Different course mixes, teachers, selection into majors and historical labels can explain associations.',
                  'Review volume is not enrollment; numeric course levels do not establish student year or prerequisite difficulty.'],
       'periods': {}}
for period in ['all', 'recent']:
    rs = rows if period == 'all' else [r for r in rows if 2022 <= r['year'] <= 2026]
    departments = {}
    for department, n in collections.Counter(r['department'] for r in rs).items():
        if n < 40:
            continue
        ds = [r for r in rs if r['department'] == department]
        hard = [r for r in ds if r['d'] >= 4]
        departments[department] = {'all': summary(ds), 'hard': summary(hard),
            'easy': summary([r for r in ds if r['d'] <= 2]), 'hardBalanced': prof_balanced(hard),
            'levels': {level: summary([r for r in ds if r['level'] == level]) for level in ['100', '200', '300', '400']},
            'namedLevels': {level: summary([r for r in ds if r['named'] and r['level'] == level]) for level in ['100', '200', '300', '400']}}
    level_changes = []
    for department in departments:
        groups = collections.defaultdict(lambda: [[], []])
        for r in rs:
            if r['department'] == department and r['level'] in ['100', '200', '300', '400']:
                groups[r['pid']][int(r['level'] in ['300', '400'])].append(r)
        matched = [v for v in groups.values() if len(v[0]) >= 3 and len(v[1]) >= 3]
        if matched:
            changes = [st.mean(r['q'] for r in v[1]) - st.mean(r['q'] for r in v[0]) for v in matched]
            level_changes.append({'department': department, 'professors': len(matched),
                'reviews': sum(len(v[0]) + len(v[1]) for v in matched), 'meanWithinProfessorQualityDifference': st.mean(changes),
                'positiveProfessors': sum(c > 0 for c in changes)})
    out['periods'][period] = {'departments': departments,
        'adjustedQuality': fit(rs), 'adjustedHardQuality': fit([r for r in rs if r['d'] >= 4], hard_only=True),
        'levelChangesWithinProfessor': level_changes}

# Named courses only; generic labels are kept explicit, not secretly merged.
course_reports = []
for code, c in courses.items():
    if c['all']['count'] < 30 or not c['titles']:
        continue
    ds = [r for r in rows if r['code'] == code]
    assert len(ds) == c['all']['count'], code
    hard = [r for r in ds if r['d'] >= 4]
    course_reports.append({'code': code, 'title': c['titles'][0], 'all': summary(ds),
        'recent': summary([r for r in ds if r['year'] >= 2022]), 'hard': summary(hard),
        'balanced': prof_balanced(ds, 3), 'generic': code.startswith(('FYS', 'CORE')) or code.endswith(('199', '299', '399'))})
out['courses'] = course_reports
out['namedCourseCountAtLeast30Reviews'] = len(course_reports)

# Large within-department course gaps at similar reported difficulty.
course_pairs = []
for a, b in itertools.combinations(course_reports, 2):
    if a['generic'] or b['generic'] or a['all']['n'] < 50 or b['all']['n'] < 50:
        continue
    if courses[a['code']]['reviewDepartment'] != courses[b['code']]['reviewDepartment']:
        continue
    if abs(a['all']['d'] - b['all']['d']) > .4 or abs(a['all']['q'] - b['all']['q']) < .5:
        continue
    pa = {r['pid'] for r in rows if r['code'] == a['code']}
    pb = {r['pid'] for r in rows if r['code'] == b['code']}
    shared = []
    for pid in pa & pb:
        ar = [r for r in rows if r['pid'] == pid and r['code'] == a['code']]
        br = [r for r in rows if r['pid'] == pid and r['code'] == b['code']]
        if len(ar) >= 3 and len(br) >= 3:
            shared.append(st.mean(r['q'] for r in ar) - st.mean(r['q'] for r in br))
    course_pairs.append({'a': a['code'], 'b': b['code'], 'department': courses[a['code']]['reviewDepartment'],
        'qualityDifference': a['all']['q'] - b['all']['q'], 'difficultyDifference': a['all']['d'] - b['all']['d'],
        'sharedProfessorsAtLeast3ReviewsPerCourse': len(shared), 'withinProfessorDifference': st.mean(shared) if shared else None})
out['similarDifficultyCoursePairs'] = course_pairs
path = ROOT / 'output/department-research.json'
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(out, indent=2))
print('Completed department, course-level, hard-review, adjusted-pair and course-outlier scans.')
print('Saved exploratory output; website statistics and original models unchanged.')
