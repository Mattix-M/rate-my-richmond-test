// Scroll-based panning keeps room targets in the same coordinate space as the image.
export function connectPlanGestures(canvas,stage,getZoom,setZoom){
 let drag=null,suppressClick=false,gestureScale=1;
 function zoomAt(next,x,y){
  const before=stage.getBoundingClientRect(),u=(x-before.left)/before.width,v=(y-before.top)/before.height;
  canvas.classList.add('gesture-active');
  setZoom(Math.max(1,Math.min(5,next)));
  const after=stage.getBoundingClientRect();
  canvas.scrollLeft+=after.left+u*after.width-x;
  canvas.scrollTop+=after.top+v*after.height-y;
  requestAnimationFrame(()=>canvas.classList.remove('gesture-active'));
 }
 canvas.addEventListener('dragstart',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'||e.button!==0)return;
  suppressClick=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:canvas.scrollLeft,top:canvas.scrollTop,moved:false};
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<5)return;
  drag.moved=true;suppressClick=true;canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-panning');
  canvas.scrollLeft=drag.left-dx;canvas.scrollTop=drag.top-dy;
 });
 const end=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;canvas.classList.remove('is-panning');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',e=>{end(e);suppressClick=false;});
 canvas.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId){drag=null;suppressClick=false;canvas.classList.remove('is-panning');}});
 canvas.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
 canvas.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return; // Native two-finger scrolling pans.
  e.preventDefault();zoomAt(getZoom()*Math.exp(-e.deltaY*.008),e.clientX,e.clientY);
 },{passive:false});
 // Safari emits gesture events for trackpad pinch instead of ctrl+wheel.
 canvas.addEventListener('gesturestart',e=>{e.preventDefault();gestureScale=getZoom();},{passive:false});
 canvas.addEventListener('gesturechange',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(gestureScale*e.scale,e.clientX??r.left+r.width/2,e.clientY??r.top+r.height/2);},{passive:false});
 canvas.addEventListener('gestureend',e=>e.preventDefault(),{passive:false});
}
