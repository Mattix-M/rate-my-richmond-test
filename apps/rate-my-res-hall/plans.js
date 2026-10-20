import {returnSpatialBuilding} from './spatial-transition.js';
import {connectPlanGestures} from './plan-gestures.js';
import { cleanPlanAssets, loadCleanPlanAssets } from './clean-plan-assets.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPlanViewer(index,places,options={}) {
 const dialog=document.createElement('dialog');dialog.className='plan-dialog';dialog.setAttribute('aria-label','Residence floor plans');
 dialog.innerHTML=`<header class="plan-header"><button class="back-campus">← Back to campus</button><div><span class="eyebrow">INSIDE YOUR RESIDENCE</span><h2 id="plan-title"></h2></div><label class="dorm-select-label">Residence<select id="dorm-select" aria-label="Choose residence">${places.filter(p=>index.places[p.id]).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><button class="plan-close" aria-label="Close floor plans">×</button></header><div class="plan-toolbar"><label>Floor / layout<select id="floor-select"></select></label><label id="page-label" hidden>Page<select id="page-select"></select></label><button id="return-floor" hidden>← Whole floor</button><button id="back-building" hidden>← Building</button><button id="toggle-plan-style" hidden aria-pressed="true">Original drawing</button><button id="toggle-rooms" aria-expanded="false">Find room</button><button id="toggle-room-labels" aria-pressed="false" title="Show room numbers">#</button><div class="plan-zoom"><button id="plan-minus" aria-label="Zoom out of floor plan">−</button><button id="plan-fit">Fit</button><button id="plan-plus" aria-label="Zoom into floor plan">+</button></div><a id="plan-original" target="_blank" rel="noopener">Open original ↗</a></div><div class="plan-body"><section class="plan-main" aria-label="Plan preview"><div class="plan-notice" id="plan-notice"></div><div class="plan-canvas" tabindex="0" aria-label="Scrollable floor plan preview"><div class="plan-image-wrap"><div class="plan-stage"><img id="plan-image" alt=""><div id="room-hotspots" aria-label="Clickable room labels"></div></div></div></div><div class="plan-caption"><span id="plan-caption"></span><a id="plan-source" target="_blank" rel="noopener">University source ↗</a></div></section><aside class="room-panel"><div class="room-panel-heading"><h3>Find your room</h3><p id="room-instructions">Click a marked room on the plan to see its details.</p><input id="room-search" type="search" placeholder="Search room number or description…" aria-label="Search rooms across this residence"><label class="room-scope">Show <select id="room-scope"><option value="floor">This floor</option><option value="hall">All floors</option></select></label><span id="room-count" aria-live="polite"></span></div><section id="selected-room" aria-live="polite" hidden></section><div id="room-records"></div></aside></div><details class="plan-source-notes"><summary>Source notes & coverage</summary><p id="plan-provenance" class="footnote"></p><div id="plan-issues"></div></details>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s);let currentPlace,entry,plan,page=0,zoom=1,rooms=null,roomPromise=null,previewToken=0,labelMap=null,selectedRoomId=null,roomLayouts=null,activeLayout=null,sourceExceptions={},showToken=0,selectedBlock=null,selectedUnit=null,planNotice='',preferClean=true,pendingOrigin=null;
 const rasterOptIns=new Set();
 const cleanPromise=loadCleanPlanAssets().then(()=>{if(plan&&dialog.open&&preferClean)refreshPreview();});
 const exceptionPromise=fetch('data/housing/room-source-exceptions.json').then(r=>{if(!r.ok)throw new Error('Source notes unavailable');return r.json();}).then(data=>{sourceExceptions=data.records;}).catch(()=>{});
 const layoutPromise=fetch('data/housing/room-layouts.json').then(r=>r.ok?r.json():null).then(data=>{roomLayouts=data;renderMarkers();renderRooms();}).catch(()=>{});
 const labelPromise=fetch('data/housing/room-labels.json').then(r=>r.ok?r.json():null).then(data=>{labelMap=data;renderMarkers();renderRooms();}).catch(()=>{});
 function setRoute(){if(!entry)return;const params=new URLSearchParams({place:currentPlace.id,plan:plan.id});if(selectedRoomId)params.set('room',selectedRoomId);if(selectedBlock)params.set('block',selectedBlock);if(selectedUnit)params.set('unit',selectedUnit);history.replaceState(null,'','#'+params);}
 function close(){pendingOrigin=null;showToken++;dialog.close();const params=new URLSearchParams({place:currentPlace.id});history.replaceState(null,'','#'+params);}
 $('.back-campus').onclick=close;$('.plan-close').onclick=close;
 function show(id,route={}){const navigation=++showToken;currentPlace=places.find(p=>p.id===id);entry=index.places[id];if(!entry)return;options.onPlace?.(id);selectedBlock=route.block||null;selectedUnit=route.unit||null;if(selectedBlock&&id==='572073'){const subset=entry.plans.filter(p=>p.buildingId==='gateway-'+selectedBlock);if(subset.length)entry={...entry,plans:subset,buildingIds:['gateway-'+selectedBlock]};else selectedBlock=null;}dialog.classList.remove('rooms-open','has-selection');$('#toggle-rooms').setAttribute('aria-expanded','false');$('#back-building').hidden=!selectedBlock&&!options.onHall;$('#back-building').textContent=selectedBlock?'← Building':'← Floors';
  $('#plan-title').textContent=selectedBlock?`${id==='572073'?'Gateway':'UFA'} ${selectedUnit||selectedBlock}`:currentPlace.name;$('#dorm-select').value=id;
  $('#floor-select').innerHTML=entry.plans.map((p,i)=>`<option value="${i}">${esc(selectedBlock?p.label.replace(/^Building \d+ \(\d+\) /,''):p.label)}</option>`).join('');
  $('#room-search').value='';$('#room-scope').value='floor';
  $('#plan-issues').innerHTML=`<p>Collected ${esc(index.collectedDate)} from the university’s public housing pages. Originals are preserved unchanged. These are published plans, not a guarantee of current assignments or complete building coverage.</p>${entry.issues.length?'<ul>'+entry.issues.map(i=>`<li>${esc(i.detail)}</li>`).join('')+'</ul>':'<p>No building-specific source issue was flagged in the collection.</p>'}`;
  $('.plan-source-notes').open=false;Promise.all([layoutPromise,exceptionPromise,cleanPromise]).then(()=>{if(navigation!==showToken)return;const count=Object.values(roomLayouts?.rooms||{}).filter(l=>entry.plans.some(p=>p.id===l.planId)).length;const p=document.createElement('p');const cleanPages=entry.plans.flatMap(plan=>plan.pages.map(page=>cleanPlanAssets.pages[`${plan.id}:${page.page}`])).filter(Boolean).length;const cleanRooms=Object.values(cleanPlanAssets.rooms).filter(asset=>entry.plans.some(plan=>plan.sha256===asset.sourceSha256)).length;p.textContent=`${cleanPages} clean floor drawings · ${cleanRooms} clean room views. ${count} reviewed room views across ${entry.plans.reduce((n,p)=>n+p.pages.length,0)} published drawing pages. Room ranges retain their original descriptions; individually confirmed labels are listed separately.`;$('#plan-issues').prepend(p);});
  choosePlan(Math.max(0,entry.plans.findIndex(p=>p.id===route.plan)));
  if(!dialog.open)dialog.showModal();sizeImage();
  if(!roomPromise)roomPromise=Promise.all(['room-descriptions.json','source-room-records.json'].map(file=>fetch('data/housing/'+file).then(r=>{if(!r.ok)throw new Error('Room data unavailable');return r.json();}))).then(data=>{rooms=data.flat();renderRooms();renderMarkers();}).catch(()=>{$('#room-records').innerHTML='<p class="empty">Room descriptions could not load. The original plan and university links remain available.</p>';roomPromise=null;});
  if(route.room)Promise.all([roomPromise,layoutPromise,labelPromise,exceptionPromise,cleanPromise]).then(()=>{if(navigation!==showToken||!dialog.open)return;const record=rooms?.find(r=>r.record_id===route.room&&entry.buildingIds.includes(r.building_id));if(record)openRecord(record);});
 }
 function choosePlan(i){plan=entry.plans[i];$('#floor-select').value=String(i);page=0;zoom=1;$('#page-select').innerHTML=plan.pages.map((p,i)=>`<option value="${i}">${p.page} of ${plan.pages.length}</option>`).join('');$('#page-label').hidden=plan.pages.length===1;
  $('#plan-original').href=plan.originalUrl;$('#plan-source').href=plan.sourceUrl;
  let notice='';
  if(plan.legacy)notice=plan.buildingId==='mitchell-freeman-hall'?'Legacy fragment: retained for reference. Use the other second-floor plan as the preferred current source.':'Archived university drawing. This is the supplied second-floor source; its current status is not confirmed.';
  if(plan.buildingId==='university-forest-apartments')notice=plan.sourceUrl.endsWith('ren2.pdf')?'This is bathroom detail only—not a complete second-floor bedroom plan.':plan.sourceUrl.endsWith('ren1.pdf')?'Existing/proposed renovation drawing; not confirmed as-built.':'Generic apartment layout, not a survey of every UFA building.';
  if(plan.buildingId==='lora-robins'&&plan.floorLabel==='Second Floor')notice='The university notes a C221 → C211 numbering correction. The supplied drawing and original file are preserved unchanged.';
  if(selectedUnit)notice=`${selectedUnit} · Shared UFA layout; unit position within the building is not mapped. `+notice;planNotice=notice;$('#plan-provenance').textContent=notice;$('#plan-notice').textContent='';$('#plan-notice').hidden=true;
  loadPage();renderRooms();
 }
 function loadPage(){pendingOrigin=null;dialog.classList.remove('has-selection');$('#plan-provenance').textContent=planNotice;$('#plan-notice').textContent='';$('#plan-notice').hidden=true;activeLayout=null;$('#return-floor').hidden=true;selectedRoomId=null;$('#selected-room').hidden=true;$('#room-hotspots').replaceChildren();const preview=plan.pages[page];const token=++previewToken;const img=$('#plan-image');zoom=1;img.alt=`${currentPlace.name} — ${plan.label}, page ${page+1}`;img.style.transition='none';img.style.visibility='hidden';
  img.onload=()=>{if(token!==previewToken)return;img.style.visibility='visible';sizeImage();animatePreview(img);renderMarkers();};img.onerror=()=>{if(token!==previewToken)return;if(displayAsset()&&img.getAttribute('src')!==preview.url){preferClean=false;updateStyleControl();img.src=preview.url;return;}$('#plan-notice').hidden=false;$('#plan-notice').textContent='The preview could not load. Use Open original to view the source document.';};img.src=displayAsset()?.url||preview.url;updateStyleControl();
  $('#plan-caption').textContent=`${plan.format.toUpperCase()} · Page ${page+1} of ${plan.pages.length} · Collected ${index.collectedDate}${plan.revisions.length?' · '+plan.revisions.join(' / '):''}`;
  updateCaption();$('.plan-canvas').scrollTo(0,0);renderRooms();setRoute();
 }
 function cleanAsset(){const asset=activeLayout?cleanPlanAssets.rooms[selectedRoomId]:cleanPlanAssets.pages[`${plan?.id}:${page+1}`];return asset?.sourceSha256===plan?.sha256?asset:null;}
 function coarseTrace(asset){return asset?.renderKind==='raster-trace'&&Math.min(asset.width,asset.height)<300;}
 function displayAsset(){const asset=cleanAsset();return preferClean&&(!coarseTrace(asset)||rasterOptIns.has(asset.url))?asset:null;}
 function updateStyleControl(){const clean=cleanAsset();$('#toggle-plan-style').hidden=!clean;$('#toggle-plan-style').textContent=displayAsset()?'Original drawing':coarseTrace(clean)?'Traced drawing':'Clean drawing';$('#toggle-plan-style').setAttribute('aria-pressed',String(Boolean(displayAsset())));dialog.classList.toggle('clean-plan',Boolean(displayAsset()));updateCaption();}
 function cleanCaption(){if(displayAsset()?.renderKind==='reviewed-scan-overview')return 'Simplified scan drawing';return displayAsset()?.renderKind==='reviewed-source-vectors'?'Simplified source drawing':displayAsset()?.renderKind==='source-vectors'?'Restyled source drawing':displayAsset()?.renderKind==='raster-trace'?'Traced source drawing':'Redrawn from original plan';}
 function updateCaption(){if(!plan)return;$('#plan-caption').textContent=activeLayout?`Room ${activeLayout.roomId} · ${activeLayout.includes.join(' · ')} · ${displayAsset()?(cleanCaption()):'Original plan crop'}`:displayAsset()?`${displayAsset().label} · ${cleanCaption()}`:`${plan.format.toUpperCase()} · Page ${page+1} of ${plan.pages.length} · Collected ${index.collectedDate}${plan.revisions.length?' · '+plan.revisions.join(' / '):''}`;}
 function refreshPreview(){
  if(!plan)return;const img=$('#plan-image'),token=++previewToken;img.style.transition='none';
  img.onload=()=>{if(token!==previewToken)return;img.style.visibility='visible';sizeImage();animatePreview(img);renderMarkers();};
  img.onerror=()=>{if(token!==previewToken)return;const source=(activeLayout||plan.pages[page]).url;if(img.getAttribute('src')!==source){preferClean=false;updateStyleControl();img.src=source;}else{$('#plan-notice').hidden=false;$('#plan-notice').textContent='This preview could not load. The source drawing is available above.';}};
  img.src=displayAsset()?.url||(activeLayout||plan.pages[page]).url;updateStyleControl();sizeImage();
 }
 $('#toggle-plan-style').onclick=()=>{const asset=cleanAsset(),show=!displayAsset();preferClean=show;if(show&&coarseTrace(asset))rasterOptIns.add(asset.url);pendingOrigin=null;refreshPreview();};
 function animatePreview(img){
  const origin=pendingOrigin;pendingOrigin=null;
  if(dialog.classList.contains('spatial-transition-active')||matchMedia('(prefers-reduced-motion: reduce)').matches){img.style.transition='';return;}
  img.getAnimations().forEach(a=>a.cancel());
  const target=img.getBoundingClientRect();
  const turned=origin?.rotation%180;
  const from=origin&&target.width&&target.height?`translate(${origin.x-target.x+(origin.width-target.width)/2}px,${origin.y-target.y+(origin.height-target.height)/2}px) rotate(${origin.rotation}deg) scale(${Math.max(.001,(turned?origin.height:origin.width)/target.width)},${Math.max(.001,(turned?origin.width:origin.height)/target.height)})`:activeLayout?'scale(.88)':'scale(.96)';
  const animation=img.animate([{opacity:origin?.45:0,transform:from},{opacity:1,transform:'translate(0,0) rotate(0deg) scale(1)'}],{duration:origin?600:420,easing:'cubic-bezier(.16,1,.3,1)'});
  animation.finished.then(()=>{img.style.transition='';}).catch(()=>{});
 }
 function roomOrigin(layout){
  if(activeLayout||!layout||matchMedia('(prefers-reduced-motion: reduce)').matches)return null;
  const rect=$('#plan-image').getBoundingClientRect(),[x0,y0,x1,y1]=layout.bounds;
  return {x:rect.x+x0*rect.width,y:rect.y+y0*rect.height,width:(x1-x0)*rect.width,height:(y1-y0)*rect.height,rotation:layout.displayRotation||0};
 }

 function sizeImage(){
  if(!plan)return;
  const box=$('.plan-canvas'),asset=displayAsset(),preview=asset||activeLayout||plan.pages[page];
  const bounds=asset?.contentBounds;
  const [x0,y0,x1,y1]=bounds||[0,0,1,1];
  const fit=Math.min(Math.max(1,box.clientWidth-36)/(preview.width*(x1-x0)),Math.max(1,box.clientHeight-36)/(preview.height*(y1-y0)));
  const width=Math.max(1,preview.width*fit*zoom),height=width*preview.height/preview.width;
  const img=$('#plan-image'),stage=$('.plan-stage'),hotspots=$('#room-hotspots');
  img.style.width=width+'px';img.style.height='auto';
  stage.style.width=bounds?width*(x1-x0)+'px':'';stage.style.height=bounds?height*(y1-y0)+'px':'';stage.style.overflow=bounds?'hidden':'';
  img.style.position=bounds?'absolute':'';img.style.left=bounds?-x0*width+'px':'';img.style.top=bounds?-y0*height+'px':'';
  hotspots.style.inset=bounds?'auto':'';hotspots.style.left=bounds?-x0*width+'px':'';hotspots.style.top=bounds?-y0*height+'px':'';hotspots.style.width=bounds?width+'px':'';hotspots.style.height=bounds?height+'px':'';
  $('#plan-fit').textContent=zoom===1?'Fit':`${Math.round(zoom*100)}%`;$('#plan-minus').disabled=zoom<=1;$('#plan-plus').disabled=zoom>=5;
 }


 function validLayout(recordId, targetPlan=plan, targetPage=page+1){
  const layout=roomLayouts?.rooms[recordId];
  return layout&&layout.status==='reviewed'&&layout.planId===targetPlan?.id&&layout.page===targetPage&&layout.sourceSha256===targetPlan.sha256?layout:null;
 }
 function pageMarkers(){
  if(!plan)return [];
  const mapping=labelMap?.pages[`${plan.id}:${page+1}`];
  const markers=mapping?.sourceSha256===plan.sha256?[...mapping.markers]:[];
  for(const [recordId,layout] of Object.entries(roomLayouts?.rooms||{})){
   if(!validLayout(recordId)||markers.some(m=>m.recordId===recordId))continue;
   const [x0,y0,x1,y1]=layout.bounds;
   markers.push({recordId,roomId:layout.roomId,label:layout.roomId,x:layout.labelPosition?.[0]??(x0+x1)/2,y:layout.labelPosition?.[1]??(y0+y1)/2});
  }
  return markers;
 }
 function renderMarkers(){if(!plan)return;const box=$('#room-hotspots');box.replaceChildren();const markers=activeLayout?[]:pageMarkers();
  const reviewed=markers.filter(m=>validLayout(m.recordId)).length;
  $('#room-instructions').textContent=activeLayout?`${activeLayout.includes.join(' · ')}. ${activeLayout.note||''} Use Whole floor to return.`:markers.length?`${reviewed} reviewed room views on this drawing. Click a room label to open its original layout.`:'Explore this source drawing with zoom, or choose a room from the list.';
  if(!rooms)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1000 1000');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('room-selection-areas');svg.setAttribute('aria-hidden','true');box.append(svg);
  for(const marker of markers){const record=rooms.find(r=>r.record_id===marker.recordId);if(!record)continue;
   const layout=validLayout(marker.recordId);
   if(layout?.hitRegion){const region=document.createElementNS(svg.namespaceURI,'polygon');region.setAttribute('points',layout.hitRegion.map(([x,y])=>`${x*1000},${y*1000}`).join(' '));region.dataset.recordId=marker.recordId;region.onclick=()=>selectRoom(record,marker);svg.append(region);}
   const button=document.createElement('button');button.className='room-hotspot';button.classList.toggle('has-layout',Boolean(layout));button.dataset.recordId=marker.recordId;button.style.left=`${marker.x*100}%`;button.style.top=`${marker.y*100}%`;button.textContent=marker.label;button.title=`Room ${marker.roomId}${layout?' · Layout ready':''}`;button.setAttribute('aria-label',`View room ${marker.roomId}${layout?' layout':''}`);button.setAttribute('aria-pressed',String(selectedRoomId===marker.recordId));button.onclick=()=>selectRoom(record,marker);box.append(button);
  }
 }
 function roomTarget(recordId){
  let fallback=null;
  for(let i=0;i<entry.plans.length;i++){const targetPlan=entry.plans[i];
   for(const targetPage of targetPlan.pages){
    const layout=validLayout(recordId,targetPlan,targetPage.page);
    const mapping=labelMap?.pages[`${targetPlan.id}:${targetPage.page}`];
    const marker=mapping?.sourceSha256===targetPlan.sha256?mapping.markers.find(m=>m.recordId===recordId):null;
    const target={planIndex:i,pageIndex:targetPage.page-1,marker,hasLayout:Boolean(layout)};
    if(layout)return target;
    if(marker&&!fallback)fallback=target;
   }
  }
  return fallback;
 }
 function openRecord(record){const target=roomTarget(record.record_id);if(!target){const i=entry.plans.findIndex(p=>p.buildingId===record.building_id&&p.floorLabel===record.floor_label);if(i>=0&&entry.plans[i]!==plan)choosePlan(i);selectRoom(record,null);return;}
  if(entry.plans[target.planIndex]!==plan)choosePlan(target.planIndex);
  if(page!==target.pageIndex){page=target.pageIndex;$('#page-select').value=String(page);loadPage();}
  selectRoom(record,target.marker||pageMarkers().find(m=>m.recordId===record.record_id));
 }
 function selectRoom(record,marker){const origin=roomOrigin(validLayout(record.record_id));if(activeLayout)loadPage();selectedRoomId=record.record_id;dialog.classList.add('has-selection');dialog.classList.remove('rooms-open');$('#toggle-rooms').setAttribute('aria-expanded','false');setRoute();const card=$('#selected-room');card.hidden=false;
  card.innerHTML=`<button class="close-room" aria-label="Close room details">×</button><span class="eyebrow">SELECTED ROOM</span><h3 tabindex="-1">${record.room_id?'Room ':''}${esc(record.room_id||record.room_label)}</h3><p class="room-context">${esc(record.floor_label)}</p><div class="room-facts"><span>${esc(record.classification||record.room_type||'Type not stated')}</span>${record.occupancy?`<span>${record.occupancy} occupant${record.occupancy===1?'':'s'}</span>`:''}</div><details class="room-extra"><summary>Room details & source</summary><p>${esc(record.source_text)}</p>${record.parent_group_text?.length?`<p class="room-context">${record.parent_group_text.map(esc).join('<br>')}</p>`:''}<a href="${esc(record.source_page)}" target="_blank" rel="noopener">Official room description ↗</a></details>`;
  const neighbors=pageMarkers().map(m=>rooms.find(r=>r.record_id===m.recordId)).filter(Boolean).sort((a,b)=>String(a.room_id).localeCompare(String(b.room_id),undefined,{numeric:true}));
  const neighborIndex=neighbors.findIndex(r=>r.record_id===record.record_id);
  if(neighborIndex>=0&&neighbors.length>1){const nav=document.createElement('nav');nav.className='room-neighbors';nav.setAttribute('aria-label','Other rooms on this drawing');for(const [offset,label] of [[-1,'← Previous'],[1,'Next →']]){const button=document.createElement('button');button.textContent=label;button.disabled=!neighbors[neighborIndex+offset];button.setAttribute('aria-label',offset<0?'Previous room on this drawing':'Next room on this drawing');button.onclick=()=>openRecord(neighbors[neighborIndex+offset]);nav.append(button);}card.append(nav);}
  card.querySelector('.close-room').onclick=()=>{if(activeLayout){loadPage();return;}selectedRoomId=null;dialog.classList.remove('has-selection');card.hidden=true;renderMarkers();setRoute();};
  const layout=validLayout(record.record_id);
  if(layout&&layout.planId===plan.id&&layout.page===page+1&&layout.sourceSha256===plan.sha256){
   activeLayout=layout;pendingOrigin=origin;zoom=1;$('#return-floor').hidden=false;
   const img=$('#plan-image'),token=++previewToken;img.style.transition='none';img.style.visibility='hidden';img.alt=`${currentPlace.name} room ${record.room_id}: ${layout.includes.join(', ')} from the original plan`;img.onload=()=>{if(token!==previewToken)return;img.style.visibility='visible';sizeImage();animatePreview(img);};img.onerror=()=>{if(token!==previewToken)return;if(displayAsset()&&img.getAttribute('src')!==layout.url){preferClean=false;updateStyleControl();img.src=layout.url;return;}$('#plan-notice').hidden=false;$('#plan-notice').textContent='This room preview could not load. Choose Whole floor or Open original to see the source.';};img.src=displayAsset()?.url||layout.url;updateStyleControl();
   $('#plan-caption').textContent=`Room ${record.room_id} · ${layout.includes.join(" · ")} · ${displayAsset()?(cleanCaption()):'Original plan crop'}`;
   renderMarkers();sizeImage();$('.plan-canvas').scrollTo(0,0);card.querySelector('h3').focus({preventScroll:true});if(innerWidth<=600)$('.plan-body').scrollTo({top:0,behavior:'instant'});return;
  }
  activeLayout=null;renderMarkers();
  // Zoom the actual source image around its matched text position, without inventing a room outline.
  if(!marker){const note=document.createElement('p');note.className='room-caveat';note.textContent=sourceExceptions[record.record_id]?.detail||'A separate room crop is not available for this record. The supplied floor drawing and official description are shown together.';card.append(note);const children=rooms.filter(r=>r.parent_record_id===record.record_id);if(children.length){const links=document.createElement('div');links.className='range-rooms';for(const child of children){const button=document.createElement('button');button.textContent=child.room_id;button.onclick=()=>openRecord(child);links.append(button);}card.append(links);}card.querySelector('h3').focus({preventScroll:true});return;}zoom=Math.max(zoom,2.5);sizeImage();requestAnimationFrame(()=>{const canvas=$('.plan-canvas'),stage=$('.plan-stage');canvas.scrollTo({left:stage.offsetLeft+marker.x*stage.clientWidth-canvas.clientWidth/2,top:stage.offsetTop+marker.y*stage.clientHeight-canvas.clientHeight/2,behavior:'instant'});});
  card.querySelector('h3').focus({preventScroll:true});if(innerWidth<=600)card.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function renderRooms(){if(!entry||!plan)return;const container=$('#room-records');if(!rooms){container.innerHTML='<p class="empty">Loading source descriptions…</p>';return;}
  const query=$('#room-search').value.trim().toLowerCase();
  const allFloors=Boolean(query)||$('#room-scope').value==='hall';
  const sectionRooms=rooms.filter(r=>allFloors?entry.buildingIds.includes(r.building_id):r.building_id===plan.buildingId&&r.floor_label===plan.floorLabel);
  const normalizeRoom=value=>String(value||'').toLowerCase().replace(/^([a-z]*)0+(?=\d)/,'$1');
  const exact=query?sectionRooms.filter(r=>r.room_id&&normalizeRoom(r.room_id)===normalizeRoom(query)):[];
  const filtered=exact.length?exact:sectionRooms.filter(r=>`${r.room_id||r.room_label} ${r.source_text} ${(r.parent_group_text||[]).join(' ')}`.toLowerCase().includes(query));
  $('#room-count').textContent=`${filtered.length} record${filtered.length===1?'':'s'}${allFloors?' across all floors':''} · ${filtered.filter(r=>roomTarget(r.record_id)?.hasLayout).length} room view${filtered.filter(r=>roomTarget(r.record_id)?.hasLayout).length===1?'':'s'}`;
  container.innerHTML=filtered.length?filtered.map(r=>`<details class="room-record"><summary><strong>${esc(r.room_id||r.room_label||'Room range')}</strong><span>${esc(r.classification||r.room_type||'Type unstated')}</span></summary><div><p class="room-context">${esc(r.floor_label)}</p><button class="open-room-layout" data-room-id="${esc(r.record_id)}">${roomTarget(r.record_id)?.hasLayout?'View room layout':roomTarget(r.record_id)?'Locate on floor plan':'View details & floor plan'} →</button><p>${esc(r.source_text)}</p>${r.parent_group_text?.length?`<p class="room-context">${r.parent_group_text.map(esc).join('<br>')}</p>`:''}${r.review_flags?.length?`<p class="room-caveat">${r.review_flags.map(esc).join(' ')}</p>`:''}<a href="${esc(r.source_page)}" target="_blank" rel="noopener">Description source ↗</a></div></details>`).join(''):`<p class="empty">${query?'No descriptions match this search.':'No room-level descriptions are available for this floor/layout section. Consult the original plan and housing page.'}</p>`;
 }
 $('#room-records').onclick=event=>{const button=event.target.closest('[data-room-id]');if(button){const record=rooms.find(r=>r.record_id===button.dataset.roomId);if(record)openRecord(record);}};
 $('#toggle-rooms').onclick=()=>{const open=dialog.classList.toggle('rooms-open');$('#toggle-rooms').setAttribute('aria-expanded',String(open));if(open)$('#room-search').focus();};
 $('#toggle-room-labels').onclick=()=>{const open=dialog.classList.toggle('show-room-labels');$('#toggle-room-labels').setAttribute('aria-pressed',String(open));};
 $('#back-building').onclick=()=>{showToken++;returnSpatialBuilding(dialog,()=>{if(selectedBlock)options.onBuilding?.(currentPlace.id,selectedBlock);else options.onHall?.(currentPlace.id,plan.id);});};
 $('#return-floor').onclick=()=>{loadPage();renderRooms();};
 $('#dorm-select').onchange=e=>show(e.target.value);$('#floor-select').onchange=e=>choosePlan(Number(e.target.value));$('#page-select').onchange=e=>{page=Number(e.target.value);loadPage();};
 $('#room-search').oninput=renderRooms;$('#room-scope').onchange=renderRooms;$('#plan-plus').onclick=()=>{zoom=Math.min(5,zoom+.5);sizeImage();};$('#plan-minus').onclick=()=>{zoom=Math.max(1,zoom-.5);sizeImage();};$('#plan-fit').onclick=()=>{zoom=1;sizeImage();$('.plan-canvas').scrollTo(0,0);};
 connectPlanGestures($('.plan-canvas'),$('.plan-stage'),()=>zoom,value=>{zoom=value;sizeImage();});
 new ResizeObserver(()=>{sizeImage();const marker=pageMarkers().find(m=>m.recordId===selectedRoomId);if(marker&&!activeLayout)requestAnimationFrame(()=>{const canvas=$('.plan-canvas'),stage=$('.plan-stage');canvas.scrollTo({left:stage.offsetLeft+marker.x*stage.clientWidth-canvas.clientWidth/2,top:stage.offsetTop+marker.y*stage.clientHeight-canvas.clientHeight/2});});}).observe($('.plan-canvas'));
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 return {open:show};
}
