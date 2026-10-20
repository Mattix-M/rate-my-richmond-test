"""Restyle real PDF vectors; never infer geometry from raster plans.

Requires pdfplumber. Reviewed crop coordinates and source hashes are verified.
Text keeps its original glyph positions/rotation, with a common sans-serif font.
Raster/mixed pages and unsupported glyphs fall back to original source drawings.
These are automatic vector restyles, not individually reviewed manual redraws.
"""
from pathlib import Path
import hashlib, html, json, math
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/housing'
OUT = DATA / 'clean-plans/generated'


def num(n):
    if not math.isfinite(float(n)): raise ValueError('Non-finite source coordinate')
    return f'{n:.4f}'.rstrip('0').rstrip('.') or '0'


def overlaps(obj, box):
    return obj['x1'] >= box[0] and obj['x0'] <= box[2] and obj['bottom'] >= box[1] and obj['top'] <= box[3]


def path_data(obj):
    segments = []
    for part in obj['path']:
        op = part[0]
        if op not in ('m', 'l', 'c', 'h'): raise ValueError(f'Unsupported PDF path {op}')
        segments.append(('Z' if op == 'h' else op.upper()) + ' '.join(num(v) for xy in part[1:] for v in xy))
    return ' '.join(segments)


def is_white(color):
    return color == 1 or isinstance(color, (tuple, list)) and len(color) in (1, 3) and all(v == 1 for v in color)


def svg(page, objects, box, label, provenance, rotation=0):
    x0, y0, x1, y1 = box
    width, height = x1-x0, y1-y0
    rotation = rotation % 360
    transforms = {0: '', 90: f'translate(0 {num(width)}) rotate(-90)', 180: f'translate({num(width)} {num(height)}) rotate(180)', 270: f'translate({num(height)} 0) rotate(90)'}
    if rotation not in transforms: raise ValueError('Non-orthogonal reviewed rotation')
    ow, oh = (height, width) if rotation % 180 else (width, height)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {num(ow)} {num(oh)}" role="img" aria-labelledby="title desc">', f'<title id="title">{html.escape(label)}</title>', '<desc id="desc">Source-preserving vector restyle. Original walls, openings, fixtures and text positions retained. This is not a measured survey or a manual architectural redraw.</desc>', f'<metadata>{html.escape(json.dumps(provenance, separators=(",", ":")))}</metadata>', '<rect width="100%" height="100%" fill="#faf9f5"/>', f'<g transform="{transforms[rotation]}"><svg width="{num(width)}" height="{num(height)}" viewBox="{num(x0)} {num(y0)} {num(width)} {num(height)}" overflow="hidden">']
    for obj in objects:
        if not overlaps(obj, box): continue
        fill = ('#faf9f5' if is_white(obj.get('non_stroking_color')) else '#566559') if obj.get('fill') else 'none'
        stroke = ('#faf9f5' if is_white(obj.get('stroking_color')) else '#566559') if obj.get('stroke') else 'none'
        weight = max(page.width/5000, min(obj.get('linewidth', 0) or 0, page.width/500))
        parts.append(f'<path d="{path_data(obj)}" fill="{fill}" stroke="{stroke}" stroke-width="{num(weight)}" stroke-linejoin="round" stroke-linecap="round" fill-rule="{"evenodd" if obj.get("evenodd") else "nonzero"}"/>')
    # PDF text matrices preserve orientation, including sideways floor drawings.
    # textLength preserves source advances despite font replacement.
    parts.append('<g fill="#344d40" font-family="Arial,Helvetica,sans-serif" font-size="1">')
    for char in page.chars:
        if not overlaps(char, box) or not char['text'].strip(): continue
        a,b,c,d,e,f = char['matrix']
        advance = float(char.get('adv', 0))
        # Recover PDF font size from glyph bounds and the text matrix.
        # Some files put font size in the matrix; others use a separate Tf size.
        if abs(d) >= abs(c) and abs(d) > 1e-10:
            font_size = (char['height'] - abs(b*advance))/abs(d)
        elif abs(c) > 1e-10:
            font_size = (char['width'] - abs(a*advance))/abs(c)
        else:
            raise ValueError('Degenerate source text transform')
        if not math.isfinite(font_size) or font_size <= 0:
            raise ValueError('Unrecoverable source font size')
        extra = f' textLength="{num(advance)}" lengthAdjust="spacingAndGlyphs"' if advance > 0 else ''
        matrix = ' '.join(num(v) for v in (a,-b,-c,d,e,page.height-f))
        parts.append(f'<text font-size="{num(font_size)}" transform="matrix({matrix})"{extra}>{html.escape(char["text"])}</text>')
    parts.extend(['</g></svg></g></svg>'])
    return '\n'.join(parts), ow, oh


