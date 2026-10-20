import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hallFloorGroups, directFloorPlan } from '../building-explorer.js';

const housing=JSON.parse(readFileSync(new URL('../data/housing/index.json',import.meta.url),'utf8'));
const apartmentPlaces=new Set(['572061','572073']);

test('hall floor grouping retains each published drawing exactly once',()=>{
 for(const [placeId,entry] of Object.entries(housing.places)){
  if(apartmentPlaces.has(placeId))continue;
  const groups=hallFloorGroups(entry.plans);
  const planIds=groups.flatMap(group=>group.plans.map(plan=>plan.id));
  assert.equal(new Set(planIds).size,planIds.length,`${placeId}: duplicated drawing`);
  assert.deepEqual(planIds.sort(),entry.plans.map(plan=>plan.id).sort(),`${placeId}: lost drawing`);
  assert(groups.every(group=>group.plans.length>0&&group.label),`${placeId}: empty group`);
 }
});

test('North Court exposes five published floors and retains both wings',()=>{
 assert.deepEqual(hallFloorGroups(housing.places['571760'].plans).map(group=>[group.label,group.plans.length]),[
  ['Ground Level',2],['First Floor',2],['Second Floor',2],['Third Floor',2],['Fourth Floor',1],
 ]);
});

test('shared drawings stay grouped while individually identified floors split',()=>{
 assert(hallFloorGroups(housing.places['571872'].plans).some(group=>group.label==='Third, Fourth, and Fifth Floors'));
 assert(hallFloorGroups(housing.places['571570'].plans).some(group=>group.label==='Third and Fourth Floors'));
 assert.deepEqual(hallFloorGroups(housing.places['571866'].plans).map(group=>group.label),[
  'Ground Level','First Floor','Second Floor','Third Floor','Fourth Floor',
 ]);
});

test('only supplied levels are shown and an unlabeled drawing remains accessible',()=>{
 const supplied=[{id:'five',label:'Fifth Floor',floorLabel:'Fifth Floor'},{id:'three',label:'Third Floor',floorLabel:'Third Floor'}];
 assert.deepEqual(hallFloorGroups(supplied).map(group=>group.label),['Third Floor','Fifth Floor']);
 assert.equal(hallFloorGroups([{id:'detail',label:'Detail',floorLabel:null}])[0].label,'Available plans');
 assert.deepEqual(hallFloorGroups([]),[]);
});


test('direct floor entry selects one current drawing without promoting archives',()=>{
 const current={id:'current'},old={id:'old',legacy:true};
 assert.equal(directFloorPlan([old,current]),current);
 assert.equal(directFloorPlan([old]),null);
 assert.equal(directFloorPlan([]),null);
 assert.equal(directFloorPlan([current,{id:'other-wing'}]),null);
});

test('North wings and Gateway apartment choices remain explicit',()=>{
 const north=hallFloorGroups(housing.places['571760'].plans);
 assert.equal(directFloorPlan(north.find(group=>group.label==='First Floor').plans),null);
 assert(directFloorPlan(north.find(group=>group.label==='Fourth Floor').plans));
 const gateway=housing.places['572073'].plans;
 assert(directFloorPlan(gateway.filter(p=>p.buildingId==='gateway-151'&&p.floorLabel.includes('First'))));
 assert.equal(directFloorPlan(gateway.filter(p=>p.buildingId==='gateway-153'&&p.floorLabel.includes('First'))),null);
});
