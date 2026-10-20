import json,collections,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
h=root/'data/housing'
read=lambda path:json.loads(path.read_text())
# Count only manifests enabled by the same registry used by the viewer/build.
registry=json.loads(subprocess.run(['node','--input-type=module','-e',f'import {{cleanPlanManifestFiles}} from {json.dumps((root/"clean-plan-assets.js").as_uri())}; console.log(JSON.stringify(cleanPlanManifestFiles));'],check=True,capture_output=True,text=True).stdout)
manual_manifests=[h/file for file in registry if file.startswith('clean-plans/manual-')]
index=read(h/'index.json')['places']; coverage=read(h/'room-layout-coverage.json')['places']; layouts=read(h/'room-layouts.json')['rooms']; exceptions=read(h/'room-source-exceptions.json')['records']; names={p['id']:p['name'] for p in read(root/'data/places.json')}
auditfile=h/'clean-vector-assets.json'
assets=read(auditfile) if auditfile.exists() else {}
rasterfile=h/'clean-raster-assets.json'
raster=read(rasterfile) if rasterfile.exists() else {}
manual={rid:a for manifest in manual_manifests for rid,a in read(manifest).get('rooms',{}).items()}
manual_pages={key:a for manifest in manual_manifests for key,a in read(manifest).get('pages',{}).items()}
manual['room-description-0764']={'url':'./data/housing/clean-plans/north-court-013.svg'}
records={r['record_id']:r for r in read(h/'room-descriptions.json')+read(h/'source-room-records.json')}
audits={f"{a['planId']}:{a['page']}":a for a in assets.get('report',{}).get('pageAudit',[])}
placeout={};pageout={};formats=collections.Counter()
for pid,entry in index.items():
 pagekeys=[]
 for plan in entry['plans']:
  for page in plan['pages']:
   key=f"{plan['id']}:{page['page']}";pagekeys.append(key)
   matched=[rid for rid,l in layouts.items() if l['planId']==plan['id'] and l['page']==page['page']]
   a=audits.get(key,{})
   vector=assets.get('pages',{}).get(key)
   rasterpage=raster.get('pages',{}).get(key)
   manual_page=manual_pages.get(key)
   pilot=plan['id']=='dfe3500142cbd7dd' and page['page']==1
   kind='raster-image' if plan['format']=='image' else ('raster-containing-pdf' if a.get('imageCoverage',0)>.01 else 'vector-pdf' if a.get('vectorCount',0)>=20 else 'pdf-needs-review')
   formats[kind]+=1
   pageout[key]={'placeId':pid,'buildingId':plan['buildingId'],'planId':plan['id'],'page':page['page'],'label':plan['label'],'floorLabel':plan['floorLabel'],'legacy':plan['legacy'],'originalFormat':plan['format'],'contentKind':kind,'sourceUrl':plan['sourceUrl'],'originalUrl':plan['originalUrl'],'sourceSha256':plan['sha256'],'preview':page,'reviewedRoomViewCount':len(matched),'reviewedRoomRecordIds':matched,'simplifiedRoomRecordIds':[rid for rid in matched if rid in manual],'cleanFloorAssetKind':manual_page.get('renderKind','reviewed-source-vectors') if manual_page else 'reviewed-pilot-source-vectors' if pilot else 'source-vectors' if vector else 'raster-trace' if rasterpage else 'original-only','cleanFloorUrl':manual_page['url'] if manual_page else 'data/housing/clean-plans/north-court-ground-phase2.svg' if pilot else vector.get('url') if vector else rasterpage.get('url') if rasterpage else None,'vectorRoomViewCount':sum(rid in assets.get('rooms',{}) for rid in matched),'rasterRoomViewCount':sum(rid in raster.get('rooms',{}) for rid in matched),'optInLowResolutionRasterRoomViewCount':sum(rid in raster.get('rooms',{}) and rid not in manual and min(raster['rooms'][rid]['width'],raster['rooms'][rid]['height'])<300 for rid in matched),'rasterConversionAudit':next((ra for ra in raster.get('report',{}).get('pageAudit',[]) if ra.get('planId')==plan['id'] and ra.get('page',ra.get('pageNumber'))==page['page']),None),'conversionAudit':a or {'status':'not-pdf','reason':'Original is a raster image.'},'nextManualWork':None if (manual_page or pilot) and all(rid in manual for rid in matched) else 'Complete remaining individual room redraws.' if manual_page or pilot else 'Review and simplify the full-floor overview.' if all(rid in manual for rid in matched) else 'Complete individual room redraws and review the full-floor overview.'}
 c=coverage[pid]; ex=[rid for rid in exceptions if records.get(rid,{}).get('building_id') in entry['buildingIds']]
 placeout[pid]={'name':names[pid],'buildingIds':entry['buildingIds'],'pageKeys':pagekeys,'sourceFileCount':len(entry['plans']),'pageCount':len(pagekeys),'reviewedRoomViewCount':c['reviewedViews']+c['additionalSourceRoomViews'],'cleanFloorAssetCount':sum(pageout[k]['cleanFloorUrl'] is not None for k in pagekeys),'simplifiedRoomViewCount':sum(len(pageout[k]['simplifiedRoomRecordIds']) for k in pagekeys),'sourceExceptionRecordIds':ex}
