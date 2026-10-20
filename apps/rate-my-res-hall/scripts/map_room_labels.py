"""Locate exact, unique PDF text labels matching published rooms on the same floor.
No OCR guesses, room polygons, adjacency or inferred suite geometry.
"""
from pathlib import Path
import json,re,collections
import pdfplumber
ROOT=Path(__file__).resolve().parents[1]
index=json.loads((ROOT/'data/housing/index.json').read_text())
rooms=json.loads((ROOT/'data/housing/room-descriptions.json').read_text())
def key(s):
 m=re.fullmatch(r'([A-Z]*)(\d+)([A-Z]*)',str(s or '').upper().strip())
 return (m[1],str(int(m[2])),m[3]) if m else None
out={'version':1,'method':'unique exact PDF text label joined to a same-building, same-floor source record; leading zeroes normalized; no inferred room outlines','pages':{}}
counts=collections.Counter()
for entry in index['places'].values():
 for plan in entry['plans']:
  if plan['format']!='pdf' or plan['legacy']:continue
  records=collections.defaultdict(list)
  for r in rooms:
   if r['building_id']==plan['buildingId'] and r['floor_label']==plan['floorLabel'] and r['room_id']:records[key(r['room_id'])].append(r)
  with pdfplumber.open(ROOT/plan['originalUrl']) as pdf:
   for page_no,page in enumerate(pdf.pages):
    words=page.extract_words(x_tolerance=.3,y_tolerance=.3)
    candidates=collections.defaultdict(list)
    for w in words:
     k=key(w['text'])
     if k in records and len(records[k])==1:candidates[k].append(w)
    markers=[]
    for k,words in candidates.items():
     # Reject repeated numbers and title-block / page-edge text.
     if len(words)!=1:continue
     w=words[0];x=(w['x0']+w['x1'])/2/page.width;y=(w['top']+w['bottom'])/2/page.height
     if not(.035<x<.94 and .035<y<.94):continue
     r=records[k][0]
     markers.append({'recordId':r['record_id'],'roomId':r['room_id'],'label':w['text'],'x':x,'y':y,'bbox':[w['x0']/page.width,w['top']/page.height,w['x1']/page.width,w['bottom']/page.height]})
    out['pages'][f"{plan['id']}:{page_no+1}"]={'markers':markers,'sourceSha256':plan['sha256']}
    counts[plan['buildingId']]+=len(markers)
(ROOT/'data/housing/room-labels.json').write_text(json.dumps(out,indent=2)+'\n')
print(dict(counts));print('total',sum(counts.values()))
