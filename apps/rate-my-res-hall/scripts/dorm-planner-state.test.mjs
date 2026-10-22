import test from 'node:test';
import assert from 'node:assert/strict';
import {plannerRooms,checkPlacement} from '../dorm-planner-data.js';
import {readLayouts,starterLayout,findOpenPosition} from '../dorm-planner-state.js';
test('starter furniture fits each actual outline and avoids fixed and movable obstacles',()=>{
 for(const room of plannerRooms){const items=starterLayout(room);assert.equal(items.length,4);for(const item of items)assert.deepEqual(checkPlacement(room,item,items),{inside:true,overlaps:[]});}
});
test('saved layouts preserve per-room furniture including intentionally empty rooms',()=>{
 const rooms=Object.fromEntries(plannerRooms.map(r=>[r.id,starterLayout(r)]));rooms[plannerRooms[1].id]=[];
 assert.deepEqual(readLayouts(JSON.stringify({version:1,rooms})),rooms);
});
test('malformed and untrusted saved placements are rejected without losing valid pieces',()=>{
 const room=plannerRooms[0],valid=starterLayout(room)[0];
 const parsed=readLayouts(JSON.stringify({version:1,rooms:{[room.id]:[valid,{...valid,id:'outside',x:-100},{...valid,id:'bad',width:'large'},{...valid,id:'script',type:'script'},valid]}}));
 assert.deepEqual(parsed[room.id],[valid]);assert.deepEqual(readLayouts('{'),{});assert.deepEqual(readLayouts('null'),{});assert.deepEqual(readLayouts(JSON.stringify({version:2,rooms:{}})),{});
});
test('oversized pieces do not get silently squeezed into a room',()=>{assert.equal(findOpenPosition(plannerRooms[0],{id:'large',type:'desk',width:50,depth:50,height:2,rotation:0},[]),null);});
