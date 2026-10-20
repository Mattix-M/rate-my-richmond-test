import test from 'node:test';
import assert from 'node:assert/strict';
import {connectPlanGestures} from '../plan-gestures.js';
function setup(){
 const handlers={};let zoom=1,capture=null;
 const canvas={scrollLeft:100,scrollTop:100,classList:{add(){},remove(){}},addEventListener(n,f){handlers[n]=f;},setPointerCapture(id){capture=id;},hasPointerCapture(id){return capture===id;},releasePointerCapture(){capture=null;}};
 const stage={getBoundingClientRect:()=>({left:-canvas.scrollLeft,top:-canvas.scrollTop,width:1000*zoom,height:800*zoom})};
 globalThis.requestAnimationFrame=f=>f();
 connectPlanGestures(canvas,stage,()=>zoom,v=>zoom=v);
 return {handlers,canvas,get zoom(){return zoom;}};
}
test('drag threshold preserves clicks; actual drags pan and suppress room activation',()=>{
 const {handlers:h,canvas:c}=setup();h.pointerdown({pointerType:'mouse',button:0,pointerId:1,clientX:100,clientY:100});h.pointermove({pointerId:1,clientX:102,clientY:100});assert.equal(c.scrollLeft,100);
 h.pointermove({pointerId:1,clientX:140,clientY:120});h.pointerup({pointerId:1});assert.equal(c.scrollLeft,60);assert.equal(c.scrollTop,80);
 let stopped=false;h.click({preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.ok(stopped);
});
test('pinch zoom preserves the content point beneath the cursor and respects max zoom',()=>{
 const s=setup();s.handlers.wheel({ctrlKey:true,deltaY:-Math.log(2)/.008,clientX:200,clientY:150,preventDefault(){}});
 assert.equal(s.zoom,2);assert.equal(s.canvas.scrollLeft,400);assert.equal(s.canvas.scrollTop,350);
 s.handlers.wheel({ctrlKey:true,deltaY:-10000,clientX:200,clientY:150,preventDefault(){}});assert.equal(s.zoom,5);
});
test('cancelled drag does not swallow the next non-mouse room activation',()=>{
 const {handlers:h}=setup();
 h.pointerdown({pointerType:'mouse',button:0,pointerId:1,clientX:100,clientY:100});
 h.pointermove({pointerId:1,clientX:140,clientY:100});h.pointercancel({pointerId:1});
 let stopped=false;h.click({preventDefault(){},stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,false);
});