result={'schemaVersion':1,'inventoryDate':'2026-10-19','countUnit':'Reviewed room views and source description records; not certified physical bedrooms.','statusDefinitions':{'manual-trace':'Manually traced architectural overview checked against the original source.','reviewed-scan-overview':'Individually reviewed scan contours with common labels and semantic room fills; original scan detail limits remain.','source-vectors':'Source geometry extracted and restyled; not a manually simplified room redraw or proof of visual review.','reviewed-source-vectors':'Original architectural geometry with manually reviewed replacement labels and room fills.', 'reviewed-pilot-source-vectors':'North Court Phase II ground-floor pilot reviewed against its source.','raster-trace':'Source scan pixel contours traced and restyled; not a semantic architectural redraw.','original-only':'Original preview remains available; no eligible clean floor asset yet.'},'summary':{'housingGroups':len(placeout),'sourceFiles':sum(p['sourceFileCount'] for p in placeout.values()),'drawingPages':len(pageout),'reviewedRoomViews':len(layouts),'originalDescriptionRecords':len(read(h/'room-descriptions.json')),'additionalSourceRoomRecords':len(read(h/'source-room-records.json')),'sourceNumberingConflicts':sum(e['kind']=='source-numbering-conflict' for e in exceptions.values()),'groupDescriptionRanges':sum(e['kind']=='room-range' for e in exceptions.values()),'contentKinds':dict(formats),'cleanFloorAssets':sum(p['cleanFloorUrl'] is not None for p in pageout.values()),'sourceVectorFloorAssets':len(assets.get('pages',{})),'rasterTraceFloorAssets':len(raster.get('pages',{})),'sourceVectorRoomViews':len(assets.get('rooms',{})),'rasterTraceRoomViews':len(raster.get('rooms',{})),'originalOnlyFloorPages':sum(p['cleanFloorUrl'] is None for p in pageout.values()),'originalOnlyRoomViews':sum(rid not in assets.get('rooms',{}) and rid not in raster.get('rooms',{}) and rid not in manual for rid in layouts),'manuallyReviewedFloorAssets':len(manual_pages)+1,'simplifiedRoomViews':len(manual),'remainingSimplifiedRoomViews':sum(rid not in manual for rid in layouts),'remainingReviewedFloorPages':sum(k not in manual_pages and k!='dfe3500142cbd7dd:1' for k in pageout),'simplifiedRoomAssetFiles':len({a['url'] for a in manual.values()}),'availableLowResolutionRasterRoomViews':sum(min(a['width'],a['height'])<300 for a in raster.get('rooms',{}).values()),'optInLowResolutionRasterRoomViews':sum(rid not in manual and min(a['width'],a['height'])<300 for rid,a in raster.get('rooms',{}).items())},'places':placeout,'pages':pageout}
(h/'drawing-inventory.json').write_text(json.dumps(result,indent=2)+'\n')
print(result['summary'])
