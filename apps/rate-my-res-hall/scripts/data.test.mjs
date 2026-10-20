import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const json=path=>JSON.parse(readFileSync(new URL(`../data/${path}`,import.meta.url),'utf8'));
const places=json('places.json'),geo=json('campus.geojson'),manifest=json('manifest.json');
const official=json('sources/official-buildings.json').children.locations;
const residences=json('sources/official-residences.json').children.locations;
test('All official building coordinates survive normalization without invention',()=>{
 assert.equal(new Set(places.map(p=>p.id)).size,places.length);
 assert.equal(places.flatMap(p=>p.locations).length,official.length);
 for(const source of official){const p=places.find(p=>p.sourceIds.includes(source.id));assert.ok(p,source.name);assert.ok(p.locations.some(l=>l.sourceId===source.id&&l.lat===source.lat&&l.lng===source.lng));}
 for(const source of residences){const p=places.find(p=>p.residenceSourceId===source.id);assert.equal(p.lat,source.lat);assert.equal(p.lng,source.lng);assert.equal(p.name,source.name);assert.equal(p.residential,true);}
});
test('Housing coverage and interior availability are explicit',()=>{
 assert.equal(places.filter(p=>p.residential).length,19);
 for(const name of ['Atlantic House','Pacific House'])assert.ok(places.find(p=>p.name===name)?.residential);
 for(const p of places.filter(p=>p.residential)){assert.equal(p.interiors.status,'plans-available');assert.deepEqual(p.interiors.rooms,[]);assert.equal(p.interiors.roomGeometryStatus,'not-mapped');assert.ok(p.interiors.sourceDocuments.length>0);assert.match(p.housingUrl,/^https:\/\/residencelife.richmond.edu\/housing\//);}
 assert.equal(manifest.uniquePlaces,places.length);
});
test('Basemap preserves closed geometry and Westhampton Lake',()=>{
 assert.ok(geo.features.some(f=>f.properties.name==='Westhampton Lake'&&f.geometry.type==='MultiPolygon'));
 for(const f of geo.features){const g=f.geometry;if(g.type==='LineString')continue;const polygons=g.type==='MultiPolygon'?g.coordinates:[g.coordinates];for(const rings of polygons)for(const ring of rings){assert.ok(ring.length>=4);assert.deepEqual(ring[0],ring.at(-1));}}
 assert.equal(geo.features.length,manifest.osmFeatures);
});
test('Every residence has valid, byte-identical originals and page previews',()=>{
 const housing=json('housing/index.json');
 const documents=new Map();
 assert.equal(Object.keys(housing.places).length,19);
 for(const p of places.filter(p=>p.residential)){
  const entry=housing.places[p.id];assert.ok(entry,p.name);assert.ok(entry.plans.length>0);
  for(const plan of entry.plans){
   documents.set(plan.id,plan);
   const bytes=readFileSync(new URL(`../${plan.originalUrl}`,import.meta.url));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),plan.sha256);
   for(const page of plan.pages){const bytes=readFileSync(new URL(`../${page.url}`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(page.width>0&&page.height>0);}
  }
 }
 assert.equal(documents.size,96);assert.equal([...documents.values()].reduce((n,p)=>n+p.pages.length,0),97);
 const ufa=places.find(p=>p.name==='University Forest Apartments');assert.ok(housing.places[ufa.id].plans.some(p=>p.label.includes('Bathroom detail only')));
 const rh3=places.find(p=>p.name==='Residence Hall No. 3');assert.equal(housing.places[rh3.id].plans.filter(p=>p.legacy).length,1);
});
test('Room markers match real same-floor source records and remain inside the source page',()=>{
 const labels=json('housing/room-labels.json'),housing=json('housing/index.json'),rooms=json('housing/room-descriptions.json');
 let count=0;const halls=new Set();
 for(const entry of Object.values(housing.places))for(const plan of entry.plans)for(const page of plan.pages){
  const mapping=labels.pages[`${plan.id}:${page.page}`];if(!mapping)continue;
  assert.equal(mapping.sourceSha256,plan.sha256);const ids=new Set();
  for(const m of mapping.markers){const r=rooms.find(r=>r.record_id===m.recordId);assert.ok(r);assert.equal(r.building_id,plan.buildingId);assert.equal(r.floor_label,plan.floorLabel);assert.equal(r.room_id,m.roomId);assert.ok(m.x>0&&m.x<1&&m.y>0&&m.y<1);assert.ok(m.x>=m.bbox[0]&&m.x<=m.bbox[2]&&m.y>=m.bbox[1]&&m.y<=m.bbox[3]);assert.ok(!ids.has(m.recordId));ids.add(m.recordId);count++;halls.add(plan.buildingId);}
 }
 assert.equal(count,494);assert.equal(halls.size,7);
});
test('Reviewed layouts are traceable to the correct room, floor, page and original bytes',()=>{
 const layouts=json('housing/room-layouts.json'),housing=json('housing/index.json'),records=[...json('housing/room-descriptions.json'),...json('housing/source-room-records.json')];
 const plans=Object.values(housing.places).flatMap(e=>e.plans);
 for(const [id,layout] of Object.entries(layouts.rooms)){
  const record=records.find(r=>r.record_id===id),plan=plans.find(p=>p.id===layout.planId);
  assert.ok(record&&plan,id);assert.equal(layout.status,'reviewed');assert.equal(layout.roomId,record.room_id);
  assert.equal(record.building_id,plan.buildingId);assert.equal(record.floor_label,plan.floorLabel);
  assert.equal(layout.sourceSha256,plan.sha256);assert.ok(plan.pages.some(p=>p.page===layout.page));
  const [x0,y0,x1,y1]=layout.bounds;assert.ok(0<=x0&&x0<x1&&x1<=1&&0<=y0&&y0<y1&&y1<=1,id);
  assert.ok(layout.includes.length&&layout.reviewedOn&&layout.width>0&&layout.height>0);
  for(const [x,y] of layout.hitRegion)assert.ok(x>=x0&&x<=x1&&y>=y0&&y<=y1,id);
  const bytes=readFileSync(new URL(`../${layout.url}`,import.meta.url));assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
 const shared=Object.values(layouts.rooms).filter(l=>['0007','0009'].includes(l.roomId)&&plans.find(p=>p.id===l.planId).buildingId==='north-court');
 assert.equal(shared.length,2);for(const l of shared){assert.equal(l.viewKind,'shared-room-group');assert.ok(l.includes.includes('Shared bathroom 007R'));assert.ok(!l.includes.some(x=>x.includes('Private')));}
});
test('Coverage accounts for every source page and separates reviewed from remaining records',()=>{
 const coverage=json('housing/room-layout-coverage.json'),housing=json('housing/index.json'),layouts=json('housing/room-layouts.json');
 let mapped=0,pages=0;
 for(const [id,entry] of Object.entries(housing.places)){
  const c=coverage.places[id];assert.equal(c.pages.length,entry.plans.reduce((n,p)=>n+p.pages.length,0));
  assert.equal(c.sourceRecords,c.reviewedViews+c.remainingRecordIds.length);
  assert.ok(c.remainingRecordIds.every(id=>!layouts.rooms[id]));mapped+=c.reviewedViews+c.additionalSourceRoomViews;pages+=c.pages.length;
 }
 assert.equal(mapped,Object.keys(layouts.rooms).length);assert.equal(pages,97);
});

test('Every source record has a reviewed layout or an explicit source exception',()=>{
 const records=json('housing/room-descriptions.json'),derived=json('housing/source-room-records.json'),layouts=json('housing/room-layouts.json').rooms,exceptions=json('housing/room-source-exceptions.json').records;
 assert.equal(records.length,1329);assert.equal(derived.length,120);
 assert.equal(Object.keys(layouts).length,1436);
 assert.equal(new Set([...records,...derived].map(r=>r.record_id)).size,1449);
 for(const r of records){assert.ok(Boolean(layouts[r.record_id])!==Boolean(exceptions[r.record_id]),r.record_id);}
 for(const r of derived){assert.ok(layouts[r.record_id]);const parent=records.find(p=>p.record_id===r.parent_record_id);assert.ok(parent&&!parent.room_id);assert.equal(r.building_id,parent.building_id);assert.equal(r.floor_label,parent.floor_label);assert.ok(exceptions[parent.record_id].childRecordIds.includes(r.record_id));assert.ok(!r.room_id.endsWith('12'));}
 for(const id of ['room-description-0620','room-description-0621']){assert.equal(layouts[id].page,2);assert.match(layouts[id].note,/explicitly identifies/);}
 assert.equal(Object.values(exceptions).filter(e=>e.kind==='source-numbering-conflict').length,3);
 for(const [id,e] of Object.entries(exceptions)){assert.ok(records.some(r=>r.record_id===id));assert.ok(e.detail&&e.reviewedOn);for(const child of e.childRecordIds||[])assert.ok(layouts[child]);}
});
test('Apartment block numbers preserve official marker coordinates and Gateway plan identity',()=>{
 const blocks=json('apartment-buildings.json').blocks,housing=json('housing/index.json');
 assert.equal(blocks.length,20);assert.equal(new Set(blocks.map(b=>b.sourceId)).size,20);
 for(const b of blocks){const source=official.find(r=>r.id===b.sourceId);assert.ok(source);assert.equal(source.icon,b.number+'.png');assert.equal(b.lat,source.lat);assert.equal(b.lng,source.lng);assert.ok(places.find(p=>p.id===b.placeId).sourceIds.includes(b.sourceId));
 if(b.kind==='gateway'){const plans=housing.places[b.placeId].plans.filter(p=>p.buildingId==='gateway-'+b.number);assert.ok(plans.length);for(const floor of ['First','Second','Third','Fourth'])assert.ok(plans.some(p=>p.floorLabel.includes(floor)));}}
 const a=blocks.find(b=>b.number==='172'),b=blocks.find(b=>b.number==='164');assert.notEqual(a.lat,b.lat);assert.notEqual(a.lng,b.lng);
});
test('UFA apartment selection retains the four published one-level exceptions',async()=>{
 const {ufaPlanForUnit}=await import('../building-explorer.js');const plans=json('housing/index.json').places['572061'].plans;
 for(const unit of ['160F','164H','166A','486A'])assert.equal(ufaPlanForUnit(plans,unit).id,'87c50092381d2e92');
 for(const unit of ['172A','172B','164A'])assert.equal(ufaPlanForUnit(plans,unit).id,'2cde2feb120e60ae');
});
