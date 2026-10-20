import { installSmoothMapZoom } from './smooth-map-zoom.js';
import { createPlanViewer } from './plans.js';
import { createBuildingExplorer, createHallExplorer } from './building-explorer.js';
const $ = s => document.querySelector(s);
const house = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8"/></svg>';
const building = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 21V4h14v17M2 21h20M9 8h2m2 0h2m-6 4h2m2 0h2m-6 4h2m2 0h2"/></svg>';
const bookmark = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved = new Set();
try { const parsed = JSON.parse(localStorage.getItem('res-hall-saved') || '[]'); if(Array.isArray(parsed)) saved = new Set(parsed.filter(x=>typeof x==='string')); } catch {}
let filter='residential', query='', selected=null, labels=false;
const markers = new Map(), footprintLayers = [];
let residenceStats={},residenceFacts={}, places, map, manifest, housing, planViewer, buildingExplorer, hallExplorer, blocks=[], blockLayer, selectionEpoch=0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function toggleSave(id) {
  saved.has(id)?saved.delete(id):saved.add(id);
  try { localStorage.setItem('res-hall-saved',JSON.stringify([...saved])); } catch {}
  renderList(); if(selected) renderDetail(selected);
}
function results() {
 return places.filter(p=>{
  const allowed=filter==='all'||(filter==='residential'&&p.residential)||(filter==='saved'&&saved.has(p.id));
  const text=`${p.name} ${p.aliases.join(' ')} ${p.kind}`.toLowerCase().includes(query);
  const numbered=/^\d+[a-z]?$/.test(query)&&blocks.some(b=>b.placeId===p.id&&b.number===query.replace(/[a-z]$/,''));
  return allowed&&(text||numbered);
 });
}
function renderList() {
 const list=results(); $('#result-count').textContent=`${list.length} places`; $('#saved-count').textContent=saved.size;
 $('#list-title').textContent=query?'Search results':({residential:'Explore residences',all:'Around campus',saved:'Your saved places'}[filter]);
 $('#place-list').replaceChildren();
 if(!list.length) {
  $('#place-list').innerHTML=`<p class="empty"><strong>${filter==='saved'&&!saved.size?'A little shortlist for later.':'No places found.'}</strong>${filter==='saved'&&!saved.size?'Save a residence or campus place using the bookmark beside its name.':query&&filter!=='all'?'Try a different search, or switch to All campus.':'Try a shorter name or clear your search.'}</p>`;
 }
 for(const p of list) {
  const row=document.createElement('div');row.className=`place-row ${p.residential?'residential':''} ${selected?.id===p.id?'selected':''}`;
  row.innerHTML=`<button class="place-open" aria-label="Explore ${escape(p.name)}" ${selected?.id===p.id?'aria-current="true"':''}><span class="place-symbol">${p.residential?house:building}</span><span><strong>${escape(p.name)}</strong><small>${escape(p.kind)}${p.locations.length>1?` · ${p.locations.length} mapped locations`:''}</small></span></button><button class="save-button" aria-label="${saved.has(p.id)?'Unsave':'Save'} ${escape(p.name)}" aria-pressed="${saved.has(p.id)}">${bookmark}</button>`;
  row.querySelector('.place-open').onclick=()=>selectPlace(p);
  row.querySelector('.save-button').onclick=()=>toggleSave(p.id);
  $('#place-list').append(row);
 }
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 const ids=new Set(list.map(p=>p.id));
 for(const p of places) {
  const marker=markers.get(p.id);if(!marker)continue;
  const visible=query||filter==='saved'?ids.has(p.id):true;
  if(visible&&!map.hasLayer(marker))marker.addTo(map);
  if(!visible&&map.hasLayer(marker))map.removeLayer(marker);
 }
 updateLabels();
}
function icon(p) {
 return L.divIcon({className:`house-pin ${p.residential?'':'campus-pin'} ${selected?.id===p.id?'is-selected':''}`,html:`<span>${p.residential?house:''}</span>`,iconSize:p.residential?[29,29]:[10,10],iconAnchor:p.residential?[14.5,14.5]:[5,5]});
}
let labelVisibilityState;
function updateLabels() {
 if(!map)return;
 map.getContainer().classList.toggle('map-overview',map.getZoom()<15.5);
 const showResidenceLabels=labels&&map.getZoom()>=17;
 // Fractional wheel zoom emits zoomend repeatedly; tooltip bindings only
 // depend on the label toggle and threshold, not every fractional zoom.
 if(labelVisibilityState===showResidenceLabels)return;
 labelVisibilityState=showResidenceLabels;
 for(const p of places) {
  const m=markers.get(p.id);if(!m)continue;
  const permanent=showResidenceLabels&&p.residential;
  if(m.getTooltip()?.options.permanent!==permanent) {
   m.unbindTooltip();m.bindTooltip(escape(p.name),{permanent,direction:'right',offset:[p.residential?17:7,0],className:'place-label',opacity:1});
  }
 }
}
function renderDetail(p) {
 $('#detail').hidden=false;
 const fact=residenceFacts[p.id];
 $('#detail').innerHTML=`<div class="detail-top"><button class="close" aria-label="Close place details">×</button><h2 tabindex="-1">${escape(p.name)}</h2></div><div class="detail-body">${fact?`<p class="residence-fact">${escape(fact.text)}</p>`:''}${p.residential&&housing?.places[p.id]?`<button class="explore-plans">${blocks.some(b=>b.placeId===p.id)?'Choose a building':'Explore floors'} <span aria-hidden="true">→</span></button>`:''}<div class="summary-actions"><button class="detail-save" aria-pressed="${saved.has(p.id)}">${saved.has(p.id)?'✓ Saved':'Save residence'}</button><details class="residence-links"><summary>About & sources</summary>${p.housingUrl?`<a href="${escape(p.housingUrl)}" target="_blank" rel="noopener">University housing guide ↗</a>`:''}<a href="${escape(p.officialUrl)}" target="_blank" rel="noopener">Official campus map ↗</a>${fact?`<a href="${escape(fact.url)}" target="_blank" rel="noopener">${escape(fact.source)} · fact source ↗</a>`:''}<p>Locations: University of Richmond / Concept3D. Map geometry: OpenStreetMap. Pins are not verified entrances.</p></details></div></div>`;
 $('#detail .close').onclick=closeDetail;
 if($('#detail .explore-plans'))$('#detail .explore-plans').onclick=()=>{map.stop();blocks.some(b=>b.placeId===p.id)?showBlocks(p):approachHall(p);};
 $('#detail .detail-save').onclick=()=>toggleSave(p.id);
}
function mapOrigin(place){
 if(reducedMotion)return null;
 const point=map.latLngToContainerPoint([place.lat,place.lng]),rect=map.getContainer().getBoundingClientRect();
 return{x:Math.max(rect.left,Math.min(rect.right,rect.left+point.x)),y:Math.max(rect.top,Math.min(rect.bottom,rect.top+point.y))};
}
function approachHall(place){
 const origin=mapOrigin(place);
 map.flyTo([place.lat,place.lng],Math.max(map.getZoom(),19),{animate:!reducedMotion,duration:1});
 hallExplorer.open(place,{origin});
}
function selectPlace(p,{pan=true,focus=true}={}) {
 const epoch=++selectionEpoch;map.stop();if(blockLayer)blockLayer.clearLayers();
 selected=p;
 for(const place of places) markers.get(place.id).setIcon(icon(place));
 highlightFootprints(p);
 renderDetail(p);renderList();
 if(pan)map.flyTo([p.lat,p.lng],Math.max(map.getZoom(),17),{animate:!reducedMotion,duration:.7});
 history.replaceState(null,'',`#place=${encodeURIComponent(p.id)}`);
 if(housing?.places[p.id]){
  $('#detail').hidden=true;
  if(focus){map.stop();blocks.some(b=>b.placeId===p.id)?showBlocks(p):approachHall(p);}
 }else if(focus)$('#detail h2').focus({preventScroll:true});
}
function closeDetail(){selectionEpoch++;blockLayer?.clearLayers();selected=null;$('#detail').hidden=true;for(const p of places)markers.get(p.id).setIcon(icon(p));highlightFootprints(null);history.replaceState(null,'',location.pathname+location.search);renderList();$('#map').focus({preventScroll:true});}
function showBlocks(p){
 const items=blocks.filter(b=>b.placeId===p.id);blockLayer.clearLayers();map.stop();
 map.flyToBounds(items.map(b=>[b.lat,b.lng]),{paddingTopLeft:[35,35],paddingBottomRight:[35,55],maxZoom:19,duration:.85,animate:!reducedMotion});
 for(const b of items){const marker=L.marker([b.lat,b.lng],{icon:L.divIcon({className:'block-pin',html:`<span>${escape(b.number)}</span>`,iconSize:[48,32],iconAnchor:[24,16]}),title:`${b.kind==='gateway'?'Gateway':'UFA'} ${b.number}`,alt:`Explore building ${b.number}`,keyboard:true,zIndexOffset:800});marker.on('click',()=>openBlock(p,b));marker.addTo(blockLayer);}
 // Numbered map markers provide the building choices without covering the map.
 $('#detail').hidden=true;
 $('#detail').replaceChildren();
}
function openBlock(p,b,{animate=true}={}){
 const epoch=++selectionEpoch;map.stop();highlightFootprints({...p,locations:[b]});
 const origin=animate?mapOrigin(b):null;
 if(b.kind==='ufa'){map.flyTo([b.lat,b.lng],19.5,{animate:animate&&!reducedMotion,duration:1});history.replaceState(null,'',`#place=${p.id}&block=${b.number}`);buildingExplorer.open(p,b,{origin});return;}
 map.flyTo([b.lat,b.lng],19.5,{duration:.75,animate:animate&&!reducedMotion});history.replaceState(null,'',`#place=${p.id}&block=${b.number}`);
 buildingExplorer.open(p,b,{origin});
}
function pointInRing(point,ring) {
 let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
function contains(feature,p) {
 const polygons=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates];
 return polygons.some(rings=>pointInRing([p.lng,p.lat],rings[0])&&!rings.slice(1).some(r=>pointInRing([p.lng,p.lat],r)));
}
function highlightFootprints(p) {
 for(const {layer,feature,residential} of footprintLayers) {
  const active=p&&p.locations.some(loc=>contains(feature,loc));
  layer.setStyle({color:active?'#203b78':residential?'#354f88':'#b4b4c2',fillColor:active?'#294987':residential?'#4d69a1':'#dedee7',weight:active?3:1,fillOpacity:active?1:.88});
 }
}
async function start() {
 const data=await Promise.all(['places.json','campus.geojson','manifest.json','residence-facts.json'].map(async file=>{const r=await fetch(`data/${file}`);if(!r.ok)throw new Error(`Cannot load ${file}`);return r.json();}));
 [places,,manifest,residenceFacts]=data;const geo=data[1];
 residenceStats=await fetch('data/housing/residence-stats.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
 const housingResponse=await fetch('data/housing/index.json');
 if(housingResponse.ok){housing=await housingResponse.json();blocks=(await (await fetch('data/apartment-buildings.json')).json()).blocks;buildingExplorer=createBuildingExplorer(housing,(p,b,route)=>planViewer.open(p.id,{...route,block:b.number}));hallExplorer=createHallExplorer(housing,(p,route)=>planViewer.open(p.id,route),{facts:residenceFacts,stats:residenceStats});planViewer=createPlanViewer(housing,places,{onPlace:id=>{if(selected?.id!==id)selectPlace(places.find(p=>p.id===id),{focus:false});},onHall:(id,plan)=>{const p=places.find(p=>p.id===id);if(blocks.some(b=>b.placeId===id)){selectPlace(p,{focus:false});showBlocks(p);}else hallExplorer.open(p,{plan});},onBuilding:(id,number)=>{const b=blocks.find(b=>b.placeId===id&&b.number===number);if(b)buildingExplorer.open(places.find(p=>p.id===id),b);}});}
 saved=new Set([...saved].filter(id=>places.some(p=>p.id===id)));
 if(!window.L)throw new Error('The local map library did not load.');
 // 3,695 static vector layers otherwise rewrite individual SVG paths on every
 // wheel step. Canvas batches them by pane while DOM markers stay interactive.
 map=L.map('map',{preferCanvas:true,zoomControl:false,minZoom:13,maxZoom:20,zoomSnap:0,zoomDelta:.5,zoomAnimation:false,wheelDebounceTime:16,wheelPxPerZoomLevel:15,attributionControl:true,maxBounds:[[37.563,-77.557],[37.59,-77.523]],maxBoundsViscosity:.85});
 installSmoothMapZoom(map);
 L.control.zoom({position:'bottomright'}).addTo(map);blockLayer=L.layerGroup().addTo(map);
 map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('Locations: <a href="https://maps.richmond.edu/?id=1949" target="_blank" rel="noopener">University of Richmond</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>');
 const bounds=L.latLngBounds(places.flatMap(p=>p.locations.map(loc=>[loc.lat,loc.lng])));
 const fit=()=>{if(selected)closeDetail();map.fitBounds(bounds,{paddingTopLeft:[32,130],paddingBottomRight:[55,65],maxZoom:17,animate:!reducedMotion});};
 map.createPane('land');map.getPane('land').style.zIndex=210;
 map.createPane('roads');map.getPane('roads').style.zIndex=220;
 map.createPane('footprints');map.getPane('footprints').style.zIndex=230;
 const features=geo.features;
 L.geoJSON(features.filter(f=>!['building','highway'].includes(f.properties.kind)),{pane:'land',interactive:false,style:f=>{
  const p=f.properties,water=p.natural==='water'||p.waterway||p.water;
  const parking=p.amenity==='parking',wood=p.natural==='wood'||p.landuse==='forest',sport=['pitch','track','stadium','sports_centre'].includes(p.leisure);
  return {color:water?'#9daec9':parking?'#dedee7':sport?'#bdcbbd':'#cdd7ca',fillColor:water?'#c6d3e8':parking?'#eeeef6':wood?'#cbd8c9':sport?'#d5dfd1':'#e0e7da',fillOpacity:1,weight:water?1:0.7};
 }}).addTo(map);
 const roads=features.filter(f=>f.properties.kind==='highway');
 L.geoJSON(roads,{pane:'roads',interactive:false,style:f=>({color:'#dedee7',weight:['footway','path','steps'].includes(f.properties.highway)?3:8,opacity:1,fillColor:'#faf9f7',fillOpacity:1})}).addTo(map);
 L.geoJSON(roads,{pane:'roads',interactive:false,style:f=>({color:['footway','path','steps'].includes(f.properties.highway)?'#ffffff':'#faf9f7',weight:['footway','path','steps'].includes(f.properties.highway)?1.5:5,opacity:1,fillColor:'#faf9f7',fillOpacity:1,dashArray:f.properties.highway==='steps'?'1 2':null})}).addTo(map);
 L.geoJSON(features.filter(f=>f.properties.kind==='building'&&['Polygon','MultiPolygon'].includes(f.geometry.type)),{pane:'footprints',interactive:false,onEachFeature:(feature,layer)=>{
  const residential=places.some(p=>p.residential&&p.locations.some(loc=>contains(feature,loc)));
  footprintLayers.push({feature,layer,residential});
 }}).addTo(map);highlightFootprints(null);
 const lake=features.find(f=>f.properties.name==='Westhampton Lake');
 if(lake){const center=L.geoJSON(lake).getBounds().getCenter();L.tooltip({permanent:true,direction:'center',className:'land-label',opacity:1}).setLatLng(center).setContent('Westhampton Lake').addTo(map);}
 for(const p of places) {
  const marker=L.marker([p.lat,p.lng],{icon:icon(p),title:p.name,alt:p.name,keyboard:true,riseOnHover:true,zIndexOffset:p.residential?200:0});
  marker.on('click',()=>selectPlace(p));marker.addTo(map);markers.set(p.id,marker);
 }
 map.on('zoomend',updateLabels);fit();renderList();
 $('#fit-campus').onclick=fit;
 $('#toggle-labels').onclick=()=>{labels=!labels;$('#toggle-labels').setAttribute('aria-pressed',String(labels));updateLabels();};
 $('#search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderList();});
 $('#search').addEventListener('keydown',e=>{if(e.key==='Enter'&&results().length)selectPlace(results()[0]);});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderList();});
 $('#coverage').innerHTML=`<span><b>${manifest.uniquePlaces}</b>campus places</span><span><b>${manifest.residentialPlaces}</b>residential groups</span><span><b>${manifest.officialBuildingRecords}</b>official building records</span>`;
 function applyRoute(){const hash=new URLSearchParams(location.hash.slice(1));const initial=places.find(p=>p.id===hash.get('place'));if(initial){selectPlace(initial,{focus:false});if(hash.get('plan')||hash.get('room'))planViewer?.open(initial.id,{plan:hash.get('plan'),room:hash.get('room'),block:hash.get('block'),unit:hash.get('unit')});else if(hash.get('block')){showBlocks(initial);const b=blocks.find(b=>b.placeId===initial.id&&b.number===hash.get('block'));if(b)openBlock(initial,b,{animate:false});}}}
 applyRoute();window.addEventListener('hashchange',()=>{document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());applyRoute();});
 new ResizeObserver(()=>map.invalidateSize()).observe($('#map'));
}
const dialog=$('#sources-dialog');$('#sources-button').onclick=()=>dialog.showModal();$('#close-sources').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('#search').focus();}if(e.key==='Escape'&&selected&&!document.querySelector('dialog[open]'))closeDetail();});
start().catch(e=>{console.error(e);$('#error').hidden=false;$('#error').textContent='The campus data could not be loaded. Run this app using its local start command, then reload. The official map is available at maps.richmond.edu.';$('#place-list').innerHTML='<p class="empty">Campus data unavailable. Please reload after starting the local server.</p>';});
