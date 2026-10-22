import {waterLocations} from './water-locations.js';
import {printerLocations} from './printer-locations.js';
const icons={water:'<path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z"/>',printer:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z"/><path d="M17 11h.01"/>'};
const svg=type=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[type]}</svg>`;
export function filterAmenities(rows,enabled,query=''){
 const q=query.trim().toLowerCase();
 return rows.filter(row=>enabled.has(row.type)&&`${row.name} ${row.description||''}`.toLowerCase().includes(q));
}
export function mountMapAmenities(map,host){
 const rows=[...waterLocations.map(x=>({...x,type:'water'})),...printerLocations.map(x=>({...x,type:'printer'}))];
 const enabled=new Set(),markers=new Map();
 host.innerHTML=`<div class="amenity-toggles" role="group" aria-label="Map amenities"><button type="button" data-amenity="water" aria-pressed="false">${svg('water')}Water refill</button><button type="button" data-amenity="printer" aria-pressed="false">${svg('printer')}Printers</button></div><details class="amenity-search" hidden><summary>Find a location <span class="amenity-count"></span></summary><label>Search selected amenities<input type="search" placeholder="Building or location…" autocomplete="off"></label><div class="amenity-results"></div><p class="amenity-status" role="status"></p><details class="amenity-sources"><summary>Sources & pin accuracy</summary><p>Water pins come from the supplied refill-station map; filtration and opening hours are not verified. Printer pins marked building-level show the building, not the exact room. Check each pin for details.</p></details></details>`;
 L.DomEvent.disableClickPropagation(host);L.DomEvent.disableScrollPropagation(host);
 const search=host.querySelector('input'),details=host.querySelector('.amenity-search'),list=host.querySelector('.amenity-results');
 function popup(row){
  const box=document.createElement('div');box.className='amenity-popup';
  const title=document.createElement('h3');title.textContent=row.name;box.append(title);
  const kind=document.createElement('small');kind.textContent=row.type==='water'?'Water refill station':`${row.printerCount} listed printers`;box.append(kind);
  const description=document.createElement('p');description.textContent=row.description||'';box.append(description);
  const precision=document.createElement('p');precision.className='amenity-precision';precision.textContent=row.locationPrecision==='source-map-pin'?'Pin from the source map.':row.locationPrecision==='community'?'Community-level pin · see location details above.':'Building-level pin · see room details above.';box.append(precision);
  if(row.sourceUrl&&/^https:\/\//.test(row.sourceUrl)){const link=document.createElement('a');link.href=row.sourceUrl;link.target='_blank';link.rel='noopener';link.textContent='Source ↗';box.append(link);}
  return box;
 }
 for(const row of rows){
  if(!Number.isFinite(row.lat)||!Number.isFinite(row.lng))continue;
  const marker=L.marker([row.lat,row.lng],{icon:L.divIcon({className:`amenity-pin amenity-${row.type}`,html:svg(row.type),iconSize:[32,32],iconAnchor:[16,16]}),title:row.name,alt:row.name,keyboard:true,zIndexOffset:450});
  marker.bindPopup(popup(row),{maxWidth:280,className:'amenity-map-popup'});markers.set(row.id,marker);
 }
 function render(){
  const found=filterAmenities(rows,enabled,search.value);const visible=new Set(found.map(x=>x.id));
  for(const [id,marker] of markers){if(visible.has(id)){if(!map.hasLayer(marker))marker.addTo(map);}else if(map.hasLayer(marker))map.removeLayer(marker);}
  details.hidden=!enabled.size;
  host.querySelector('.amenity-count').textContent=`(${found.length})`;
  host.querySelector('.amenity-status').textContent=found.length?'':'No matching locations. Try another building name.';
  list.replaceChildren();
  for(const row of found){const button=document.createElement('button');button.type='button';button.textContent=row.name;button.onclick=()=>{const marker=markers.get(row.id);if(!marker)return;map.stop();map.setView([row.lat,row.lng],Math.max(map.getZoom(),18),{animate:false});marker.openPopup();details.open=false;};list.append(button);}
 }
 host.querySelectorAll('[data-amenity]').forEach(button=>button.onclick=()=>{const type=button.dataset.amenity;enabled.has(type)?enabled.delete(type):enabled.add(type);button.setAttribute('aria-pressed',String(enabled.has(type)));render();});
 search.addEventListener('input',render);render();
 return {rows,markers};
}
