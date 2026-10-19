"""Derive course summaries from the existing archive. No model refits or live scraping."""
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def summary(rows):
    if not rows:
        return None
    tags = collections.Counter(tag for row in rows for tag in sorted({t.strip().lower() for t in row['tags'] if t.strip()}))
    return {
        'count': len(rows),
        'quality': round(sum(r['quality'] for r in rows) / len(rows), 6),
        'difficulty': round(sum(r['difficulty'] for r in rows) / len(rows), 6),
        'latest': max(r['date'] for r in rows),
        'distribution': [sum(r['quality'] == n for r in rows) for n in range(1, 6)],
        'tags': [{'tag': k.capitalize(), 'count': v} for k, v in sorted(tags.items(), key=lambda t: (-t[1], t[0]))[:5]],
    }

def generate():
    model = json.loads((ROOT / 'src/lib/data.json').read_text())
    prof_departments = {p['id']: p['department'] for p in model['professors']}
    courses = collections.defaultdict(list)
    evidence = {}
    total = 0
    for professor in model['professors']:
        rows = json.loads((ROOT / 'public/reviews' / (professor['id'] + '.json')).read_text())
        evidence[professor['id']] = {'latest': max(r['date'] for r in rows), 'count': len(rows)}
        total += len(rows)
        for row in rows:
            code = re.sub(r'[\s-]+', '', row['course'].upper())
            # Do not infer departments for labels such as "101", or merge BIO with BIOL.
            if re.fullmatch(r'[A-Z]{2,5}\d{3}[A-Z]?', code):
                courses[code].append((professor['id'], row))
    output = []
    verified_titles = json.loads((ROOT / 'src/lib/course-titles.json').read_text())
    catalog = json.loads((ROOT / 'src/lib/catalog-titles.json').read_text())
    for code, entries in sorted(courses.items()):
        rows = [r for _, r in entries]
        by_professor = collections.defaultdict(list)
        for ident, row in entries:
            by_professor[ident].append(row)
        output.append({
            'titles': list(dict.fromkeys(([verified_titles[code]['title']] if verified_titles.get(code, {}).get('title') else [])
                                        + catalog['courses'].get(code, {}).get('titles', []))),
            'titleSourceUrl': verified_titles[code]['sourceUrl'] if verified_titles.get(code, {}).get('title')
                              else catalog['meta']['sourceUrl'] if code in catalog['courses'] else None,
            'code': code, 'subject': re.match(r'[A-Z]+', code).group(),
            'reviewDepartment': sorted(collections.Counter(prof_departments[ident] for ident, _ in entries).items(), key=lambda t: (-t[1], t[0]))[0][0],
            'all': summary(rows), 'recent': summary([r for r in rows if 2022 <= r['year'] <= 2026]),
            'professors': [{'id': ident, 'all': summary(rs), 'recent': summary([r for r in rs if 2022 <= r['year'] <= 2026])}
                           for ident, rs in sorted(by_professor.items())],
        })
    meta = {'totalReviews': total, 'indexedReviews': sum(c['all']['count'] for c in output),
            'latestReview': max(v['latest'] for v in evidence.values()), 'courseCount': len(output),
            'source': 'Existing anonymous Rate My Professors review archive',
            'normalization': 'Uppercase; remove spaces and hyphens; require a 2–5 letter subject and 3-digit number. No inferred aliases.'}
    meta['namedCourseCount'] = sum(bool(c['titles']) for c in output)
    meta['titleSource'] = catalog['meta']
    # Exclude generic/special-topic labels and require enough evidence for the game.
    titles = json.loads((ROOT / 'src/lib/course-titles.json').read_text())
    for code, entry in titles.items():
        assert entry['sourceUrl'] == 'https://catalog.richmond.edu/courses/' + code
    game = [{'code': c['code'], 'title': titles[c['code']]['title'], 'sourceUrl': titles[c['code']]['sourceUrl'],
             'department': c['reviewDepartment'], 'count': c['all']['count'], 'difficulty': c['all']['difficulty'], 'latest': c['all']['latest']}
            for c in output if c['all']['count'] >= 20 and c['subject'] not in {'FYS', 'CORE'} and not c['code'].endswith('199')
            and titles.get(c['code'], {}).get('title')]
    return {'public/courses-index.json': {'meta': meta, 'courses': output},
            'src/lib/course-game.json': game,
            'src/lib/review-evidence.json': {'meta': meta, 'professors': evidence}}

if __name__ == '__main__':
    for path, value in generate().items():
        target = ROOT / path
        if '--check' in sys.argv:
            assert json.loads(target.read_text()) == value, path + ' is stale'
        else:
            target.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')))
    print('PASS: course index, exact course/professor joins, review dates and game pool match the archive.')
