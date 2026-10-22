import {housingTours} from './housing-tours.js';
import {plannerRooms,furnitureCatalog,checkPlacement} from './dorm-planner-data.js';
import {STORAGE_KEY,readLayouts,findOpenPosition,starterLayout} from './dorm-planner-state.js';
import {createPlannerScene} from './dorm-planner-scene.js';
const $=id=>document.getElementById(id);
const roomSelect=$('planner-room'),pieceSelect=$('piece-list'),status=$('placement-status');
const ufaFloorIds=['tour-ufa-living','tour-ufa-upstairs'],ufaChoiceId='tour-ufa-apartment';
let layouts={};try{layouts=readLayouts(localStorage.getItem(STORAGE_KEY));}catch{}
const requested=new URLSearchParams(location.search),requestedHall=housingTours.find(t=>t.placeId===requested.get('hall'));
let room=plannerRooms.find(r=>r.id===requested.get('room'))||plannerRooms.find(r=>r.scaleStatus&&r.hall===requestedHall?.name)||plannerRooms.find(r=>r.id==='tour-gateway-example')||plannerRooms[0];
let selectedUfaFloor=ufaFloorIds.includes(room.id)?room.id:ufaFloorIds[0];
let items=[],selectedId=null,history=[],scene,arrangementJob=null;
const copy=value=>JSON.parse(JSON.stringify(value));
const nameOf=item=>item?.type==='bed'&&room.scaleStatus&&room.initialFurniture?.some(p=>p.id===item.id)?'Bed (tour reference)':furnitureCatalog.find(p=>p.type===item?.type)?.name||'Piece';
function say(message,warning=false){status.textContent=message;status.dataset.warning=String(warning);}
function persist(){layouts[room.id]=copy(items);try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,rooms:layouts}));$('save-status').textContent='Saved on this device';}catch{$('save-status').textContent='Storage unavailable · layout lasts for this visit';}}
function cancelArrangement(){arrangementJob?.terminate();arrangementJob=null;}
function checkpoint(){cancelArrangement();history.push(copy(items));if(history.length>30)history.shift();}
function show(){
 scene?.setItems(items,selectedId);
 pieceSelect.replaceChildren(new Option('Choose a piece',''),...items.map((item,index)=>new Option(`${index+1}. ${nameOf(item)}`,item.id)));
 pieceSelect.value=selectedId||'';
 const item=items.find(i=>i.id===selectedId);
 $('piece-fields').disabled=!item;$('piece-fields').hidden=!item;$('editor-empty').hidden=!!item;
 $('selected-kind').hidden=!item;$('piece-name').textContent=item?nameOf(item):'Adjust the piece';
 for(const [id,key] of [['width','width'],['depth','depth'],['height','height'],['angle','rotation'],['x','x'],['z','z']])$('piece-'+id).value=item?Number(item[key].toFixed(2)):'';
 $('tidy-layout').disabled=!items.length||!!arrangementJob;$('tidy-layout').textContent=arrangementJob?'Arranging…':'Arrange furniture';$('undo-layout').disabled=!history.length;$('piece-count').textContent=`${items.length} / 30 pieces`;
}
function select(id){selectedId=id;show();if(id){const item=items.find(i=>i.id===id);const overlap=checkPlacement(room,item,items).overlaps.length;say(overlap?`${nameOf(item)} overlaps another piece. Move or resize it.`:`${nameOf(item)} selected. Drag it, or use the controls to adjust it.`,!!overlap);}}
function updateItem(id,changes){
 const current=items.find(i=>i.id===id);if(!current)return;
 const next={...current,...changes};
 if(!['x','z','width','depth','height','rotation'].every(k=>Number.isFinite(next[k]))||next.width<.5||next.depth<.5||next.width>20||next.depth>20||next.height<.02||next.height>10){say('Enter a valid size: width and depth 0.5–20 ft; height 0.02–10 ft.',true);show();return;}
 next.rotation=((next.rotation%360)+360)%360;
 const check=checkPlacement(room,next,items),fixedIds=new Set(room.obstacles.map(o=>o.id));
 if(!check.inside||check.overlaps.some(id=>fixedIds.has(id))){say('That spot crosses a wall or a built-in feature. Try another position.',true);show();return;}
 checkpoint();items=items.map(i=>i.id===id?next:i);persist();show();
 say(check.overlaps.length?'These pieces overlap. Move or resize one to make space.':`${nameOf(next)} updated.`,!!check.overlaps.length);
}
function openRoom(next){
 cancelArrangement();
 room=next;items=copy(layouts[room.id]??starterLayout(room));selectedId=null;history=[];
 const isUfa=ufaFloorIds.includes(room.id);if(isUfa)selectedUfaFloor=room.id;
 roomSelect.value=isUfa?ufaChoiceId:room.id;$('planner-floor-switch').hidden=!isUfa;
 $('floor-downstairs').setAttribute('aria-pressed',String(room.id===ufaFloorIds[0]));$('floor-upstairs').setAttribute('aria-pressed',String(room.id===ufaFloorIds[1]));
 $('scene-room-name').textContent=`${room.hall} · ${room.name}`;$('room-dimensions').textContent=room.dimensionLabel;$('room-notes').textContent=room.notes;
 $('room-source').href=room.planUrl;$('room-source').textContent=room.scaleStatus?'Compare with original tour ↗':'See the room drawing ↗';$('scale-status').textContent=room.scaleStatus?'Unmeasured reconstruction':'Approximate scale';
 const tour=housingTours.find(t=>t.name===room.hall);$('room-tour').hidden=!tour;if(tour)$('room-tour').href=tour.url;
 scene?.setRoom(room);scene?.resetCamera();$('view-perspective').setAttribute('aria-pressed','true');$('view-top').setAttribute('aria-pressed','false');
 const url=new URL(location.href);url.searchParams.delete('hall');url.searchParams.set('room',room.id);window.history.replaceState(null,'',url);
 persist();show();const overlaps=items.some(item=>checkPlacement(room,item,items).overlaps.length);say(overlaps?'Some pieces overlap. Select them to adjust the layout.':'Your room is ready. Select a piece to rearrange it.',overlaps);
}
const icons={bed:'M3 17V7m18 10V9M3 13h18v5M4 9h5v4M9 9h11v4',desk:'M3 9h18M5 9v11m14-11v11M13 9v6h6',chair:'M6 4h12v9H6zM5 14h14M7 14v6m10-6v6',dresser:'M5 3h14v17H5zM5 9h14M5 14h14M10 6h4M10 12h4M10 17h4',futon:'M5 10V6h14v4M3 10h3v6h12v-6h3v9H3zM5 19v2m14-2v2',fridge:'M6 3h12v18H6zM6 9h12M9 5v2m0 5v4',table:'M3 7h18v3H3zM6 10v10M18 10v10',rug:'M4 5h16v14H4zM7 8h10v8H7zM2 7h2m-2 4h2m-2 4h2m16-8h2m-2 4h2m-2 4h2'};
for(const definition of furnitureCatalog){
 const button=document.createElement('button');button.type='button';button.title=`Add ${definition.name.toLowerCase()}`;button.setAttribute('aria-label',button.title);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[definition.type]||icons.dresser);svg.append(path);const label=document.createElement('span');label.textContent=definition.name;button.append(svg,label);
 button.addEventListener('click',()=>{if(items.length>=30){say('This beta holds up to 30 pieces per room.',true);return;}const next=findOpenPosition(room,{...definition,id:globalThis.crypto?.randomUUID?.()||`piece-${Date.now()}-${Math.random().toString(16).slice(2)}`,rotation:0},items);if(!next){say('No clear spot for that piece. Move or remove something first.',true);return;}checkpoint();items.push(next);selectedId=next.id;persist();show();say(`${definition.name} added. Drag it into place.`);});$('furniture-catalog').append(button);
}
for(const r of plannerRooms){
 if(r.id===ufaFloorIds[1])continue;
 roomSelect.add(new Option(r.id===ufaFloorIds[0]?`${r.hall} · Tour example · apartment`:`${r.hall} · ${r.name}`,r.id===ufaFloorIds[0]?ufaChoiceId:r.id));
}
roomSelect.addEventListener('change',()=>openRoom(plannerRooms.find(r=>r.id===(roomSelect.value===ufaChoiceId?selectedUfaFloor:roomSelect.value))||plannerRooms[0]));
for(const [buttonId,floorId] of [['floor-downstairs',ufaFloorIds[0]],['floor-upstairs',ufaFloorIds[1]]])$(buttonId).addEventListener('click',()=>{const next=plannerRooms.find(r=>r.id===floorId);if(next&&room.id!==floorId)openRoom(next);});
pieceSelect.addEventListener('change',()=>select(pieceSelect.value||null));
for(const [id,key] of [['width','width'],['depth','depth'],['height','height'],['angle','rotation'],['x','x'],['z','z']])$('piece-'+id).addEventListener('change',event=>updateItem(selectedId,{[key]:event.target.value===''?NaN:Number(event.target.value)}));
$('rotate-piece').addEventListener('click',()=>{const item=items.find(i=>i.id===selectedId);if(item)updateItem(item.id,{rotation:item.rotation+90});});
$('remove-piece').addEventListener('click',()=>{if(!selectedId)return;checkpoint();items=items.filter(i=>i.id!==selectedId);selectedId=null;persist();show();say('Piece removed. Undo brings it back.');});
$('undo-layout').addEventListener('click',()=>{if(!history.length)return;cancelArrangement();items=history.pop();if(!items.some(i=>i.id===selectedId))selectedId=null;persist();show();say('Last change undone.');});
$('tidy-layout').addEventListener('click',()=>{
 if(arrangementJob)return;
 try{
  const worker=new Worker(new URL('./dorm-layout-worker.js',import.meta.url),{type:'module'});arrangementJob=worker;
  worker.onmessage=({data:next})=>{if(arrangementJob!==worker)return;cancelArrangement();if(!next){show();say('Couldn’t arrange every piece with space by the entrance. Nothing changed. Try fewer or smaller pieces.',true);return;}checkpoint();items=next;persist();show();say('Furniture rearranged with space by the entrance. Check the fit and walking space; Undo restores your layout.');};
  worker.onerror=()=>{if(arrangementJob!==worker)return;cancelArrangement();show();say('Automatic arrangement couldn’t run. Your layout is unchanged; you can still move each piece.',true);};
  worker.postMessage({room,items});show();say('Trying an arrangement. You can keep exploring the room.');
 }catch{cancelArrangement();show();say('Automatic arrangement isn’t available in this browser. You can still move each piece.',true);}
});
$('reset-layout').addEventListener('click',()=>{checkpoint();items=starterLayout(room);selectedId=null;persist();show();say('Starter layout restored. You can undo this.');});
for(const [id,view] of [['view-perspective','perspective'],['view-top','top']])$(id).addEventListener('click',()=>{scene.setView(view);$('view-perspective').setAttribute('aria-pressed',String(view==='perspective'));$('view-top').setAttribute('aria-pressed',String(view==='top'));});
$('zoom-in').addEventListener('click',()=>scene.zoomBy(.85));
$('zoom-out').addEventListener('click',()=>scene.zoomBy(1/.85));
$('reset-camera').addEventListener('click',()=>{scene.resetCamera();$('view-perspective').setAttribute('aria-pressed','true');$('view-top').setAttribute('aria-pressed','false');});
scene=createPlannerScene($('planner-scene'),{onSelect:select,onMove:(id,x,z)=>updateItem(id,{x,z}),onError:message=>say(message,true)});
openRoom(room);
window.addEventListener('pagehide',event=>{if(!event.persisted){cancelArrangement();scene.dispose();}});
