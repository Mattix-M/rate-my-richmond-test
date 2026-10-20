import {hallGuideMarkup,connectHallGuide} from './hall-guide.js';
import {animateResidenceArrival,cancelResidenceArrival} from './residence-arrival.js';
import {openSpatialPlan} from './spatial-transition.js';
import {interactiveBuildingMarkup} from './interactive-building.js';
import {openUfaImmersive} from './ufa-immersive.js';
// Shared transition lifecycle: Escape/Map always cancel a pending entry.
function explorerMotion(dialog){
 let cancelFlight=null;
 const cancel=()=>{cancelResidenceArrival(dialog);cancelFlight?.();cancelFlight=null;dialog.classList.remove('hall-entering');dialog.querySelectorAll('button').forEach(button=>button.disabled=false);};
 const enter=callback=>{
  cancelResidenceArrival(dialog);
  if(dialog.classList.contains('hall-entering'))return;
  cancelFlight=openSpatialPlan(dialog,()=>{if(dialog.open)callback();});
 };
 dialog.addEventListener('close',()=>{
  if(dialog.open)return; // Ignore a queued close from the previous opening.
  cancelResidenceArrival(dialog);
  // A successful handoff closes the building while the plan's flight continues.
  if(!document.querySelector('.plan-dialog[open]'))cancel();
 });
 return{cancel,enter};
}
function connectFloorRail(dialog,attribute,select){
 const buttons=[...dialog.querySelectorAll('.floor-rail button')];
 const slabs=[...dialog.querySelectorAll('.floor-slab')];
 const targets=[...buttons,...slabs];
 const preview=value=>targets.forEach(target=>target.classList.toggle('preview',target.dataset[attribute]===value));
 targets.forEach(target=>{
  target.onclick=()=>{if(!dialog.classList.contains('hall-entering'))select(Number(target.dataset[attribute]));};
  target.onpointerenter=target.onfocus=()=>preview(target.dataset[attribute]);
  target.onpointerleave=target.onblur=()=>preview(undefined);
 });
 slabs.forEach(slab=>{
  slab.onkeydown=event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!dialog.classList.contains('hall-entering'))select(Number(slab.dataset[attribute]));}
  };
 });
 buttons.forEach((button,index)=>{
  button.onkeydown=event=>{
   const next=event.key==='ArrowDown'?Math.min(index+1,buttons.length-1):event.key==='ArrowUp'?Math.max(index-1,0):event.key==='Home'?0:event.key==='End'?buttons.length-1:-1;
   if(next>=0){event.preventDefault();buttons[next].focus();}
  };
 });
}
// A selected floor can always fold back into the complete building.
function resetFloorSelection(dialog,motion,initialChoice){
 const selected=dialog.querySelector('.floor-rail button.active');
 motion.cancel();
 dialog.classList.remove('has-floor-selection');
 dialog.querySelectorAll('.floor-slab,.floor-rail button').forEach(target=>{
  target.classList.remove('active','preview');
  target.setAttribute('aria-pressed','false');
 });
 dialog.querySelector('.building-choice').innerHTML=initialChoice;
 selected?.focus({preventScroll:true});
 dialog.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function connectFoldButton(dialog,reset){
 dialog.querySelector('.building-fold').onclick=reset;
 // Keep the newly revealed choices in view, especially on short screens.
 dialog.querySelector('.building-choice').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
// Only skip the chooser when there is one current drawing; wings stay explicit.
export function directFloorPlan(plans){const current=plans.filter(plan=>!plan.legacy);return current.length===1?current[0]:null;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ufaPlanForUnit(plans,unit){const single=['160F','164H','166A','486A'].includes(unit);return plans.find(p=>single?p.label==='One-Level UFA Floor Plans':p.sourceUrl.endsWith('ren1.pdf'));}
export function createBuildingExplorer(housing,onPlan,options={}){
 const dialog=document.createElement('dialog');dialog.className='building-dialog';dialog.setAttribute('aria-label','Explore apartment building');document.body.append(dialog);
 const motion=explorerMotion(dialog);
 function open(place,block,transition={}){motion.cancel();history.replaceState(null,'',`#place=${place.id}&block=${block.number}`);const gateway=block.kind==='gateway';const plans=housing.places[place.id].plans.filter(p=>!gateway||p.buildingId===`gateway-${block.number}`);
  if(!gateway){openUfaImmersive(dialog,place,block,plans,transition,options);return;}
  dialog.className='building-dialog has-exterior has-hall-guide gateway-dialog';
  dialog.innerHTML=`<header><button class="building-back">← Map</button><span>${gateway?'Gateway':'UFA'} / ${esc(block.number)}</span><button class="building-close" aria-label="Close building">×</button></header><div class="building-content"><div class="building-intro"><span class="eyebrow">${gateway?'GATEWAY VILLAGE':'UNIVERSITY FOREST'}</span><h2>Building ${esc(block.number)}</h2><p>${gateway?'Hover a floor to highlight it. Click to explore its apartments.':'Choose your apartment.'}</p></div><div class="building-scene" aria-label="Illustrated floor selector">${interactiveBuildingMarkup(`${place.name} ${block.number}`,Array.from({length:4},(_,i)=>({label:`Floor ${i+1}`,value:i+1})),'level')}<div class="floor-rail">${Array.from({length:gateway?4:2},(_,i)=>`<button style="--level:${i}" data-level="${i+1}" aria-pressed="false" aria-label="${gateway?`Choose floor ${i+1}`:i===0?'Choose living layouts':'Choose upper bathroom detail'}">${gateway?`Floor ${i+1}`:i===0?'Living layouts':'Bath detail'} <span>↗</span></button>`).reverse().join('')}</div><span class="model-note">Illustrated floor selector · not an exterior survey</span></div>${hallGuideMarkup(place,options.stats?.[place.id],options.facts?.[place.id])}<section class="building-choice" aria-live="polite">${gateway?'<h3>Choose a floor above</h3><p>Then choose an apartment plan.</p>':`<form class="unit-form"><label for="ufa-unit">Apartment</label><div><input id="ufa-unit" placeholder="${esc(block.number)}A" aria-label="UFA apartment number" maxlength="8" autocomplete="off"><button type="submit">Explore →</button></div></form><p class="unit-help">Enter your unit, e.g. ${esc(block.number)}A. Its location is shown at building level.</p><button class="generic-layout">Just show the shared layouts →</button>`}</section></div>`;
  connectHallGuide(dialog,place,options);
  const initialChoice=dialog.querySelector('.building-choice').innerHTML;
  const reset=()=>resetFloorSelection(dialog,motion,initialChoice);
  const leave=()=>{motion.cancel();dialog.close();history.replaceState(null,'',`#place=${place.id}`);};dialog.querySelector('.building-back').onclick=leave;dialog.querySelector('.building-close').onclick=leave;dialog.oncancel=e=>{e.preventDefault();if(dialog.classList.contains('has-floor-selection'))reset();else leave();};
  function chooseFloor(level){cancelResidenceArrival(dialog);dialog.classList.add('has-floor-selection');dialog.querySelectorAll('[data-level]').forEach(el=>{el.classList.toggle('active',Number(el.dataset.level)===level);if(el.tagName==='BUTTON'||el.getAttribute('role')==='button')el.setAttribute('aria-pressed',String(Number(el.dataset.level)===level));});
   const selected=gateway?plans.filter(p=>p.floorLabel.includes(['First','Second','Third','Fourth'][level-1])):plans.filter(p=>level===1?!p.sourceUrl.endsWith('ren2.pdf'):p.sourceUrl.endsWith('ren2.pdf'));
   const direct=directFloorPlan(selected);if(direct){enter(direct.id);return;}
   const choice=dialog.querySelector('.building-choice');choice.innerHTML=`<button class="building-fold" type="button">← Back to building</button><h3>${gateway?`Floor ${level}`:level===1?'Living level':'Upper-level bathroom'}</h3>${selected.length?'':'<p>No drawing is available for this floor yet.</p>'}${!gateway?'<p>The supplied UFA drawings are shared templates; the upper-level file shows bathroom detail only.</p>':''}<div class="apartment-plans">${selected.map(p=>`<button data-plan="${p.id}"><span>${gateway?p.label.split(' · ').at(-1):p.label}</span><b>↗</b></button>`).join('')}</div>`;
   connectFoldButton(dialog,reset);
   choice.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>enter(b.dataset.plan));
  }
  function enter(plan,unit){if(!dialog.querySelector('.floor-slab.active'))dialog.querySelector('.floor-slab')?.classList.add('active');motion.enter(()=>onPlan(place,block,{plan,unit}));}
  connectFloorRail(dialog,'level',chooseFloor);
  if(!gateway){dialog.querySelector('.generic-layout').onclick=()=>chooseFloor(1);dialog.querySelector('.unit-form').onsubmit=e=>{e.preventDefault();const input=dialog.querySelector('#ufa-unit');const unit=input.value.trim().toUpperCase();if(!new RegExp('^'+block.number+'[A-Z]$').test(unit)){input.setCustomValidity(`Enter ${block.number} followed by one apartment letter, such as ${block.number}A.`);input.reportValidity();return;}input.setCustomValidity('');const target=ufaPlanForUnit(plans,unit);if(target)enter(target.id,unit);};dialog.querySelector('#ufa-unit').oninput=e=>e.target.setCustomValidity('');}
  if(!dialog.open)dialog.showModal();
  animateResidenceArrival(dialog,transition.origin);
  dialog.scrollTop=0;
 }
 return{open};
}

// Keep shared source drawings together; never manufacture missing floors.
export function hallFloorGroups(plans){
 const order={ground:0,first:1,second:2,third:3,fourth:4,fifth:5,sixth:6};
 const grouped=new Map();
 for(const plan of plans){
  const individual=/^(Ground (?:Level|Floor)|(?:First|Second|Third|Fourth|Fifth|Sixth) Floor)$/i.test(plan.label);
  const label=individual?plan.label:(plan.floorLabel||'Available plans');
  if(!grouped.has(label))grouped.set(label,{label,plans:[],rank:order[label.split(/\s/)[0].toLowerCase()]??99});
  grouped.get(label).plans.push(plan);
 }
 return [...grouped.values()].sort((a,b)=>a.rank-b.rank);
}

export function createHallExplorer(housing,onPlan,options={}){
 const dialog=document.createElement('dialog');
 dialog.className='building-dialog hall-dialog';
 dialog.setAttribute('aria-label','Explore residence hall');
 document.body.append(dialog);
 const motion=explorerMotion(dialog);
 function open(place,route={}){
  const groups=hallFloorGroups(housing.places[place.id]?.plans||[]);
  if(!groups.length)return false;
  motion.cancel();
  dialog.classList.add('has-exterior','has-hall-guide');dialog.classList.remove('has-floor-selection');
  history.replaceState(null,'',`#place=${place.id}`);
  const fact=options.facts?.[place.id],stats=options.stats?.[place.id];
  const shortLabel=label=>label.replace('Ground Level','Ground').replace('Ground Floor','Ground').replace(/ Floors?\b/g,'');
  dialog.innerHTML=`<header><button class="building-back">← Map</button><span>Explore the hall</span><button class="building-close" aria-label="Close hall">×</button></header><div class="building-content"><div class="building-intro"><span class="eyebrow">RESIDENCE HALL</span><h2>${esc(place.name)}</h2><p>Hover a floor to highlight it. Click to unfold its layout.</p></div>${hallGuideMarkup(place,stats,fact)}<div class="hall-stage"><div class="building-scene" aria-label="Illustrated floor selector">${interactiveBuildingMarkup(place.name,groups.map((group,i)=>({label:group.label,value:i})),'floor')}</div><div class="floor-rail" role="group" aria-label="Available floors">${groups.map((group,i)=>`<button type="button" data-floor="${i}" aria-pressed="false" aria-controls="hall-floor-choice"><span>${esc(shortLabel(group.label))}</span><span aria-hidden="true">↗</span></button>`).reverse().join('')}</div><span class="model-note">Illustrated selector · available floor plans</span></div><section id="hall-floor-choice" class="building-choice" aria-live="polite"><h3>Pick a floor</h3><p>Select a floor to see its plans.</p></section></div>`;
  connectHallGuide(dialog,place,options);
  const initialChoice=dialog.querySelector('.building-choice').innerHTML;
  const reset=()=>resetFloorSelection(dialog,motion,initialChoice);
  function leave(){motion.cancel();dialog.close();history.replaceState(null,'',`#place=${place.id}`);options.onClose?.(place);}
  dialog.querySelector('.building-back').onclick=leave;
  dialog.querySelector('.building-close').onclick=leave;
  dialog.oncancel=event=>{event.preventDefault();if(dialog.classList.contains('has-floor-selection'))reset();else leave();};
  function enter(plan){motion.enter(()=>onPlan(place,{plan}));}
  function select(index,{navigate=true}={}){
   cancelResidenceArrival(dialog);
   dialog.classList.add('has-floor-selection');
   const group=groups[index];
   dialog.querySelectorAll('[data-floor]').forEach(el=>{
    const active=Number(el.dataset.floor)===index;
    el.classList.toggle('active',active);
    if(el.tagName==='BUTTON'||el.getAttribute('role')==='button')el.setAttribute('aria-pressed',String(active));
   });
   const direct=directFloorPlan(group.plans);
   if(navigate&&direct){enter(direct.id);return;}
   if(!navigate&&direct){
    // Returning from a single-plan floor needs no second chooser step.
    dialog.classList.remove('has-floor-selection');
    return;
   }
   const current=group.plans.filter(plan=>!plan.legacy);
   const archived=group.plans.filter(plan=>plan.legacy);
   const planLabel=plan=>plan.label.startsWith(group.label+' · ')?plan.label.slice(group.label.length+3):plan.label===group.label?'Explore rooms':plan.label;
   const planButtons=plans=>plans.map(plan=>`<button type="button" data-plan="${esc(plan.id)}"><span>${esc(planLabel(plan))}</span><b aria-hidden="true">↗</b></button>`).join('');
   const choice=dialog.querySelector('.building-choice');
   choice.innerHTML=`<button class="building-fold" type="button">← Back to building</button><h3>${esc(group.label)}</h3><div class="apartment-plans">${planButtons(current)}</div>${archived.length?`<details class="hall-archives"><summary>Earlier drawings</summary><div class="apartment-plans">${planButtons(archived)}</div></details>`:''}`;
   connectFoldButton(dialog,reset);
   choice.querySelectorAll('[data-plan]').forEach(button=>button.onclick=()=>enter(button.dataset.plan));
  }
  connectFloorRail(dialog,'floor',select);
  if(route.plan){const index=groups.findIndex(group=>group.plans.some(plan=>plan.id===route.plan));if(index>=0)select(index,{navigate:false});}
  if(!dialog.open)dialog.showModal();
  if(!route.plan)animateResidenceArrival(dialog,route.origin);
  dialog.scrollTop=0;
  return true;
 }
 return{open};
}
