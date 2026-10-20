"""Build reviewed room crops and a coverage report from source-linked annotations.

Run with the bundled Python (Pillow and pypdf) and pdftoppm on PATH.
Coordinates are normalized against the displayed, rotated source page.
Unreviewed annotations never become published room views.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import tempfile
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/housing'


def read(path):
    return json.loads(path.read_text())


def main():
    index = read(DATA / 'index.json')
    records = {r['record_id']: r for r in read(DATA / 'room-descriptions.json')}
    source_records = set(records)
    records.update({r['record_id']: r for r in read(DATA / 'source-room-records.json')})
    plans = {p['id']: p for e in index['places'].values() for p in e['plans']}
    annotations = [a for f in sorted((DATA / 'annotations').glob('*.json'))
                   for a in read(f)['rooms']]
    output = {'version': 2, 'rooms': {}}
    previous = read(DATA / 'room-layouts.json')['rooms'] if (DATA / 'room-layouts.json').exists() else {}
    seen = set()
    with tempfile.TemporaryDirectory() as temp:
        for a in annotations:
            key = a['recordId']
            if key in seen:
                raise ValueError(f'Duplicate annotation: {key}')
            seen.add(key)
            if a['status'] != 'reviewed':
                continue
            record, plan = records[key], plans[a['planId']]
            assert record['room_id'] == a['roomId'], key
            assert record['building_id'] == plan['buildingId'], key
            assert record['floor_label'] == plan['floorLabel'], key
            source = ROOT / plan['originalUrl']
            assert hashlib.sha256(source.read_bytes()).hexdigest() == a['sourceSha256'] == plan['sha256'], key
            assert 1 <= a['page'] <= len(plan['pages']), key
            x0, y0, x1, y1 = a['bounds']
            assert 0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1, key
            assert a['reviewedOn'] and a['includes'], key
            cached = previous.get(key)
            if cached and all(cached.get(k) == v for k, v in a.items()) and (ROOT / cached['url']).exists():
                output['rooms'][key] = cached
                continue
            if plan['format'] == 'pdf':
                page = PdfReader(source).pages[a['page'] - 1]
                w, h = float(page.mediabox.width), float(page.mediabox.height)
                if page.rotation % 180:
                    w, h = h, w
                dpi = 900
                w, h = math.ceil(w * dpi / 72), math.ceil(h * dpi / 72)
                left, top = math.floor(x0 * w), math.floor(y0 * h)
                width, height = math.ceil(x1 * w) - left, math.ceil(y1 * h) - top
                prefix = Path(temp) / key
                subprocess.run(['pdftoppm', '-f', str(a['page']), '-singlefile',
                                '-r', str(dpi), '-x', str(left), '-y', str(top),
                                '-W', str(width), '-H', str(height), '-png',
                                str(source), str(prefix)], check=True, capture_output=True)
                image = Image.open(prefix.with_suffix('.png')).convert('RGB')
            else:
                with Image.open(source) as original:
                    image = original.convert('RGB').crop((math.floor(x0 * original.width),
                        math.floor(y0 * original.height), math.ceil(x1 * original.width),
                        math.ceil(y1 * original.height)))
            dest = DATA / 'room-layouts' / f"{plan['buildingId']}-{a['roomId']}.webp"
            dest.parent.mkdir(exist_ok=True)
            if a.get('displayRotation'):
                image = image.rotate(a['displayRotation'], expand=True)
            image.save(dest, 'WEBP', lossless=True)
            output['rooms'][key] = {**a, 'url': dest.relative_to(ROOT).as_posix(),
                'width': image.width, 'height': image.height,
                'method': 'Visually reviewed crop of the original university drawing; no redrawing.'}
            print(f"Rendered {key}", flush=True)
    (DATA / 'room-layouts.json').write_text(json.dumps(output, indent=2) + '\n')
    report = {'version': 1, 'countUnit': 'source description records, not certified physical rooms', 'places': {}}
    for place_id, entry in index['places'].items():
        relevant = [r for r in records.values() if r['building_id'] in entry['buildingIds'] and r['record_id'] in source_records]
        mapped = [r for r in relevant if r['record_id'] in output['rooms']]
        report['places'][place_id] = {'sourceRecords': len(relevant), 'reviewedViews': len(mapped),
            'additionalSourceRoomViews': sum(r['record_id'] not in source_records and r['record_id'] in output['rooms'] and r['building_id'] in entry['buildingIds'] for r in records.values()),
            'remainingRecordIds': [r['record_id'] for r in relevant if r['record_id'] not in output['rooms']],
            'pages': [{'planId': p['id'], 'page': page['page'], 'legacy': p['legacy'],
                'reviewedViews': sum(a['planId'] == p['id'] and a['page'] == page['page']
                    for a in output['rooms'].values())} for p in entry['plans'] for page in p['pages']]}
    (DATA / 'room-layout-coverage.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"Rendered {len(output['rooms'])} reviewed views; accounted for {len(plans)} source documents.")


if __name__ == '__main__':
    main()
