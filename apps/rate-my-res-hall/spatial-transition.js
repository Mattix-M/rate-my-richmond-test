// Carry the selected architectural floor into the live plan without replacing
// its image, room hotspots, or navigation with a decorative screenshot.
const origins=new WeakMap();
const running=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const floorIn=(dialog,origin)=>origin
 ? [...dialog.querySelectorAll('.architectural-floor')].find(el=>el.dataset[origin.attribute]===origin.value)
 : (dialog.querySelector('.architectural-floor.active')||dialog.querySelector('.architectural-floor.preview')||dialog.querySelector('.architectural-floor'));
function snapshot(floor){
 if(!floor)return null;
 const rect=floor.getBoundingClientRect(),box=floor.getBBox();
 if(!rect.width||!box.width)return null;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);
 const clone=floor.cloneNode(true);
 clone.removeAttribute('class');clone.removeAttribute('tabindex');clone.removeAttribute('role');
 clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 svg.append(clone);svg.setAttribute('aria-hidden','true');
 return{node:svg,rect};
}
function lifecycle(dialog){
 running.get(dialog)?.();
 let cancelled=false;
 const animations=[],nodes=[];
 const clean=()=>{
  if(cancelled)return;cancelled=true;
  animations.forEach(a=>a.cancel());nodes.forEach(n=>n.remove());
  dialog.classList.remove('spatial-transition-active','spatial-transition-waiting');
  dialog.removeEventListener('close',onClose);dialog.removeEventListener('cancel',clean);
  dialog.removeEventListener('click',onNavigate,true);dialog.removeEventListener('change',onNavigate,true);
  if(running.get(dialog)===clean)running.delete(dialog);
 };
 const onClose=()=>{if(!dialog.open)clean();};
 // A new toolbar selection supersedes the decorative flight immediately.
 const onNavigate=event=>{if(event.target.closest?.('.plan-toolbar'))clean();};
 running.set(dialog,clean);dialog.classList.add('spatial-transition-active');
 dialog.addEventListener('close',onClose);dialog.addEventListener('cancel',clean);
 dialog.addEventListener('click',onNavigate,true);dialog.addEventListener('change',onNavigate,true);
 return{clean,nodes,animations,get alive(){return !cancelled&&dialog.open;}};
}
function frame(){return new Promise(resolve=>requestAnimationFrame(resolve));}
async function readyImage(image,state){
 const deadline=performance.now()+1600;
 while(state.alive&&performance.now()<deadline){
  if(image?.complete&&image.naturalWidth&&getComputedStyle(image).visibility!=='hidden'){
   // decode may reject when another floor was chosen during loading.
   await Promise.race([image.decode?.().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,100))]);
   return;
  }
  await new Promise(resolve=>setTimeout(resolve,32));
 }
}
function makeLayer(dialog,state,node,rect){
 const base=dialog.getBoundingClientRect();
 const layer=document.createElement('div');layer.className='spatial-floor-flight';layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{left:`${rect.left-base.left+dialog.scrollLeft}px`,top:`${rect.top-base.top+dialog.scrollTop}px`,width:`${rect.width}px`,height:`${rect.height}px`});
 layer.append(node);dialog.append(layer);state.nodes.push(layer);return layer;
}
function animate(state,element,frames,options){const animation=element.animate(frames,options);state.animations.push(animation);return animation;}
const timing={duration:850,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};
export function openSpatialPlan(buildingDialog,openPlanCallback){
 if(buildingDialog.classList.contains('hall-entering'))return()=>{};
 buildingDialog.classList.add('hall-entering');
 const floor=floorIn(buildingDialog),shot=snapshot(floor);
 const origin=floor?{attribute:floor.hasAttribute('data-level')?'level':'floor',value:floor.dataset.level??floor.dataset.floor}:null;
 try{openPlanCallback();}catch(error){buildingDialog.classList.remove('hall-entering');throw error;}
 buildingDialog.classList.remove('hall-entering');
 const dialog=document.querySelector('.plan-dialog[open]');
 if(!dialog)return()=>{};
 if(origin)origins.set(dialog,origin);
 const state=lifecycle(dialog);
 // The destination is already in the top layer before the building is closed.
 buildingDialog.close();
 if(reduced()||!shot){state.clean();return state.clean;}
 dialog.classList.add('spatial-transition-waiting');
 const layer=makeLayer(dialog,state,shot.node,shot.rect);
 (async()=>{
  const image=dialog.querySelector('#plan-image');
  await readyImage(image,state);await frame();
  if(!state.alive)return;
  const target=image?.getBoundingClientRect();
  if(!target?.width||!target.height){state.clean();return;}
  const dx=target.left-shot.rect.left,dy=target.top-shot.rect.top;
  const sx=target.width/shot.rect.width,sy=target.height/shot.rect.height;
  const flight=animate(state,layer,[
   {transform:'perspective(1200px) translate(0,0) rotateX(0deg) scale(1)',opacity:1},
   {transform:`perspective(1200px) translate(${dx}px,${dy}px) rotateX(-12deg) scale(${sx},${sy})`,opacity:.9,offset:.67},
   {transform:`perspective(1200px) translate(${dx}px,${dy}px) rotateX(0deg) scale(${sx},${sy})`,opacity:0}
  ],timing);
  dialog.classList.remove('spatial-transition-waiting');
  const stage=dialog.querySelector('.plan-stage');
  if(stage)animate(state,stage,[{opacity:0,transform:'perspective(1200px) rotateX(12deg) scale(.94)'},{opacity:1,transform:'none'}],{...timing,delay:230,duration:620});
  await flight.finished.catch(()=>{});state.clean();
 })().catch(()=>state.clean());
 return state.clean;
}
export function returnSpatialBuilding(planDialog,openBuildingCallback){
 running.get(planDialog)?.();
 const image=planDialog.querySelector('#plan-image');
 const rect=image?.getBoundingClientRect();
 const clone=image?.cloneNode();clone?.removeAttribute('id');
 const origin=origins.get(planDialog);
 openBuildingCallback();
 const dialog=document.querySelector('.building-dialog[open]');
 if(!dialog)return()=>{};
 const state=lifecycle(dialog);
 planDialog.close();
 const floor=floorIn(dialog,origin),target=floor?.getBoundingClientRect();
 // Resume keyboard exploration at the floor the user just left.
 floor?.focus({preventScroll:true});
 if(reduced()||!clone||!rect?.width||!target?.width){state.clean();return state.clean;}
 clone.style.visibility='visible';clone.style.transform='none';clone.style.transition='none';
 const layer=makeLayer(dialog,state,clone,rect);
 const flight=animate(state,layer,[
  {transform:'perspective(1200px) translate(0,0) rotateX(0deg) scale(1)',opacity:1},
  {transform:`perspective(1200px) translate(${target.left-rect.left}px,${target.top-rect.top}px) rotateX(18deg) scale(${target.width/rect.width},${target.height/rect.height})`,opacity:0}
 ],{...timing,duration:850});
 if(floor)animate(state,floor,[{opacity:.25},{opacity:1}],{...timing,duration:850});
 flight.finished.then(state.clean,state.clean);
 return state.clean;
}
