"""Gateway 153 reviewed semantic redraw: source-coordinate walls, no CAD glyphs.
Native stroked architectural geometry retained, filled glyph outlines discarded.
Explicit upright labels and bedroom fills preserve existing room-selection bounds.
"""
from pathlib import Path
import json,sys,html
import pdfplumber
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from generate_clean_vectors import path_data
OUT=ROOT/'data/housing/clean-plans/manual-gateway-153';OUT.mkdir(exist_ok=True)
plans=[p for p in json.load(open(ROOT/'data/housing/index.json'))['places']['572073']['plans'] if '153' in p['label']]
rooms=json.load(open(ROOT/'data/housing/annotations/gateway-bedrooms.json'))['rooms'];manifest={'pages':{}}
for idx,p in enumerate(plans):
 pid=p['id'];W,H=p['pages'][0]['width'],p['pages'][0]['height'];page=pdfplumber.open(ROOT/p['originalUrl']).pages[0];sx,sy=W/page.width,H/page.height;selected=[r for r in rooms if r['planId']==pid];horizontal=idx%2==1;fourth=idx>=6
 bounds=[.04,.38,.94,.65] if horizontal else [.13,.18,.875,.695]
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><title>{html.escape(p["label"])}</title><desc>Gateway 153 semantic redraw. Original wall and door coordinates preserved; CAD lettering removed and replaced by upright room and space labels. Simplified fixtures. Partial neighboring units remain unlabeled.</desc><rect width="100%" height="100%" fill="#fff"/>']
 def rect(b,fill):
  a,c,d,e=b;parts.append(f'<rect x="{a*W}" y="{c*H}" width="{(d-a)*W}" height="{(e-c)*H}" fill="{fill}"/>')
 def label(x,y,text,size=17,color='#233e65'):
  parts.append(f'<text x="{x*W}" y="{y*H}" font-family="Arial,Helvetica,sans-serif" font-size="{size}" font-weight="500" fill="{color}" text-anchor="middle" dominant-baseline="middle">{html.escape(text)}</text>')
 common=([(.073,.427,.35,.477),(.49,.427,.779,.477)] if horizontal else [(.59,.205,.68,.385),(.31,.482,.635,.54)])
 if fourth:common=common[1:] if horizontal else common[1:]
 for b in common:rect(b,'#f3eee5')
 for r in selected:
  a,b,c,d=r['bounds'];rect((a+.001,b+.001,c-.001,d-.001),'#e3ebf5')
 parts.append(f'<g transform="scale({sx} {sy})">')
 count=0
 for o in page.iter_layout_objects(page.layout._objs):
  if o['object_type']not in('line','curve','rect')or not o.get('path')or not o.get('stroke')or o.get('fill'):continue
  if o['x0']<bounds[0]*page.width or o['x1']>bounds[2]*page.width or o['top']<bounds[1]*page.height or o['bottom']>bounds[3]*page.height:continue
  if any(o['x0']>=a*page.width and o['x1']<=c*page.width and o['top']>=b*page.height and o['bottom']<=d*page.height for a,b,c,d in common):continue
  width=o.get('linewidth',0)
  # Omit dense construction hatching and fixture microdetail, retaining doors.
  if width<.3 and not any(c[0]=='c'for c in o['path']):
   # Retain stair treads only in the reviewed stair cores.
   stair_boxes=[(.65,.49,.74,.61),(.23,.57,.30,.66)] if not horizontal else[(.41,.49,.48,.60),(.83,.50,.91,.62)]
   if not any(o['x0']>=a*page.width and o['x1']<=c*page.width and o['top']>=b*page.height and o['bottom']<=d*page.height for a,b,c,d in stair_boxes):continue
  curved=any(c[0]=='c'for c in o['path']);color='#8798ae'if curved else'#233e65'
  parts.append(f'<path d="{path_data(o)}" fill="none" stroke="{color}" stroke-width="{.5 if curved else .85}" stroke-linecap="round" stroke-linejoin="round"/>');count+=1
 parts.append('</g>')
 for r in selected:
  a,b,c,d=r['bounds'];label((a+c)/2,(b+d)/2,r['roomId'],16)
 if horizontal:
  if not fourth:label(.245,.449,'Living / kitchen',17)
  label(.65,.448,'Living / kitchen',17);label(.445,.467,'Stairs',16);label(.87,.467,'Stairs',16)
  if fourth:label(.23,.47,'Attic',18,'#718198')
 else:
  if not fourth:label(.636,.268,'Kitchen',16);label(.635,.343,'Living',18)
  else:label(.71,.295,'Attic',18,'#718198')
  label(.525,.514,'Living / kitchen',17);label(.702,.451,'Lobby',17);label(.692,.524,'Stairs',16);label(.264,.546,'Stairs',16)
 parts.append('</svg>');(OUT/f'{pid}.svg').write_text('\n'.join(parts))
 manifest['pages'][pid+':1']={'url':f'./data/housing/clean-plans/manual-gateway-153/{pid}.svg','width':W,'height':H,'planId':pid,'pageNumber':1,'sourceSha256':p['sha256'],'contentBounds':bounds,'renderKind':'semantic-floor-redraw','label':p['label'],'provenance':f'Reviewed Gateway153 source sheet. {count} stroked wall/door paths retained in source coordinates; all filled CAD glyph outlines removed. {len(selected)} bedroom fills and upright identifiers restored from reviewed room annotations; common spaces labeled semantically. Fine fixture detail simplified; neighboring partial units not assigned.'}
 print(pid,count,len(selected))
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
