import test from 'node:test';
import assert from 'node:assert/strict';
import { wheelZoomDelta, easeZoom, installSmoothMapZoom } from '../smooth-map-zoom.js';
test('trackpad tiny deltas remain fractional; wheel ticks are bounded', () => {
 assert.equal(wheelZoomDelta({deltaY:0,deltaMode:0}),0);
 assert.ok(Math.abs(wheelZoomDelta({deltaY:1,deltaMode:0})) < .03);
 assert.equal(wheelZoomDelta({deltaY:120,deltaMode:0}),-.65);
 assert.equal(wheelZoomDelta({deltaY:-120,deltaMode:0}),.65);
 assert.equal(wheelZoomDelta({deltaY:1,deltaMode:1}),wheelZoomDelta({deltaY:16,deltaMode:0}));
});
test('interpolation is monotonic and frame-rate independent without overshoot', () => {
 let zoom=16;
 for(let i=0;i<60;i++) { const next=easeZoom(zoom,18,16);assert.ok(next>=zoom&&next<=18);zoom=next; }
 assert.ok(18-zoom<.00001);
 assert.ok(Math.abs(easeZoom(easeZoom(16,18,16),18,16)-easeZoom(16,18,32))<1e-12);
 assert.ok(easeZoom(18,16,16)<18);
});
test('wheel stream previews frames and commits fewer vector redraws, then restores transforms', async () => {
 const { installSmoothMapZoom } = await import('../smooth-map-zoom.js');
 const oldRaf=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
 const pending=new Map(), listeners=new Map(),events=new Map();let id=0,zoom=16,commits=0;
 globalThis.requestAnimationFrame=fn=>{pending.set(++id,fn);return id;};
 globalThis.cancelAnimationFrame=key=>pending.delete(key);
 const style={transform:'translate3d(12px, 8px, 0px)',transformOrigin:'',willChange:''};
 const map={getContainer:()=>({addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)}),getPane:()=>({style}),scrollWheelZoom:{disable(){}},stop(){},getZoom:()=>zoom,getMinZoom:()=>13,getMaxZoom:()=>20,mouseEventToContainerPoint:()=>({x:200,y:150}),containerPointToLayerPoint:p=>({x:p.x-12,y:p.y-8}),getZoomScale:(a,b)=>2**(a-b),setZoomAround:(anchor,z)=>{assert.deepEqual(anchor,{x:200,y:150});events.get('movestart')?.();zoom=z;commits++;},on:(key,fn)=>events.set(key,fn),off:key=>events.delete(key)};
 try {
  const dispose=installSmoothMapZoom(map);const start=performance.now();
  for(let step=0;step<20;step++){
   listeners.get('wheel')({deltaY:-1,deltaMode:0,target:{closest:()=>null},preventDefault(){}});
   const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(start+step*16));
  }
  assert.ok(style.transform.includes('scale('));
  for(let step=20;step<100&&pending.size;step++){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(start+step*16));}
  assert.ok(commits<5,`${commits} commits for 20 input events`);
  assert.ok(Math.abs(zoom-(16+20/45))<.00001);
  assert.equal(style.transform,'translate3d(12px, 8px, 0px)');
  assert.equal(style.willChange,'');
  dispose();assert.equal(listeners.size,0);
 } finally {globalThis.requestAnimationFrame=oldRaf;globalThis.cancelAnimationFrame=oldCancel;}
});
test('Safari native pinch zooms the map without duplicate wheel input and cleans up',()=>{
 const oldRaf=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
 const pending=new Map(),listeners=new Map();let id=0,zoom=16;
 globalThis.requestAnimationFrame=fn=>{pending.set(++id,fn);return id;};
 globalThis.cancelAnimationFrame=key=>pending.delete(key);
 const style={transform:'',transformOrigin:'',willChange:''};
 const map={getContainer:()=>({addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)}),getPane:()=>({style}),scrollWheelZoom:{disable(){}},stop(){},getZoom:()=>zoom,getMinZoom:()=>13,getMaxZoom:()=>20,mouseEventToContainerPoint:()=>({x:100,y:100}),containerPointToLayerPoint:p=>p,getZoomScale:(a,b)=>2**(a-b),setZoomAround:(_,z)=>zoom=z,on(){},off(){}};
 const event={target:{closest:()=>null},preventDefault(){},scale:2,deltaY:-45,deltaMode:0};
 try{
  const dispose=installSmoothMapZoom(map),start=performance.now();
  listeners.get('gesturestart')(event);listeners.get('gesturechange')(event);
  listeners.get('wheel')(event);listeners.get('gestureend')(event);
  for(let step=1;step<100&&pending.size;step++){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(start+step*16));}
  assert.equal(zoom,17,'doubling pinch scale adds exactly one zoom level');
  assert.equal(style.transform,'');dispose();assert.equal(listeners.size,0);
 }finally{globalThis.requestAnimationFrame=oldRaf;globalThis.cancelAnimationFrame=oldCancel;}
});
