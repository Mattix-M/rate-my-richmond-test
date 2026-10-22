import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangeFurniture,entranceBuffers} from '../dorm-layout-arranger.js';
import {plannerRooms,checkPlacement,furnitureCatalog} from '../dorm-planner-data.js';
import {starterLayout} from '../dorm-planner-state.js';
test('arrangement retains furniture identities and dimensions while clearing fixed features and entry buffer',()=>{
 for(const room of plannerRooms.filter(room=>!room.scaleStatus)){
  const items=starterLayout(room),before=structuredClone(items),arranged=arrangeFurniture(room,items);
  assert.deepEqual(items,before);assert.equal(arranged.length,items.length);
  const clearRoom={...room,obstacles:[...room.obstacles,...entranceBuffers(room)]};
  arranged.forEach((item,index)=>{
   for(const key of ['id','type','width','depth','height'])assert.equal(item[key],items[index][key]);
   assert.deepEqual(checkPlacement(clearRoom,item,arranged),{inside:true,overlaps:[]});
  });
 }
});
test('unplaceable furniture fails atomically rather than shrinking or dropping pieces',()=>{
 const room=plannerRooms[0],items=[...starterLayout(room),{...furnitureCatalog[0],id:'too-large',width:50,depth:50,rotation:0}];
 const before=structuredClone(items);assert.equal(arrangeFurniture(room,items),null);assert.deepEqual(items,before);assert.deepEqual(arrangeFurniture(room,[]),[]);
});

test('doorway buffers follow recessed entrances rather than overall bounds',()=>{
 const buffers=entranceBuffers({width:30,depth:20,doors:[{x:7,z:4,width:3,wall:'south'},{x:15,z:10,width:3,wall:'west'}]});
 assert.equal(buffers[0].z,5.5);assert.equal(buffers[1].x,16.5);
});
