import test from 'node:test';
import assert from 'node:assert/strict';
import {animateResidenceArrival,cancelResidenceArrival} from '../residence-arrival.js';
function fixture(){
 const dialog=new EventTarget(),classes=new Set();let calls=[],cancelled=0;
 dialog.classList={add:v=>classes.add(v),remove:v=>classes.delete(v)};
 const style={willChange:'auto'};
 dialog.querySelector=()=>({style,getBoundingClientRect:()=>({left:100,top:200,width:400,height:300}),animate:(frames,options)=>{calls.push({frames,options});return{finished:new Promise(()=>{}),cancel:()=>cancelled++};}});
 return{dialog,classes,calls,style,get cancelled(){return cancelled;}};
}
test('hall entrance travels from map position without decomposing its model transform',()=>{
 globalThis.matchMedia=()=>({matches:false});const f=fixture();animateResidenceArrival(f.dialog,{x:50,y:60});
 assert.equal(f.calls[0].frames[0].transform,'translate3d(-250px, -290px, 0) scale(.035)');assert.equal(f.calls[0].options.duration,850);
 assert.equal(f.calls[0].frames[1].transform,'translate3d(0, 0, 0) scale(1)');assert.equal(f.style.willChange,'transform');
 cancelResidenceArrival(f.dialog);assert.equal(f.cancelled,1);assert.equal(f.style.willChange,'auto');assert(!f.classes.has('residence-spatial-arrival'));
});
test('close and replacement cancel active entrances without leaked classes',()=>{
 globalThis.matchMedia=()=>({matches:false});const f=fixture();animateResidenceArrival(f.dialog,{x:0,y:0});animateResidenceArrival(f.dialog,{x:10,y:10});assert.equal(f.cancelled,1);
 f.dialog.dispatchEvent(new Event('close'));assert.equal(f.cancelled,2);assert(!f.classes.has('residence-spatial-arrival'));cancelResidenceArrival(f.dialog);assert.equal(f.cancelled,2);
});
test('reduced motion and absent origin skip the spatial entrance',()=>{
 globalThis.matchMedia=()=>({matches:true});const f=fixture();animateResidenceArrival(f.dialog,{x:0,y:0});assert.equal(f.calls.length,0);
 globalThis.matchMedia=()=>({matches:false});animateResidenceArrival(f.dialog,null);assert.equal(f.calls.length,0);
});
test('a queued previous close does not cancel a newly opened entrance',()=>{
 globalThis.matchMedia=()=>({matches:false});const f=fixture();f.dialog.open=true;
 animateResidenceArrival(f.dialog,{x:0,y:0});f.dialog.dispatchEvent(new Event('close'));
 assert.equal(f.cancelled,0);assert(f.classes.has('residence-spatial-arrival'));
 f.dialog.open=false;f.dialog.dispatchEvent(new Event('close'));assert.equal(f.cancelled,1);
});
