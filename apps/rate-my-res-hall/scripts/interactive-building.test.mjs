import test from 'node:test';
import assert from 'node:assert/strict';
import {interactiveBuildingMarkup} from '../interactive-building.js';

for(const name of ['North Court','Gray Court','Gateway Village','Moore Hall','Atlantic House','UFA 166','Jeter Hall','Westhampton Hall']){
 test(`${name} exposes every floor as an actual architectural target`,()=>{
  const floors=[{label:'Ground / basement',value:'ground'},{label:'First & second',value:'1+2'},{label:'Third floor',value:'3'}];
  const svg=interactiveBuildingMarkup(name,floors,'floor');
  assert.equal((svg.match(/class="floor-slab architectural-floor"/g)||[]).length,3);
  for(const floor of floors)assert.equal((svg.match(new RegExp(`data-floor="${floor.value.replace(/[+]/g,'\\+')}"`,'g'))||[]).length,1);
  assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
  const viewBox=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  assert.ok(viewBox.every(Number.isFinite));assert.ok(viewBox[2]>0&&viewBox[3]>0);
  assert.ok((svg.match(/<polygon/g)||[]).length>10);
  assert.doesNotMatch(svg,/<rect/,'No rectangular hit overlay may obscure another floor');
  assert.doesNotMatch(svg,/aria-hidden="true"/);
 });
}
test('floor labels and identifiers are escaped; invalid data attributes rejected',()=>{
 const svg=interactiveBuildingMarkup('Hall <test>',[{label:'Floor "A" & B',value:'a" data-x="bad'}],'level');
 assert.match(svg,/aria-label="Floor &quot;A&quot; &amp; B"/);
 assert.match(svg,/data-level="a&quot; data-x=&quot;bad"/);
 assert.throws(()=>interactiveBuildingMarkup('Hall',[{label:'One',value:'1'}],'x" onclick="'),/Invalid/);
 assert.equal(interactiveBuildingMarkup('Hall',[]),'');
});

test('every published residence floor remains reachable through its model',async()=>{
 const {readFileSync}=await import('node:fs');
 const {hallFloorGroups}=await import('../building-explorer.js');
 const places=JSON.parse(readFileSync(new URL('../data/places.json',import.meta.url)));
 const housing=JSON.parse(readFileSync(new URL('../data/housing/index.json',import.meta.url)));
 for(const place of places.filter(p=>p.residential&&!['572061','572073'].includes(p.id))){
  const groups=hallFloorGroups(housing.places[place.id].plans);
  const svg=interactiveBuildingMarkup(place.name,groups.map((g,i)=>({label:g.label,value:i})),'floor');
  assert.equal((svg.match(/data-floor="/g)||[]).length,groups.length,place.name);
  assert.doesNotMatch(svg,/NaN|Infinity|undefined/,place.name);
 }
});

test('named building roof masses tile their footprints without bridging courts',async()=>{
 const {buildingShape,buildingShapeCoverage}=await import('../interactive-building-profiles.js');
 const {readFileSync}=await import('node:fs');
 const places=JSON.parse(readFileSync(new URL('../data/places.json',import.meta.url))).filter(p=>p.residential);
 assert.equal(buildingShapeCoverage.length,19);
 for(const place of places){
  const shape=buildingShape(place.name);
  assert.notEqual(shape.id,'schematic',place.name);
  const area=Math.abs(shape.outline.reduce((sum,[x,y],i,a)=>{const [xx,yy]=a[(i+1)%a.length];return sum+x*yy-xx*y;},0))/2;
  const roofArea=shape.roofs.reduce((sum,[x,y,w,d])=>sum+w*d,0);
  if(shape.footprintRoof){assert.ok(area>0,place.name);assert.equal(shape.roofs.length,0,place.name);continue;}
  if(shape.roofOverlap){assert.ok(area>0&&roofArea>=area-1,place.name);}else assert.ok(Math.abs(area-roofArea)<.01,place.name);
 }
});
