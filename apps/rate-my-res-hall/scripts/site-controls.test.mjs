import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingOptions,trackSelectAssignments} from '../site-controls.js';
test('room search supports number, type and floor together without changing options',()=>{
 const options=[{text:'0100 · double · First Floor',disabled:false},{text:'0200 · single · Second Floor',disabled:false},{text:'0101 · double · First Floor',disabled:true}];
 assert.deepEqual(matchingOptions(options,'  FIRST double '),[options[0]]);
 assert.deepEqual(matchingOptions(options,'0200'),[options[1]]);
 assert.deepEqual(matchingOptions(options,'no such room'),[]);
 assert.equal(options.length,3);
});

test('programmatic select changes update the enhanced label without emitting selection events',()=>{
 class FakeSelect{get value(){return this.current;}set value(next){this.current=next;}get selectedIndex(){return this.index;}set selectedIndex(next){this.index=next;}}
 const select=new FakeSelect();let updates=0;
 trackSelectAssignments(select,()=>updates++);
 select.value='571561';select.selectedIndex=2;
 assert.equal(select.value,'571561');assert.equal(select.selectedIndex,2);assert.equal(updates,2);
});
