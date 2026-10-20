import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingShape} from '../interactive-building-profiles.js';
import {renderLoraRoof} from '../lora-roof.js';

test('Lora rendered roof has a complete perimeter base and three closed pitched pods',()=>{
 const outline=buildingShape('Lora Robins Court').outline,faces=[];
 renderLoraRoof(outline,100,(points,color,kind)=>{assert.ok(points.flat().every(Number.isFinite));faces.push({points,kind});return '';},()=>'');
 const base=faces.find(f=>f.kind==='data-lora-roof="base"');
 assert.deepEqual(base.points.map(p=>p.slice(0,2)),outline);
 const caps=faces.filter(f=>f.kind==='data-lora-roof="service-cap"'),bands=faces.filter(f=>f.kind==='data-lora-roof="pitched-band"');
 assert.equal(caps.length,3);
 for(const cap of caps){
  assert.ok(cap.points.every(p=>p[2]===115));
  for(let i=0;i<cap.points.length;i++){
   const a=cap.points[i],b=cap.points[(i+1)%cap.points.length];
   assert.ok(bands.some(f=>JSON.stringify(f.points[3])===JSON.stringify(a)&&JSON.stringify(f.points[2])===JSON.stringify(b)),'every service-cap edge joins a pitched band');
  }
 }
 assert.ok(bands.every(f=>f.points[0][2]===101&&f.points[1][2]===101));
});
