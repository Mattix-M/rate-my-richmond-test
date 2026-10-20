import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingShape} from '../interactive-building-profiles.js';
import {atlanticRoofDetails} from '../atlantic-architecture-details.js';

for (const name of ['Atlantic House','Pacific House']) {
 test(`${name} dormer closes its sides onto the supporting roof`,()=>{
  const outline=buildingShape(name).outline,top=100,faces=[];
  atlanticRoofDetails({outline,top,polygon:(points,color,kind)=>{assert.ok(points.flat().every(Number.isFinite));faces.push({points,kind});return '';},line:()=>''});
  const sides=faces.filter(f=>f.kind==='data-atlantic-dormer-side="true"');
  assert.equal(sides.length,2);
  const ys=outline.map(p=>p[1]),low=Math.min(...ys),high=Math.max(...ys),ridge=(low+high)/2,rise=Math.min(64,(high-low)*.29);
  for(const side of sides){
   for(const point of side.points.slice(0,2))assert.ok(Math.abs(point[2]-(top+rise*(1-Math.abs(point[1]-ridge)/((high-low)/2))))<1e-7);
   assert.ok(side.points[2][2]>side.points[1][2],'rear cheek reaches above roof');
   assert.ok(side.points[3][2]>side.points[0][2],'front cheek reaches above roof');
  }
 });
}
