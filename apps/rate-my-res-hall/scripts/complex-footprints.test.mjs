import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildingShape} from '../interactive-building-profiles.js';
const campus=JSON.parse(readFileSync(new URL('../data/campus.geojson',import.meta.url)));
const names=['Lora Robins Court',...['151','153','155','157'].map(n=>`Gateway Building ${n}`)];
test('complex models preserve every source footprint edge and relative length',()=>{
 for(const name of names){
  const f=campus.features.find(f=>f.properties.name===name),source=f.geometry.coordinates[0].slice(0,-1),shape=buildingShape(name);
  assert.equal(shape.outline.length,source.length,name);
  assert.equal(shape.footprintRoof,true,name);
  const lat=source.reduce((a,p)=>a+p[1],0)/source.length,c=Math.cos(lat*Math.PI/180);
  const lengths=(points)=>points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%points.length][0],p[1]-points[(i+1)%points.length][1])).sort((a,b)=>a-b);
  const original=lengths(source.map(([x,y])=>[x*c,-y])),actual=lengths(shape.outline);
  for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]/actual.at(-1)-original[i]/original.at(-1))<.0001,`${name} edge ${i}`);
  const area=shape.outline.reduce((a,p,i,pts)=>a+p[0]*pts[(i+1)%pts.length][1]-pts[(i+1)%pts.length][0]*p[1],0);
  assert.ok(area>0,`${name}: camera-facing winding`);
 }
});
test('each Gateway block resolves to its own footprint',()=>{
 const outlines=['151','153','155','157'].map(n=>JSON.stringify(buildingShape(`Gateway Village Apartments ${n}`).outline));
 assert.equal(new Set(outlines).size,4);
});
