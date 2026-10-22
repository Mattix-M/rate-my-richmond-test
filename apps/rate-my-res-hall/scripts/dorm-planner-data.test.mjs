import test from 'node:test';
import assert from 'node:assert/strict';
import { plannerRooms, furnitureCatalog, checkPlacement, getItemFootprint } from '../dorm-planner-data.js';
const box={outline:[[0,0],[10,0],[10,10],[0,10]],obstacles:[]};
const item={id:'a',x:5,z:5,width:4,depth:2,rotation:0};
test('rotated footprint remains inside or crosses walls accurately',()=>{
  assert.equal(checkPlacement(box,{...item,rotation:45}).inside,true);
  assert.equal(checkPlacement(box,{...item,x:1,rotation:45}).inside,false);
  assert.deepEqual(getItemFootprint(item),[[3,4],[7,4],[7,6],[3,6]]);
});
test('concave outline rejects furniture spanning an empty notch even with four inside corners',()=>{
  const room={outline:[[0,0],[10,0],[10,10],[6,10],[6,4],[4,4],[4,10],[0,10]]};
  assert.equal(checkPlacement(room,{...item,x:5,z:7,width:8,depth:2}).inside,false);
});
test('overlap respects rotation, fixed objects, self exclusion and rugs',()=>{
  const other={...item,id:'b',x:7};
  assert.deepEqual(checkPlacement(box,item,[item,other]).overlaps,['b']);
  assert.deepEqual(checkPlacement(box,{...item,type:'rug'},[other]).overlaps,[]);
  assert.deepEqual(checkPlacement({...box,obstacles:[other]},{...item,type:'rug'}).overlaps,['b']);
  assert.deepEqual(checkPlacement(box,item,[{...other,x:9}]).overlaps,[]);
});
test('malformed placements fail closed',()=>{
  for(const patch of [{x:NaN},{width:-1},{rotation:Infinity}]) assert.equal(checkPlacement(box,{...item,...patch}).inside,false);
});
test('curated source rooms retain provenance, fixed obstacles and distinctive outline',()=>{
  assert.equal(plannerRooms.length,2);
  assert.ok(plannerRooms.find(r=>r.id==='north-0013').outline.length>4);
  for(const room of plannerRooms){assert.ok(room.source.startsWith('https://residencelife.richmond.edu/'));assert.ok(room.planUrl.endsWith('.svg'));assert.ok(room.notes.includes('illustrative'));}
  assert.ok(furnitureCatalog.every(f=>f.width>0&&f.depth>0&&f.height>0));
});
