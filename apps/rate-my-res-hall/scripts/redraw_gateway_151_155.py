"""Gateway semantic drawings: native architecture, rebuilt readable labels and room regions.
Outlined CAD glyph curves are deliberately omitted. Source coordinate system stays
unchanged so the existing reviewed bedroom hotspots retain their alignment.
"""
from pathlib import Path
import json,sys,html
import pdfplumber,numpy as np
from PIL import Image
sys.path.insert(0,'/tmp/res-hall-libs');import cv2
from generate_clean_vectors import path_data,is_white
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/housing';OUT=D/'clean-plans/manual-gateway-151-155';OUT.mkdir(exist_ok=True)
plans=[p for p in json.loads((D/'index.json').read_text())['places']['572073']['plans'] if p['buildingId'] in ('gateway-151','gateway-155')]
rooms=json.loads((D/'annotations/gateway-bedrooms.json').read_text())['rooms'];bounds=json.loads((D/'clean-plans/manual-gateway-floors/reviewed-fit-bounds.json').read_text());manifest={'pages':{}}
for p in plans:
 W,H=p['pages'][0]['width'],p['pages'][0]['height'];q=pdfplumber.open(ROOT/p['originalUrl']).pages[0];sx,sy=W/q.width,H/q.height;b=bounds[p['id']+':1'];box=(b[0]*q.width,b[1]*q.height,b[2]*q.width,b[3]*q.height)
 im=np.array(Image.open(ROOT/p['pages'][0]['url']).convert('L'));_,cc,st,_=cv2.connectedComponentsWithStats((im>245).astype('uint8'),8);done=set();fills=[];labels=[]
 def region(x,y,color,limit=.13,room_bounds=None):
  ix,iy=int(x*W),int(y*H);ids=set(np.unique(cc[max(0,iy-10):iy+11,max(0,ix-10):ix+11]))-{0};ids=[i for i in ids if st[i,cv2.CC_STAT_AREA]>250 and (room_bounds or st[i,cv2.CC_STAT_AREA]<W*H*limit)]
  if not ids:return
  co=max(ids,key=lambda i:st[i,cv2.CC_STAT_AREA]);
  if co in done and not room_bounds:return
  if not room_bounds:done.add(co)
  mask=(cc==co).astype('uint8')
  if room_bounds:
   a,c,d,e=room_bounds;bounded=np.zeros_like(mask);bounded[int(c*H):int(e*H),int(a*W):int(d*W)]=mask[int(c*H):int(e*H),int(a*W):int(d*W)];mask=bounded
  cs,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  for c in cs:
   pts=cv2.approxPolyDP(c,1,True).reshape(-1,2);fills.append('<polygon points="'+' '.join(f'{x},{y}' for x,y in pts)+f'" fill="{color}"/>')
 def label(x,y,text,size=17,bg=None):
  x*=W;y*=H
  if bg:labels.append(f'<rect x="{x-64}" y="{y-16}" width="128" height="27" rx="5" fill="{bg}"/>')
  labels.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="middle" font-size="{size}" font-weight="600" data-room="{html.escape(text)}">{html.escape(text)}</text>')
 for r in rooms:
  if r['planId']!=p['id']:continue
  a,c,d,e=r['bounds'];x=(a+d)/2;y=(c+e)/2;region(x,y,'#e1e9f5',.025,r['bounds']);label(x,y,r['roomId'],16,'#e1e9f5')
 floor=4 if 'Fourth' in p['floorLabel'] else 3 if 'Third' in p['floorLabel'] else 2 if 'Second' in p['floorLabel'] else 1
 if p['buildingId']=='gateway-151':
  common=[(.32,.30,f'151{floor}0'),(.64,.43,f'151{floor}1'),(.64,.68,f'151{floor}2')]
  if floor==4:common=[(.64,.43,'15141')]
  for x,y,n in common:region(x-.035,y+.005,'#f3ebdf');label(x,y,n,19,'#f3ebdf');label(x,y+.016,'Living / dining',14,'#f3ebdf')
  for x,y in [(.71,.27),(.79,.55)]:label(x,y,'Stairs',14,'#f0f2f6')
  if floor==4:
   for x,y in [(.32,.25),(.78,.68)]:region(x,y,'#eef0f3');label(x,y,'Attic',18,'#eef0f3')
 else:
  common=[(.36,.49,f'155{floor}0'),(.69,.38,f'155{floor}1')]
  if floor==4:common=[(.36,.49,'15540')]
  for x,y,n in common:region(x-.025,y+.025,'#f3ebdf');label(x,y,n,19,'#f3ebdf');label(x,y+.016,'Living / dining',14,'#f3ebdf')
  for x,y in [(.31,.35),(.27,.625)]:label(x,y,'Stairs',14,'#f0f2f6')
  if floor==4:region(.69,.36,'#eef0f3');label(.69,.36,'Attic',18,'#eef0f3')
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img"><title>{html.escape(p["label"])}</title><desc>Semantic architectural drawing. Reviewed source walls and door openings, simplified fixtures, colored bedrooms and common spaces, upright current apartment labels. Historic outlined lettering removed. Source coordinates preserved.</desc><rect width="100%" height="100%" fill="#fff"/>',*fills,f'<g transform="scale({sx} {sy})">'];removed=0
 for o in q.iter_layout_objects(q.layout._objs):
  if o['object_type'] not in ('line','curve','rect') or not o.get('path'):continue
  if not(o['x0']>=box[0] and o['x1']<=box[2] and o['top']>=box[1] and o['bottom']<=box[3]):continue
  if o['object_type']=='curve' and o.get('fill') and not o.get('stroke'):removed+=1;continue
  curved=any(c[0]=='c' for c in o['path']);fill='none'
  # Match the clean Gateway153 grammar: remove fixture/hatching hairlines,
  # retain heavier wall/opening strokes and full door-swing arcs.
  if not o.get('stroke') or o.get('fill'):continue
  stair_boxes=[(.65,.24,.79,.30),(.58,.51,.86,.57)] if p['buildingId']=='gateway-151' else [(.22,.31,.39,.375),(.14,.60,.37,.66)]
  in_stair=any(o['x0']>=a*q.width and o['x1']<=d*q.width and o['top']>=c*q.height and o['bottom']<=e*q.height for a,c,d,e in stair_boxes)
  if o.get('linewidth',0)<.3 and not curved and not in_stair:continue
  if curved and max(o.get('width',0),o.get('height',0))<12:continue
  parts.append(f'<path d="{path_data(o)}" fill="{fill}" stroke="{"#8c9bb0" if curved else "#243957"}" stroke-width="{.38 if curved else .72}" stroke-linejoin="round"/>')
 parts.extend(['</g>','<g fill="#17365c" font-family="Arial,Helvetica,sans-serif">',*labels,'</g></svg>']);(OUT/(p['id']+'.svg')).write_text('\n'.join(parts))
 manifest['pages'][p['id']+':1']={'url':f'./data/housing/clean-plans/manual-gateway-151-155/{p["id"]}.svg','width':W,'height':H,'planId':p['id'],'pageNumber':1,'sourceSha256':p['sha256'],'contentBounds':b,'renderKind':'semantic-floor-redraw','label':p['label'],'provenance':'Semantic redraw: source-native architecture with outlined CAD glyphs removed, reviewed bedroom regions and newly typeset upright identifiers. Original hotspot coordinate alignment preserved.','removedGlyphCurves':removed}
 print(p['id'],removed,'outlined glyph curves removed')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2));(D/'manual-gateway-151-155.json').write_text(json.dumps(manifest,indent=2))
