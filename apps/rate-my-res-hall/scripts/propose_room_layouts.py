"""Propose source crops, never publish them without visual review.

Input work directory contains pages.json (rendered source pages), optional OCR
jobs/results from recognize_plan_text.swift. Requires OpenCV, numpy and Pillow.
Output candidates.json, expanded-labels.json and contact sheets in work dir.
"""
from pathlib import Path
import argparse, json, re, collections
import cv2
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]


def room_key(value):
    match=re.fullmatch(r'([A-Z]*)(\d+)([A-Z]*)',str(value or '').upper())
    return (match[1],str(int(match[2])),match[3]) if match else None


def propose(work, digital_only=False):
    pages=json.loads((work/'pages.json').read_text())
    labels=json.loads((work/'labels.json' if (work/'labels.json').exists() else ROOT/'data/housing/room-labels.json').read_text())
    records=json.loads((ROOT/'data/housing/room-descriptions.json').read_text())
    records += json.loads((ROOT/'data/housing/source-room-records.json').read_text())
    existing={a['recordId']:a for f in (ROOT/'data/housing/annotations').glob('*.json') for a in json.loads(f.read_text())['rooms']}
    jobs={j['id']:j for j in json.loads((work/'ocr-jobs.json').read_text())}
    ocr=collections.defaultdict(list)
    if (work/'ocr.jsonl').exists() and not digital_only:
        for line in (work/'ocr.jsonl').read_text().splitlines():
            try: result=json.loads(line)
            except json.JSONDecodeError: continue
            job=jobs[result['id']];page=pages[job['pageKey']]
            for word in result.get('words',[]):
                bbox=[(job['x']+word['x0']*job['width'])/page['width'],(job['y']+word['y0']*job['height'])/page['height'],(job['x']+word['x1']*job['width'])/page['width'],(job['y']+word['y1']*job['height'])/page['height']]
                ocr[job['pageKey']].append({**word,'bbox':bbox,'x':(bbox[0]+bbox[2])/2,'y':(bbox[1]+bbox[3])/2})
    expanded={'version':2,'method':'PDF text plus candidate local OCR; OCR locations require review','pages':{}}
    candidates=[]
    for key,page in pages.items():
        plan=page['plan'];markers=list(labels['pages'].get(key,{}).get('markers',[]))
        floor_records=collections.defaultdict(list)
        for record in records:
            if record['building_id']==plan['buildingId'] and record['floor_label']==plan['floorLabel'] and record['room_id']:
                floor_records[room_key(record['room_id'])].append(record)
        grouped=collections.defaultdict(list)
        for word in ocr[key]:
            k=room_key(word['text'][1:] if plan['buildingId']=='keller-hall' and word['text'].startswith('K') else word['text'])
            if k not in floor_records or len(floor_records[k])!=1: continue
            # Overlapping tiles may see the same label; merge only nearby occurrences.
            if not any(abs(w['x']-word['x'])*page['width']<35 and abs(w['y']-word['y'])*page['height']<35 for w in grouped[k]):grouped[k].append(word)
        for k,words in grouped.items():
            if len(words)!=1:continue
            word=words[0];record=floor_records[k][0]
            if any(m['recordId']==record['record_id'] for m in markers):continue
            if not(.02<word['x']<.98 and .02<word['y']<.98):continue
            markers.append({'recordId':record['record_id'],'roomId':record['room_id'],'label':word['text'],'x':word['x'],'y':word['y'],'bbox':word['bbox'],'method':'local-ocr','confidence':word['confidence']})
        expanded['pages'][key]={'sourceSha256':plan['sha256'],'markers':markers}
        if not markers:continue
        image=cv2.imread(page['path']);h,w=image.shape[:2]
        binary=(cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)<160).astype(np.uint8)
        _,components,stats,_=cv2.connectedComponentsWithStats(binary)
        keep=np.where(stats[:,4]>350)[0];keep=keep[keep!=0]
        wall=np.isin(components,keep).astype(np.uint8)
        choices={m['recordId']:[] for m in markers}
        for size in [15,25,40,60,85,110]:
            barrier=cv2.morphologyEx(wall,cv2.MORPH_CLOSE,np.ones((1,size),np.uint8))
            barrier=cv2.morphologyEx(barrier,cv2.MORPH_CLOSE,np.ones((size,1),np.uint8))
            _,component,stats,_=cv2.connectedComponentsWithStats(1-barrier)
            for m in markers:
                if m['recordId'] in existing:continue
                x,y=round(m['x']*w),round(m['y']*h)
                ids={int(component[max(0,min(h-1,y+dy)),max(0,min(w-1,x+dx))]) for dx,dy in [(0,-25),(-25,0),(25,0),(0,25),(0,-45),(45,0),(-45,0)]}
                for cid in ids:
                    if not cid:continue
                    xx,yy,ww,hh,area=stats[cid]
                    if area<1800 or area>w*h*.05 or ww>1400 or hh>1400 or min(ww,hh)<60:continue
                    if not(xx<=x<=xx+ww and yy<=y<=yy+hh):continue
                    others=[q for q in markers if xx<q['x']*w<xx+ww and yy<q['y']*h<yy+hh]
                    if len(others)!=1:continue
                    choices[m['recordId']].append((int(area),[int(xx),int(yy),int(xx+ww),int(yy+hh)],size))
        for marker in markers:
            options=choices[marker['recordId']]
            if not options:continue
            area,bounds,size=max(options,key=lambda item:item[0])
            # Include wall strokes bordering the enclosed space.
            bounds=[max(0,bounds[0]-12)/w,max(0,bounds[1]-12)/h,min(w,bounds[2]+12)/w,min(h,bounds[3]+12)/h]
            x0,y0,x1,y1=bounds
            candidates.append({'recordId':marker['recordId'],'roomId':marker['roomId'],'planId':plan['id'],'page':page['page']['page'],'sourceSha256':plan['sha256'],'bounds':bounds,'hitRegion':[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],'hitRegionKind':'selection-area','labelPosition':[marker['x'],marker['y']],'includes':[f"Room {marker['roomId']} area"],'viewKind':'room-area','status':'pending-review','note':'Source crop of the room area. Separate bathroom or suite spaces may not be included.','candidateMethod':f"{marker.get('method','pdf-text')}; enclosed-space candidate; closing {size}px",'buildingId':plan['buildingId']})
        print(plan['buildingId'],key,len(markers),'labels',sum(bool(v) for v in choices.values()),'candidates',flush=True)
    (work/'expanded-labels.json').write_text(json.dumps(expanded,indent=2)+'\n')
    (work/'candidates.json').write_text(json.dumps(candidates,indent=2)+'\n')
    grouped=collections.defaultdict(list)
    for candidate in candidates:grouped[candidate['buildingId']].append(candidate)
    manifest={}
    for building,items in grouped.items():
        items.sort(key=lambda a:(a['roomId'],a['planId'],a['page']))
        for batch in range(0,len(items),24):
            sheet=Image.new('RGB',(1800,1600),'#e8ece5');draw=ImageDraw.Draw(sheet)
            selected=items[batch:batch+24];sheet_id=f'{building}-{batch//24+1}'
            manifest[sheet_id]=[]
            for i,a in enumerate(selected):
                page=pages[f"{a['planId']}:{a['page']}"];image=Image.open(page['path'])
                b=a['bounds'];crop=image.crop((int(b[0]*image.width),int(b[1]*image.height),int(b[2]*image.width),int(b[3]*image.height)));crop.thumbnail((285,355))
                x=(i%6)*300;y=(i//6)*400;sheet.paste(crop,(x+(300-crop.width)//2,y+35))
                draw.text((x+8,y+8),f"{i+1}. {a['roomId']} ({a['recordId'][-4:]})",fill='black')
                manifest[sheet_id].append({'recordId':a['recordId'],'planId':a['planId'],'page':a['page']})
            sheet.save(work/f'{sheet_id}.jpg',quality=92)
    (work/'review-sheets.json').write_text(json.dumps(manifest,indent=2))
    print(len(candidates),'candidates;',len(manifest),'review sheets',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('work',type=Path);parser.add_argument('--digital-only',action='store_true');args=parser.parse_args();propose(args.work,args.digital_only)
