"""Trace monochrome source pixels without inferring walls or replacing text.

Pixel-run rectangles merge vertically into lossless threshold-mask geometry.
Unlike simplified contours, this retains one-pixel lines and glyph counters.
It is a raster tracing, NOT an architectural redraw or OCR transcription.
Requires Pillow and numpy. Only pages excluded by generate_clean_vectors run.
"""
from pathlib import Path
import hashlib, html, json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/housing'
OUT = DATA / 'clean-plans/raster'
METHOD = 'Automatic monochrome raster tracing; source ink and text shapes retained as pixel geometry. Not an architectural redraw.'


def rectangles(mask):
    """Exact disjoint union of foreground pixels, merged into vertical runs."""
    active, result = {}, []
    for y, row in enumerate(mask):
        edges = np.flatnonzero(np.diff(np.pad(row.astype(np.int8), (1, 1))))
        runs = {(int(a), int(b)) for a, b in zip(edges[::2], edges[1::2])}
        for key in active.keys() - runs:
            start = active[key]
            result.append((key[0], start, key[1], y))
        active = {key: active.get(key, y) for key in runs}
    result.extend((key[0], start, key[1], len(mask)) for key, start in active.items())
    return result


def trace(source, label, provenance):
    image = Image.open(source).convert('RGB')
    rgb = np.asarray(image, dtype=np.int16)
    gray = np.asarray(image.convert('L'))
    # Colored annotations must not silently become indistinguishable from walls.
    colored = (rgb.max(axis=2)-rgb.min(axis=2)>45) & (gray<235)
    color_ratio = float(colored.mean())
    if color_ratio > .003:
        raise ValueError(f'Colored source annotations ({color_ratio:.4f})')
    mask = gray < 170
    density = float(mask.mean())
    paper = float((gray > 225).mean())
    if not .001 < density < .30 or paper < .65:
        raise ValueError(f'Unsuitable ink/paper balance ({density:.4f}/{paper:.4f})')
    rects = rectangles(mask)
    if len(rects) > 140000:
        raise ValueError(f'Excessive tracing complexity ({len(rects)} runs)')
    rebuilt = np.zeros_like(mask)
    for x0,y0,x1,y1 in rects:
        rebuilt[y0:y1,x0:x1] = True
    union = np.count_nonzero(mask | rebuilt)
    iou = float(np.count_nonzero(mask & rebuilt)/union) if union else 0
    if iou < .99999:
        raise ValueError(f'Pixel reconstruction failed ({iou})')
    # No source antialiasing or grayscale shading is falsely presented as geometry.
    ambiguous = float(((gray>=100)&(gray<=205)).mean())
    if ambiguous > .09:
        raise ValueError(f'Excessive intermediate tones ({ambiguous:.4f})')
    w,h=image.size
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">',f'<title id="title">{html.escape(label)}</title>',f'<desc id="desc">{METHOD} Text is preserved as source outlines. Original drawing remains available.</desc>',f'<metadata>{html.escape(json.dumps(provenance,separators=(",", ":")))}</metadata>','<rect width="100%" height="100%" fill="#faf9f5"/>']
    # Each subpath is a closed source-pixel rectangle; holes stay unpainted.
    for offset in range(0,len(rects),3000):
        commands=''.join(f'M{x0} {y0}H{x1}V{y1}H{x0}Z' for x0,y0,x1,y1 in rects[offset:offset+3000])
        parts.append(f'<path fill="#344d40" d="{commands}"/>')
    parts.append('</svg>')
    metrics={'maskIoU':iou,'inkRatio':round(density,6),'colorRatio':round(color_ratio,6),'intermediateToneRatio':round(ambiguous,6),'rectangleCount':len(rects),'threshold':170}
    return '\n'.join(parts),w,h,metrics


def main():
    native=json.loads((DATA/'clean-vector-assets.json').read_text())
    index=json.loads((DATA/'index.json').read_text())
    rooms=json.loads((DATA/'room-layouts.json').read_text())['rooms']
    plans={p['id']:p for entry in index['places'].values() for p in entry['plans']}
    excluded={(a['planId'],a['page']) for a in native['report']['pageAudit'] if a['status']=='skipped'}
    result={'version':1,'method':METHOD,'pages':{},'rooms':{},'report':{'pageAudit':[],'skippedRooms':[]}}
    OUT.mkdir(parents=True,exist_ok=True)
    for pid,page in sorted(excluded):
        plan=plans[pid]
        digest=hashlib.sha256((ROOT/plan['originalUrl']).read_bytes()).hexdigest()
        if digest!=plan['sha256']:raise ValueError(f'Stale source {pid}')
        preview=next(p for p in plan['pages'] if p['page']==page)
        meta={'renderKind':'raster-trace','sourceSha256':digest,'planId':pid,'pageNumber':page,'method':METHOD}
        label=f'{plan["buildingId"].replace("-"," ").title()} · {plan["label"]}'
        audit={'planId':pid,'page':page,'status':'skipped'}
        result['report']['pageAudit'].append(audit)
        try:
            source=ROOT/preview['url']
            drawing,w,h,metrics=trace(source,label,meta)
            name=f'{pid}-{page}.svg'
            (OUT/name).write_text(drawing)
            result['pages'][f'{pid}:{page}']={**meta,'url':f'./data/housing/clean-plans/raster/{name}','width':w,'height':h,'label':label,'provenance':METHOD,'traceSourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'quality':metrics}
            audit.update(status='generated',quality=metrics)
        except ValueError as error:
            audit['reason']=str(error)
        for rid,room in rooms.items():
            if room['planId']!=pid or room['page']!=page:continue
            if room['status']!='reviewed' or room['sourceSha256']!=digest:raise ValueError(f'Stale room {rid}')
            try:
                source=ROOT/room['url']
                # Reviewed rendered crops already apply displayRotation.
                label=f'{plan["buildingId"].replace("-"," ").title()} · Room {room["roomId"]}'
                drawing,w,h,metrics=trace(source,label,{**meta,'recordId':rid,'bounds':room['bounds']})
                name=f'{rid}.svg'
                (OUT/name).write_text(drawing)
                result['rooms'][rid]={**meta,'url':f'./data/housing/clean-plans/raster/{name}','width':w,'height':h,'bounds':room['bounds'],'label':label,'provenance':METHOD,'traceSourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'quality':metrics}
            except ValueError as error:
                result['report']['skippedRooms'].append({'recordId':rid,'reason':str(error)})
        print(f'{pid}:{page}: {audit["status"]}',flush=True)
    result['report'].update(generatedPages=len(result['pages']),generatedRooms=len(result['rooms']),skippedPages=sum(a['status']=='skipped' for a in result['report']['pageAudit']))
    (DATA/'clean-raster-assets.json').write_text(json.dumps(result,indent=2)+'\n')
    print({k:v for k,v in result['report'].items() if not isinstance(v,list)})

if __name__=='__main__':main()
