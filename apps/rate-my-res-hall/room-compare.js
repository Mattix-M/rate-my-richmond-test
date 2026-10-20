import data from './room-size-data.js';
import{compareRoomAreas}from'./room-dimensions.js';
import{cleanPlanAssets,loadCleanPlanAssets}from'./clean-plan-assets.js';
import{calibratePlan,safePlanDocument,transformPlanBounds}from'./room-plan-comparison.js';
const plansReady=loadCleanPlanAssets();
const planCache=new Map();
let drawingVersion=0;
async function getPlan(room){
 await plansReady;const asset=cleanPlanAssets.rooms[room.id];
 if(!asset)throw Error('A reviewed room drawing is not available for this room yet.');
 if(!planCache.has(asset.url))planCache.set(asset.url,fetch(asset.url).then(r=>{if(!r.ok)throw Error('Plan could not load.');return r.text();}).catch(e=>{planCache.delete(asset.url);throw e;}));
 return safePlanDocument(await planCache.get(asset.url),new DOMParser());
}
const $=id=>document.getElementById(id);
await plansReady;
let individualRecords=[];
try{const response=await fetch('data/housing/source-room-records.json');if(response.ok)individualRecords=await response.json();}catch{}
const halls=data.halls.map(h=>({...h,rooms:h.rooms.flatMap(room=>{
 const children=individualRecords.filter(r=>r.parent_record_id===room.id&&cleanPlanAssets.rooms[r.record_id]);
 if(children.length)return children.map(r=>({...room,id:r.record_id,room:r.room_id,basis:'published-group-dimensions'}));
 return cleanPlanAssets.rooms[room.id]?[room]:[];
})})).filter(h=>h.rooms.length);
const hallA=$('hall-a'),hallB=$('hall-b'),roomA=$('room-a'),roomB=$('room-b');
function option(select,value,text){const el=document.createElement('option');el.value=value;el.textContent=text;select.append(el);}
function hallFor(select){return halls.find(h=>h.id===select.value);}
function chosen(hall,room){return hallFor(hall)?.rooms.find(r=>r.id===room.value);}
function populateRooms(hall,room){
 const previous=room.value;room.replaceChildren();
 for(const r of hallFor(hall).rooms)option(room,r.id,`${r.room} · ${r.type} · ${r.floor}`);
 if([...room.options].some(o=>o.value===previous))room.value=previous;
 else{const regularDouble=hallFor(hall).rooms.find(r=>r.type==='double');if(regularDouble)room.value=regularDouble.id;}
}
const fmt=n=>Number(n.toFixed(1)).toLocaleString('en-US');
const ns='http://www.w3.org/2000/svg';
function svgNode(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
async function draw(a,b){
 const version=++drawingVersion,svg=$('room-overlay');
 svg.replaceChildren(svgNode('text',{x:360,y:180,'text-anchor':'middle',fill:'#575b70'},'Loading the actual room plans…'));
 try{
 const roots=await Promise.all([getPlan(a),getPlan(b)]);if(version!==drawingVersion)return;
 const rotated=$('rotate-b').checked,beside=document.querySelector('[name="layout"]:checked').value==='beside';
 svg.replaceChildren(svgNode('title',{id:'drawing-title'},'Actual room plan comparison'),svgNode('desc',{id:'drawing-desc'},'Source-derived room drawings, including closets, wall openings and doors. Approximate sizing from published dimensions when the drawing proportions agree.'));
 const plans=roots.map((root,i)=>{
  const crop=root.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
  const group=svgNode('g');while(root.firstChild)group.append(root.firstChild);svg.append(group);
  if(crop?.length===4){const clip=svgNode('clipPath',{id:`room-crop-${i}`});clip.append(svgNode('rect',{x:crop[0],y:crop[1],width:crop[2],height:crop[3]}));const defs=svgNode('defs');defs.append(clip);svg.prepend(defs);group.setAttribute('clip-path',`url(#room-crop-${i})`);}
  const floor=[...group.querySelectorAll('[fill="#e7eee5"]')].map(el=>transformPlanBounds(el.getBBox(),group.getCTM().inverse().multiply(el.getCTM()))).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
  const bounds=group.getBBox();
  const box=crop?.length===4?{x:Math.max(bounds.x,crop[0]),y:Math.max(bounds.y,crop[1]),width:Math.min(bounds.x+bounds.width,crop[0]+crop[2])-Math.max(bounds.x,crop[0]),height:Math.min(bounds.y+bounds.height,crop[1]+crop[3])-Math.max(bounds.y,crop[1])}:bounds;
  const calibration=floor?calibratePlan(floor,i?b:a):null;
  const color=i?'#990000':'#294987';
  for(const el of group.querySelectorAll('*')){
   const fill=el.getAttribute('fill'),stroke=el.getAttribute('stroke');
   if(fill&&fill!=='none'){el.setAttribute('fill',color);el.setAttribute('fill-opacity',fill==='#e7eee5'?'.1':'.06');}
   if(stroke&&stroke!=='none'){el.setAttribute('stroke',color);el.setAttribute('stroke-opacity','.85');}
  }
  return {group,box,calibration};
 });
 const shared=plans.every(p=>p.calibration);
 // Uncalibrated drawings are shown as illustrations; never invent a feet scale.
 for(const p of plans)p.factor=shared?p.calibration.unitsToFeet:18/Math.max(p.box.width,p.box.height);
 const dims=plans.map((p,i)=>({w:(i&&rotated?p.box.height:p.box.width)*p.factor,h:(i&&rotated?p.box.width:p.box.height)*p.factor}));
 const gap=shared?4:3,totalW=beside?dims[0].w+dims[1].w+gap:Math.max(...dims.map(d=>d.w)),totalH=Math.max(...dims.map(d=>d.h));
 const scale=Math.min(600/totalW,280/totalH),left=(720-totalW*scale)/2,bottom=330;
 if(shared){
  const defs=svgNode('defs'),pattern=svgNode('pattern',{id:'feet-grid',width:scale*5,height:scale*5,patternUnits:'userSpaceOnUse',x:left,y:bottom});pattern.append(svgNode('path',{d:`M ${scale*5} 0 H 0 V ${scale*5}`,fill:'none',stroke:'#dce2ec','stroke-width':1}));defs.append(pattern);svg.prepend(defs);svg.insertBefore(svgNode('rect',{x:35,y:25,width:650,height:320,fill:'url(#feet-grid)'}),plans[0].group);
 }
 plans.forEach((p,i)=>{
  const {x,y,width:w,height:h}=p.box,xx=left+(i&&beside?(dims[0].w+gap)*scale:0),s=p.factor*scale;
  const transform=i&&rotated?`translate(${xx+dims[i].w*scale} ${bottom-dims[i].h*scale}) scale(${s}) rotate(90) translate(${-x} ${-y})`:`translate(${xx} ${bottom-dims[i].h*scale}) scale(${s}) translate(${-x} ${-y})`;
  p.group.setAttribute('transform',transform);p.group.setAttribute('data-room-plan',i?'B':'A');
  if(beside)svg.append(svgNode('text',{x:xx,y:bottom-dims[i].h*scale-12,fill:i?'#990000':'#294987','font-size':16,'font-weight':700},i?'B':'A'));
 });
 const note=shared?'Approximate scale · 5-foot grid':'Illustrations only · source proportions cannot establish a shared scale';
 svg.append(svgNode('text',{x:360,y:378,'text-anchor':'middle',fill:'#575b70','font-size':14,'font-family':'Arial, sans-serif'},note));
 $('plan-scale-note').textContent=shared?'Actual plan drawings, uniformly sized against the published room dimensions. Scale is approximate; closets and alcoves retain their drawn shape.':'Actual plan drawings. At least one drawing does not match its published dimensions closely enough to scale reliably. These illustrations do not establish which room is larger.';
 }catch(error){if(version!==drawingVersion)return;svg.replaceChildren(svgNode('text',{x:360,y:170,'text-anchor':'middle',fill:'#575b70','font-size':15},'Room plan unavailable. Try another room.'));$('plan-scale-note').textContent=error.message;}
}
function measure(room,hall,key){
 const box=document.createElement('section');box.className='room-measure';
 const title=document.createElement('h2');title.textContent=`${key} / ${hall.name} · ${room.room}`;box.append(title);
 for(const text of [`${room.type[0].toUpperCase()+room.type.slice(1)}${room.occupancy?` · ${room.occupancy} ${room.occupancy===1?'resident':'residents'}`:''} · ${room.floor}`,`${room.basis==='published-type-default'?'Published double-room default':'Published'}: ${room.dimensions}`,`Rectangle estimate: ${fmt(room.width*room.height)} sq ft`]){const p=document.createElement('p');p.textContent=text;box.append(p);}
 if(room.basis==='published-type-default'){const note=document.createElement('p');note.className='dimension-basis';note.textContent='The university lists this size for doubles unless otherwise noted; this is not a separate measurement of this room.';box.append(note);}
 if(room.basis==='published-group-dimensions'){const note=document.createElement('p');note.className='dimension-basis';note.textContent='Dimensions are inherited from the university’s room-group description; this room is individually identified on the plan.';box.append(note);}
 const drawing=cleanPlanAssets.rooms[room.id];if(drawing){const planLink=document.createElement('a');planLink.href=drawing.url;planLink.target='_blank';planLink.rel='noopener';planLink.textContent='Open room drawing ↗';planLink.className='room-plan-link';box.append(planLink);}
 const link=document.createElement('a');link.href=room.source;link.target='_blank';link.rel='noopener';link.textContent='University room description ↗';box.append(link);return box;
}
function render(){
 const a=chosen(hallA,roomA),b=chosen(hallB,roomB);if(!a||!b)return;
 const {difference,percent}=compareRoomAreas(a.width*a.height,b.width*b.height);
 const result=document.createElement('p');result.className='room-result';
 result.textContent=Math.abs(difference)<.05?'Same rectangle area. Different room.':`From the listed dimensions, B is about ${fmt(Math.abs(difference))} sq ft ${difference>0?'larger':'smaller'} (${fmt(Math.abs(percent))}%).`;
 if(a.id===b.id)result.textContent='Same room. Same plan.';
 const small=document.createElement('small');small.textContent='Percentage compares B with A. This length × width estimate is separate from the drawn outline; it is not measured usable floor area.';result.append(small);
 $('room-result').replaceChildren(result);
 $('room-measures').replaceChildren(measure(a,hallFor(hallA),'A'),measure(b,hallFor(hallB),'B'));draw(a,b);
 const params=new URLSearchParams({a:a.id,b:b.id});if($('rotate-b').checked)params.set('rotate','1');if(document.querySelector('[name="layout"]:checked').value==='beside')params.set('view','beside');history.replaceState(null,'',`#${params}`);
}
for(const select of[hallA,hallB])for(const h of halls)option(select,h.id,h.name);
const params=new URLSearchParams(location.hash.slice(1));
const requestedHallName=new URLSearchParams(location.search).get('hall');
const requestedHall=halls.find(h=>h.name===requestedHallName);
if(requestedHallName&&!requestedHall){const note=$('requested-hall-note');note.hidden=false;note.textContent=`We don’t have a usable dimension pair for ${requestedHallName} in this comparison yet. You can compare the available rooms below.`;}
for(const [hall,room,key,fallback]of[[hallA,roomA,'a','dennis'],[hallB,roomB,'b','moore-hall']]){
 const requested=params.get(key),found=halls.find(h=>h.rooms.some(r=>r.id===requested));
 hall.value=found?.id||(key==='a'&&requestedHall?requestedHall.id:(halls.find(h=>h.id===fallback)?.id||halls[0].id));populateRooms(hall,room);if(found)room.value=requested;
 hall.addEventListener('change',()=>{populateRooms(hall,room);render();});room.addEventListener('change',render);
}
$('rotate-b').checked=params.get('rotate')==='1';if(params.get('view')==='beside')document.querySelector('[name="layout"][value="beside"]').checked=true;
$('rotate-b').addEventListener('change',render);for(const radio of document.querySelectorAll('[name="layout"]'))radio.addEventListener('change',render);
addEventListener('hashchange',()=>{
 const state=new URLSearchParams(location.hash.slice(1));
 for(const [hall,room,key]of[[hallA,roomA,'a'],[hallB,roomB,'b']]){
  const id=state.get(key),found=halls.find(h=>h.rooms.some(r=>r.id===id));
  if(found){hall.value=found.id;populateRooms(hall,room);room.value=id;}
 }
 $('rotate-b').checked=state.get('rotate')==='1';
 document.querySelector(`[name="layout"][value="${state.get('view')==='beside'?'beside':'overlay'}"]`).checked=true;
 render();
});
$('coverage').textContent=`${halls.reduce((n,h)=>n+h.rooms.length,0).toLocaleString()} rooms with drawings and published dimensions across ${halls.length} halls/buildings in this snapshot. Source records retrieved October 19, 2026; this is comparison coverage, not total housing inventory. Some room dimensions are inherited from a published room-group description.`;
render();
