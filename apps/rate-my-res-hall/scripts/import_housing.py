"""Import a collected housing snapshot read-only; generate local plan previews.
Usage: bundled-python scripts/import_housing.py /path/to/repository/data/housing
Requires Pillow, pypdf and pdftoppm. No network or changes to the collection.
"""
from pathlib import Path
import json,sys,shutil,hashlib,subprocess,tempfile,concurrent.futures
from PIL import Image
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).resolve()
output=ROOT/'data/housing';output.mkdir(exist_ok=True)
shutil.copytree(source,output,dirs_exist_ok=True)
for name in ['manifest.json','coverage.json','curation-notes.json','plan-fetches.json','room-descriptions.json','validation.json','visual-validation.json','README.md']:
 shutil.copy2(source/name,output/name)
def read(name):return json.loads((source/name).read_text())
coverage=read('coverage.json');fetches={x['url']:x for x in read('plan-fetches.json') if 'path' in x}
places=json.loads((ROOT/'data/places.json').read_text())
mapping={'Dennis Hall':['dennis'],'Lora Robins Court':['lora-robins'],'Marsh Hall':['marsh-hall'],'Moore Hall':['moore-hall'],'Robins Hall':['robins-hall'],'Wood Hall':['wood-hall'],'Gray Court':['gray-court'],'Residence Hall No. 1':['jeter-hall'],'Keller Hall':['keller-hall'],'Lakeview Hall':['lakeview-hall'],'Residence Hall No. 3':['mitchell-freeman-hall'],'North Court':['north-court'],'South Court':['south-court'],'Residence Hall No. 2':['thomas-hall'],'Westhampton Hall':['westhampton-hall'],'University Forest Apartments':['university-forest-apartments'],'Gateway Village Apartments':['gateway-151','gateway-153','gateway-155','gateway-157'],'Atlantic House':['atlantic-house'],'Pacific House':['pacific-house']}
files={p['url']:p for b in coverage for p in b['plan_files']}
def process(item):
 url,p=item;meta=fetches[url];relative=Path(p['path']).relative_to('data/housing');src=source/relative
 assert hashlib.sha256(src.read_bytes()).hexdigest()==meta['sha256'],src
 dest=output/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
 # Extensionless Atlantic source gets a PDF-serving alias without changing bytes.
 if meta['format']=='pdf' and dest.suffix.lower()!='.pdf':dest=dest.with_name(dest.name+'.pdf');shutil.copy2(src,dest)
 key=meta['sha256'][:16];previewdir=output/'previews';previewdir.mkdir(exist_ok=True)
 pages=[]
 with tempfile.TemporaryDirectory() as td:
  if meta['format']=='pdf':
   subprocess.run(['pdftoppm','-scale-to','2400','-png',str(src),str(Path(td)/'page')],check=True,capture_output=True)
   images=sorted(Path(td).glob('page-*.png'),key=lambda x:int(x.stem.split('-')[-1]))
   assert len(images)==len(PdfReader(src).pages)
  else:images=[src]
  for i,path in enumerate(images):
   out=previewdir/f'{key}-{i+1}.webp'
   with Image.open(path) as im:
    im=im.convert('RGB');width,height=im.size;im.save(out,'WEBP',lossless=True)
   pages.append({'page':i+1,'url':out.relative_to(ROOT).as_posix(),'width':width,'height':height})
 return url,{'id':key,'sourceUrl':url,'originalUrl':dest.relative_to(ROOT).as_posix(),'format':meta['format'],'sha256':meta['sha256'],'retrievedAt':meta['downloaded_at'],'revisions':meta.get('revision_text',[]),'pages':pages}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:documents=dict(pool.map(process,files.items()))
result={}
for place in places:
 if not place['residential']:continue
 ids=mapping[place['name']];groups=[g for g in coverage if g['building_id'] in ids];plans=[];issues=[]
 for group in groups:
  issues.extend(group['issues'])
  for plan in group['plan_files']:
   record={**documents[plan['url']], 'buildingId':group['building_id'],'floorLabel':plan['floor_label'],'section':plan['section'],'linkLabel':plan['link_label']}
   label=plan['floor_label'] or plan['link_label']
   filename=Path(plan['path']).name
   if group['building_id']=='north-court':label+=' · '+('Phase II' if 'NorthCourt' in filename else 'Other wing')
   elif group['building_id']=='lakeview-hall':label+=' · '+plan['section']
   elif group['building_id'].startswith('gateway-'):label+=' · '+filename.removesuffix('.pdf').removeprefix('GVA-').replace('-',' / ')
   elif group['building_id']=='south-court' and filename in ['south_3.pdf','south_4.pdf']:label= 'Third Floor' if filename=='south_3.pdf' else 'Fourth Floor'
   record['legacy']='Old-Floor-Plans/' in plan['url']
   if record['legacy']:label+=' · Legacy fragment' if record['buildingId']=='mitchell-freeman-hall' else ' · Archived source'
   if filename=='ren2.pdf':label='Bathroom detail only · incomplete second-floor coverage'
   elif filename=='ren1.pdf':label='Two-level layout · first-floor renovation drawing'
   record['label']=label;plans.append(record)
 result[place['id']]={'status':'plans-available','buildingIds':ids,'plans':plans,'issues':list({x['id']:x for x in issues}.values()),'roomCount':sum(r['building_id'] in ids for r in read('room-descriptions.json'))}
index={'schemaVersion':1,'collectedDate':read('manifest.json')['collected_date'],'sourceCollection':'Collect Richmond dorm floor plans','places':result,'documentCount':len(documents),'previewCount':sum(len(d['pages']) for d in documents.values()),'roomRecords':len(read('room-descriptions.json'))}
(output/'index.json').write_text(json.dumps(index,indent=2)+'\n')
print(f"Imported {len(result)} residences, {len(documents)} originals, {index['previewCount']} previews, {index['roomRecords']} room records")
