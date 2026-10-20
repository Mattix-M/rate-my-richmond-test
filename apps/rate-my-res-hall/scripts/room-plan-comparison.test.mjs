import test from 'node:test';
import assert from 'node:assert/strict';
import {calibratePlan,transformPlanBounds} from '../room-plan-comparison.js';
test('uniform calibration retains room geometry and accepts swapped dimension orientation',()=>{
 const result=calibratePlan({width:87,height:80},{width:13.5,height:14.5});
 assert.ok(result);assert.ok(Math.abs(87*result.unitsToFeet-14.5)<.15);
 assert.ok(Math.abs(80*result.unitsToFeet-13.5)<.15);
});
test('nonmatching drawings never get a physical size scale',()=>{
 assert.equal(calibratePlan({width:100,height:30},{width:14,height:14}),null);
 assert.equal(calibratePlan({width:0,height:30},{width:14,height:14}),null);
});

test('nested drawing transforms are included before physical calibration',()=>{
 const box=transformPlanBounds({x:10,y:20,width:100,height:200},{a:0,b:.08,c:-.08,d:0,e:30,f:40});
 assert.deepEqual(box,{x:12.399999999999999,y:40.8,width:16,height:8});
 const fit=calibratePlan(box,{width:16,height:8});
 assert.equal(fit.unitsToFeet,1);
});