def main():
    index = json.loads((DATA/'index.json').read_text())
    rooms = json.loads((DATA/'room-layouts.json').read_text())['rooms']
    plans = {p['id']: p for entry in index['places'].values() for p in entry['plans']}
    result = {'version': 1, 'method': 'Automatic source-vector restyle; preserves source geometry and text placement. Not manually redrawn.', 'pages': {}, 'rooms': {}, 'report': {'pageAudit': [], 'skippedRooms': []}}
    OUT.mkdir(parents=True, exist_ok=True)
    for plan in plans.values():
        source = ROOT/plan['originalUrl']
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != plan['sha256']: raise ValueError(f'Source hash mismatch {plan["id"]}')
        if plan['format'] != 'pdf':
            for preview in plan['pages']: result['report']['pageAudit'].append({'planId': plan['id'], 'page': preview['page'], 'status': 'skipped', 'reason': 'Raster source'})
            continue
        with pdfplumber.open(source) as pdf:
            for preview in plan['pages']:
                page = pdf.pages[preview['page']-1]
                # Keep PDF paint order: white masking fills must precede later walls.
                if abs((page.width/page.height)/(preview['width']/preview['height'])-1) > .01:
                    raise ValueError(f'Source/preview aspect mismatch {plan["id"]}')
                objects = [obj for obj in page.iter_layout_objects(page.layout._objs) if obj['object_type'] in ('line', 'rect', 'curve')]
                image_coverage = sum(max(0,i['width'])*max(0,i['height']) for i in page.images)/(page.width*page.height)
                audit = {'planId': plan['id'], 'page': preview['page'], 'vectorCount': len(objects), 'charCount': len(page.chars), 'imageCoverage': round(image_coverage, 5), 'status': 'skipped'}
                result['report']['pageAudit'].append(audit)
                reason = ('Raster or mixed-source page' if image_coverage > .01 else 'Insufficient source vector geometry' if len(objects)<20 else 'Unresolved source font glyphs' if any('(cid:' in c['text'] or '\ufffd' in c['text'] for c in page.chars) else None)
                if reason: audit['reason'] = reason; continue
                try:
                    meta = {'renderKind': 'source-vectors', 'sourceSha256': digest, 'planId': plan['id'], 'pageNumber': preview['page'], 'sourceWidth': page.width, 'sourceHeight': page.height, 'method': 'Source vector restyle'}
                    label = f'{plan["buildingId"].replace("-", " ").title()} · {plan["label"]}'
                    drawing,_,_ = svg(page, objects, (0,0,page.width,page.height), label, meta)
                    name = f'{plan["id"]}-{preview["page"]}.svg'
                    (OUT/name).write_text(drawing)
                    result['pages'][f'{plan["id"]}:{preview["page"]}'] = {**meta, 'url': f'./data/housing/clean-plans/generated/{name}', 'width': preview['width'], 'height': preview['height'], 'label': label, 'provenance': result['method']}
                    audit['status'] = 'generated'
                    for rid, room in rooms.items():
                        if room['planId'] != plan['id'] or room['page'] != preview['page']: continue
                        if room['status'] != 'reviewed' or room['sourceSha256'] != digest: raise ValueError(f'Unreviewed or stale crop {rid}')
                        bounds = room['bounds']
                        if not (0 <= bounds[0] < bounds[2] <= 1 and 0 <= bounds[1] < bounds[3] <= 1): raise ValueError(f'Invalid bounds {rid}')
                        box = (bounds[0]*page.width,bounds[1]*page.height,bounds[2]*page.width,bounds[3]*page.height)
                        if sum(overlaps(o,box) for o in objects)<8:
                            result['report']['skippedRooms'].append({'recordId':rid,'reason':'Insufficient vector geometry in reviewed crop'}); continue
                        room_label = f'{plan["buildingId"].replace("-", " ").title()} · Room {room["roomId"]}'
                        drawing,w,h = svg(page, objects, box, room_label, {**meta, 'recordId':rid,'bounds':bounds}, room.get('displayRotation',0))
                        filename = f'{rid}.svg'
                        (OUT/filename).write_text(drawing)
                        result['rooms'][rid] = {**meta,'url':f'./data/housing/clean-plans/generated/{filename}','width':round(w*4,3),'height':round(h*4,3),'bounds':bounds,'label':room_label,'provenance':result['method']}
                except (ValueError, KeyError, TypeError) as error:
                    raise RuntimeError(f'Failed source extraction {plan["id"]}:{preview["page"]}') from error
                print(f'{plan["id"]}:{preview["page"]}: {audit["status"]}, {len(objects)} vectors', flush=True)
    result['report']['generatedPages'] = len(result['pages'])
    result['report']['generatedRooms'] = len(result['rooms'])
    result['report']['skippedPages'] = sum(a['status']=='skipped' for a in result['report']['pageAudit'])
    (DATA/'clean-vector-assets.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result['report'].items() if not isinstance(v,list)}))

if __name__ == '__main__': main()
