import {hallGuideMarkup,connectHallGuide} from './hall-guide.js';
import { ufaRoofMarkup, ufaFacadeMarkup } from './apartment-architecture.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const ufaSingleLevelUnits = Object.freeze({'160':'160F','164':'164H','166':'166A','486':'486A'});

// Visible faces own their floor's hit area; keep the model stationary on hover.
export function openUfaImmersive(dialog, place, block, plans, transition = {}, options = {}) {
 const blockNumber = String(block.number);
 const numberMarkup = escapeHtml(blockNumber);
 const singleUnit = ufaSingleLevelUnits[blockNumber];
 const living = plans.find(p => p.sourceUrl.endsWith('ren1.pdf'));
 const bath = plans.find(p => p.sourceUrl.endsWith('ren2.pdf'));
 const single = plans.find(p => p.label === 'One-Level UFA Floor Plans');
 let active = null, expanded = false, zoom = 1, x = 0, y = 0;
 const pointers = new Map();
 let gesture = null;
 let arrivalAnimations=[];
 const finishArrival=()=>{arrivalAnimations.forEach(a=>a.cancel());arrivalAnimations=[];dialog.classList.add('ufa-arrival-finished');dialog.classList.remove('ufa-spatial-arrival');};
 const unitFacade = upper => ufaFacadeMarkup({upper}).replace('viewBox="0 0 640 100"','viewBox="0 0 160 100"');
 dialog.className = 'building-dialog ufa-immersive ufa-unit-focused has-hall-guide';
 dialog.innerHTML = `<header><button class="building-back">← Map</button><span>UNIVERSITY FOREST / ${numberMarkup}</span><button class="building-close" aria-label="Close building">×</button></header><div class="ufa-heading"><span class="eyebrow">EXPLORE THE SPACE</span><h2>UFA ${numberMarkup}</h2><p id="ufa-guidance">Hover a floor to highlight it. Click to unfold its layout.</p></div><div class="ufa-main"><div class="ufa-space"><div class="ufa-floor-callouts"><button data-level-pick="1">Second floor <span>Bedrooms</span></button><button data-level-pick="0">First floor <span>Living</span></button></div><div class="ufa-orbit">${[living,bath].map((p,i) => `<button class="ufa-surface" data-plan="${p.id}" style="--level:${i}" aria-expanded="false" aria-label="${i ? 'Explore upper-level layout' : 'Explore living-level layout'}"><span class="ufa-shell">${i ? `<span class="ufa-roof"><span class="ufa-roof-plane ufa-roof-back">${ufaRoofMarkup().replace('viewBox="0 0 640 300"','viewBox="0 0 160 300"')}</span><span class="ufa-roof-plane ufa-roof-front">${ufaRoofMarkup().replace('viewBox="0 0 640 300"','viewBox="0 0 160 300"')}</span></span>` : ''}<span class="ufa-face"><img draggable="false" src="./data/housing/clean-plans/ufa-focused/${i ? 'shared-upper' : p.id}.svg" alt="${i ? 'Two bedrooms, bathroom and stair landing' : 'Existing living-level layout'}"><span class="ufa-surface-label">${i ? 'Upper level · bedrooms' : 'Living level'} <b>↗</b></span></span><span class="ufa-edge">${unitFacade(Boolean(i))}<b>${i ? '02' : '01'}</b><span class="ufa-floor-name">${i?'Second floor':'First floor'}</span></span><span class="ufa-side"></span>${i?'':'<span class="ufa-porch"><span class="ufa-porch-top"></span><span class="ufa-porch-cheek ufa-porch-cheek-left"></span><span class="ufa-porch-cheek ufa-porch-cheek-right"></span><span class="ufa-porch-posts"></span></span>'}</span></button>`).join('')}</div></div>${hallGuideMarkup(place,options.stats?.[place.id],options.facts?.[place.id])}</div><div class="ufa-controls"><button class="ufa-fold" hidden>← Fold back into townhouse</button><div class="ufa-navigation" hidden><button class="ufa-zoom-out" aria-label="Zoom out">−</button><button class="ufa-fit">Fit</button><button class="ufa-zoom-in" aria-label="Zoom in">+</button></div><label class="ufa-unit-select"${singleUnit && single ? '' : ' hidden'}>Layout <select aria-label="UFA ${numberMarkup} layout"><option value="shared">Shared two-level template</option>${singleUnit && single ? `<option value="single">${singleUnit} · one-level exception</option>` : ''}</select></label><a class="ufa-original" target="_blank" rel="noopener" hidden>Original source ↗</a></div><details class="ufa-evidence data-disclosure"><summary>About this model</summary><p>Representative townhouse · apartment letter positions are not mapped. Upstairs reconstructed from tour images · approximate proportions.</p></details>`;
 connectHallGuide(dialog,place,options);
 const surfaces = [...dialog.querySelectorAll('.ufa-surface')];
 const callouts=[...dialog.querySelectorAll('[data-level-pick]')];
 const preview=level=>{surfaces.forEach((s,i)=>s.classList.toggle('floor-preview',i===level));callouts.forEach(b=>b.classList.toggle('floor-preview',Number(b.dataset.levelPick)===level));};
 callouts.forEach(b=>{b.onclick=()=>enter(surfaces[Number(b.dataset.levelPick)]);b.onpointerenter=b.onfocus=()=>preview(Number(b.dataset.levelPick));b.onpointerleave=b.onblur=()=>preview(-1);});
 surfaces.forEach((s,i)=>{s.onpointerenter=s.onfocus=()=>preview(i);s.onpointerleave=s.onblur=()=>preview(-1);});
 const guidance = dialog.querySelector('#ufa-guidance');
 const fold = dialog.querySelector('.ufa-fold'), original = dialog.querySelector('.ufa-original');
 const navigation = dialog.querySelector('.ufa-navigation');
 function paint() {
  if (!active) return;
  const r = active.getBoundingClientRect();
  // Pan only the overflow introduced by zoom. At Fit the complete drawing stays
  // centered instead of being draggable almost entirely out of its viewport.
  const limitX = r.width * (zoom - 1) / 2, limitY = r.height * (zoom - 1) / 2;
  x = Math.max(-limitX, Math.min(limitX, x));
  y = Math.max(-limitY, Math.min(limitY, y));
  active.querySelector('img').style.transform = `translate(${x}px,${y}px) scale(${zoom})`;
 }
 function fit() { zoom = 1; x = y = 0; paint(); }
 function zoomAt(factor, clientX, clientY) {
  if (!expanded) return;
  const r = active.getBoundingClientRect();
  const px = (clientX ?? r.left + r.width / 2) - r.left - r.width / 2;
  const py = (clientY ?? r.top + r.height / 2) - r.top - r.height / 2;
  const next = Math.max(1, Math.min(6, zoom * factor));
  x = px - (px - x) * next / zoom; y = py - (py - y) * next / zoom;
  zoom = next; paint();
 }
 function reset() {
  preview(-1);fit(); expanded = false; pointers.clear(); gesture = null;
  dialog.classList.remove('ufa-expanded', 'ufa-dragging');
  surfaces.forEach(s => { s.classList.remove('chosen'); s.disabled = false; s.setAttribute('aria-expanded', 'false'); });
  fold.hidden = original.hidden = navigation.hidden = true;
  guidance.textContent = 'Hover a floor to highlight it. Click to unfold its layout.';
 }
 function enter(surface) {
  if (expanded) return;
  finishArrival();active = surface; fit(); expanded = true;
  surfaces.forEach(s => { s.classList.toggle('chosen', s === surface); s.disabled = s !== surface; s.setAttribute('aria-expanded', String(s === surface)); });
  dialog.classList.add('ufa-expanded'); fold.hidden = navigation.hidden = false;
  const p = plans.find(p => p.id === surface.dataset.plan);
  original.href = p.originalUrl; original.hidden = p === bath;
  guidance.textContent = `${p === bath ? 'Two bedrooms · bathroom · landing. Approximate reconstruction.' : p === single ? `${singleUnit} · published one-level layout.` : 'Existing living-level layout.'} Drag to explore · pinch to zoom.`;
  fold.focus({ preventScroll:true });
 }
 function pointerState() {
  const pts = [...pointers.values()];
  const center = pts.reduce((a,p) => ({x:a.x+p.x/pts.length,y:a.y+p.y/pts.length}), {x:0,y:0});
  return {...center, distance: pts.length > 1 ? Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y) : 0};
 }
 surfaces.forEach(surface => {
  surface.onclick = () => enter(surface);
  surface.onpointerdown = e => {
   if (!expanded || surface !== active || e.button > 0) return;
   surface.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); gesture = pointerState();
   dialog.classList.add('ufa-dragging'); e.preventDefault();
  };
  surface.onpointermove = e => {
   if (!pointers.has(e.pointerId)) return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); const next = pointerState();
   x += next.x - gesture.x; y += next.y - gesture.y;
   if (gesture.distance && next.distance) zoomAt(next.distance / gesture.distance,next.x,next.y);
   else paint();
   gesture = next;
  };
  surface.onpointerup = surface.onpointercancel = surface.onlostpointercapture = e => {
   pointers.delete(e.pointerId); gesture = pointers.size ? pointerState() : null;
   if (!pointers.size) dialog.classList.remove('ufa-dragging');
  };
  surface.addEventListener('wheel', e => {
   if (!expanded || surface !== active) return;
   e.preventDefault();
   if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * .008),e.clientX,e.clientY);
   else { const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? surface.clientHeight : 1; x -= e.deltaX * unit; y -= e.deltaY * unit; paint(); }
  }, {passive:false});
  let gestureScale = 1;
  surface.addEventListener('gesturestart', e => { if (expanded) { e.preventDefault(); gestureScale = 1; } }, {passive:false});
  surface.addEventListener('gesturechange', e => { if (expanded) { e.preventDefault(); zoomAt(e.scale / gestureScale,e.clientX,e.clientY); gestureScale = e.scale; } }, {passive:false});
  surface.addEventListener('gestureend', e => { if (expanded) e.preventDefault(); }, {passive:false});
 });
 fold.onclick = () => { reset(); active?.focus({preventScroll:true}); };
 dialog.querySelector('.ufa-fit').onclick = fit;
 dialog.querySelector('.ufa-zoom-in').onclick = () => zoomAt(1.3);
 dialog.querySelector('.ufa-zoom-out').onclick = () => zoomAt(1/1.3);
 dialog.querySelector('select').onchange = e => {
  reset(); const one = e.target.value === 'single' && Boolean(singleUnit && single);
  dialog.querySelector('.ufa-heading h2').textContent=one?`UFA ${singleUnit} · one-level unit`:`UFA ${blockNumber}`; dialog.classList.toggle('ufa-single',one);
  const p = one ? single : living; surfaces[0].dataset.plan = p.id;
  surfaces[0].querySelector('img').src = `./data/housing/clean-plans/ufa-focused/${p.id}.svg`;
  surfaces[0].querySelector('img').alt = one ? `${singleUnit} one-level layout` : 'Existing living-level layout';
  surfaces[0].setAttribute('aria-label',one ? `Explore ${singleUnit} one-level layout` : 'Explore living-level layout');
  surfaces[0].querySelector('.ufa-surface-label').innerHTML = one ? `${singleUnit} · one level <b>↗</b>` : 'Living level <b>↗</b>';
  surfaces[1].hidden = one;callouts.find(b=>b.dataset.levelPick==='1').hidden=one;
 };
 function leave() { finishArrival();pointers.clear(); dialog.close(); history.replaceState(null,'',`#place=${place.id}`); }
 dialog.querySelector('.building-back').onclick = leave; dialog.querySelector('.building-close').onclick = leave;
 dialog.oncancel = e => { e.preventDefault(); if (expanded) { reset(); active?.focus({preventScroll:true}); } else leave(); };
 dialog.addEventListener('close',finishArrival,{once:true});
 dialog.showModal();
 if(transition.origin&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  dialog.classList.add('ufa-spatial-arrival');
  const orbit=dialog.querySelector('.ufa-orbit'),r=orbit.getBoundingClientRect();
  const dx=transition.origin.x-(r.left+r.width/2),dy=transition.origin.y-(r.top+r.height/2);
  const timing={duration:850,easing:'cubic-bezier(.22,1,.36,1)'};
  arrivalAnimations.push(orbit.animate([
   {translate:`${dx}px ${dy}px 0px`,scale:'.035 .035 .035'},
   {translate:'0px 0px 0px',scale:'1 1 1'}
  ],timing));
  // Animate independent translate/scale only. Interpolating mismatched transform
  // lists decomposes the 3D matrix and can skew/flip walls in WebKit.
  // Keep floor depth intact; opacity on this preserve-3d ancestor flattens walls.
  // Grow the complete model rather than unfolding overlapping roof-only planes.
  arrivalAnimations[0].finished.then(finishArrival).catch(()=>{});
 }

}
