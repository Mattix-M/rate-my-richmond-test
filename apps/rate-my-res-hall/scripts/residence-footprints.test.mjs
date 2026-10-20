import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildingShape} from '../interactive-building-profiles.js';
const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url)));
const campus=read('campus.geojson');
const names=['North Court','Residence Hall No. 1','Wood Hall','Robins Hall','Gray Court','Moore Hall','Keller Hall','Residence Hall No. 2','Marsh Hall','Westhampton Hall','Lakeview Hall','South Court','Dennis Hall','Residence Hall No. 3','Atlantic House','Pacific House'];
test('all remaining hall models retain complete source outlines and relative proportions',()=>{
 for(const name of names){
  const shape=buildingShape(name),feature=campus.features.find(f=>f.properties.osmId===shape.sourceOsmId),source=feature.geometry.coordinates[0].slice(0,-1);
  assert.equal(shape.outline.length,source.length,name);
  assert.equal(shape.footprintRoof,true,name);
  assert.ok(shape.outline.flat().every(Number.isFinite),name);
  const c=Math.cos(source.reduce((sum,p)=>sum+p[1],0)/source.length*Math.PI/180);
  const lengths=points=>points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%points.length][0],p[1]-points[(i+1)%points.length][1])).sort((a,b)=>a-b);
  const original=lengths(source.map(([x,y])=>[x*c,-y])),actual=lengths(shape.outline);
  for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]/actual.at(-1)-original[i]/original.at(-1))<.0001,`${name} edge ${i}`);
  const area=shape.outline.reduce((sum,p,i,points)=>sum+p[0]*points[(i+1)%points.length][1]-points[(i+1)%points.length][0]*p[1],0);
  assert.ok(area>0,`${name} visible wall orientation`);
 }
});
test('all residential groups have concise facts with university source access',()=>{
 const facts=read('residence-facts.json'),places=read('places.json').filter(p=>p.residential);
 assert.equal(places.length,19);
 for(const place of places){const fact=facts[place.id];assert.ok(fact?.text?.trim(),place.name);assert.ok(fact.source,place.name);assert.match(new URL(fact.url).hostname,/(^|\.)richmond\.edu$/,place.name);}
});
