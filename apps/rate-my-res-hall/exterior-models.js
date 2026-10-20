import {remainingHallMarkup} from './remaining-hall-architecture.js';
import {apartmentExteriorMarkup,gatewayExteriorMarkup} from './apartment-architecture.js';
import {enhancedHallMarkup} from './hall-architecture.js';
// Original illustrative geometry from EXTERIOR_MODEL_REFERENCE_PLAN.md.
// Proportions and façade rhythms are approximate, never surveyed elevations.
const profiles = [
 ['university forest|ufa','forest','medium',2], ['gateway','gateway','medium',4],
 ['north court','court','high',3], ['jeter|residence hall (?:no\\. )?1','tudor','high',3],
 ['thomas|residence hall (?:no\\. )?2','tudor','medium',3], ['wood','tudor','medium',3],
 ['robins hall','tudor','medium',3], ['moore','wings','medium',3],
 ['marsh','tudor','medium',3], ['gray','zigzag','medium',3],
 ['westhampton','gothic','medium',4], ['lakeview','wings','low',4],
 ['keller','gothic','medium',3], ['south court','wings','low',3],
 ['dennis','wings','low',3], ['mitchell|freeman|residence hall (?:no\\. )?3','wings','low',3],
 ['lora','wings','low',3], ['atlantic','house','low',2], ['pacific','house','low',2],
];
export function exteriorProfile(name='') {
 const p=profiles.find(([pattern])=>new RegExp(pattern,'i').test(name));
 return {family:p?.[1]||'wings',confidence:p?.[2]||'low',floors:p?.[3]||3};
}
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const point=(x,y,z)=>[120+x*.84-y*.52,160+x*.25+y*.36-z];
const polygon=(points,fill,stroke='#665e50')=>`<polygon points="${points.map(p=>point(...p).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>`;
function volume(x,y,w,d,h,{roof=true,timber=false,floors=2,porch=false,dormers=false}={}) {
 let svg=polygon([[x,y,h],[x,y+d,h],[x,y+d,0],[x,y,0]],'#9d725d')+polygon([[x,y+d,h],[x+w,y+d,h],[x+w,y+d,0],[x,y+d,0]],'#b8866d');
 // Horizontal courses are intentionally sparse at the selector scale.
 for(let z=8;z<h;z+=9)svg+=polygon([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+.5],[x,y+d,z+.5]],'#c5a18b','none');
 const cols=Math.max(2,Math.floor(w/35));
 for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
  const wx=x+(c+.5)*w/cols-5, wz=9+f*(h/floors);
  svg+=polygon([[wx,y+d+.6,wz+15],[wx+10,y+d+.6,wz+15],[wx+10,y+d+.6,wz],[wx,y+d+.6,wz]],'#b6ceca','#eae4d4');
  svg+=polygon([[wx+4.6,y+d+1,wz+15],[wx+5.4,y+d+1,wz+15],[wx+5.4,y+d+1,wz],[wx+4.6,y+d+1,wz]],'#eee8da','none');
 }
 if(timber){
  svg+=polygon([[x,y+d+.8,h-15],[x+w,y+d+.8,h-15],[x+w,y+d+.8,h],[x,y+d+.8,h]],'#ddd7bf');
  for(let c=0;c<=cols;c++){const tx=x+c*w/cols;svg+=polygon([[tx,y+d+1,h-15],[tx+2,y+d+1,h-15],[tx+2,y+d+1,h],[tx,y+d+1,h]],'#574b3f','none');}
 }
 if(roof){const rise=Math.min(27,d*.6);
  svg+=polygon([[x-4,y-4,h],[x+w+4,y-4,h],[x+w+4,y+d/2,h+rise],[x-4,y+d/2,h+rise]],'#686b63');
  svg+=polygon([[x-4,y+d/2,h+rise],[x+w+4,y+d/2,h+rise],[x+w+4,y+d+4,h],[x-4,y+d+4,h]],'#535950');
  svg+=polygon([[x-4,y-4,h],[x-4,y+d/2,h+rise],[x-4,y+d+4,h]],'#d9d3bf');
  if(dormers)for(let c=1;c<cols;c++){const dx=x+c*w/cols;svg+=polygon([[dx-6,y+d*.8,h+3],[dx+6,y+d*.8,h+3],[dx+6,y+d*.8,h+17],[dx,y+d*.8,h+23],[dx-6,y+d*.8,h+17]],'#d6d3bf');svg+=polygon([[dx-3,y+d*.81,h+6],[dx+3,y+d*.81,h+6],[dx+3,y+d*.81,h+15],[dx-3,y+d*.81,h+15]],'#90acae');}
 }
 if(porch){const cx=x+w/2;
  svg+=polygon([[cx-7,y+d+1,0],[cx+7,y+d+1,0],[cx+7,y+d+1,23],[cx-7,y+d+1,23]],'#435a50','#e5dfce');
  svg+=polygon([[cx-15,y+d+13,26],[cx,y+d+13,37],[cx+15,y+d+13,26]],'#e6dfce');
  svg+=polygon([[cx,y+d+13,37],[cx,y+d,37],[cx+15,y+d,26],[cx+15,y+d+13,26]],'#54594f');
 }
 return svg;
}
export function exteriorModelMarkup(name,options={}) {
 if(/gateway/i.test(name))return gatewayExteriorMarkup(name,options);
 if(/university forest|ufa/i.test(name))return apartmentExteriorMarkup(name);
 const enhanced=enhancedHallMarkup(name,options);if(enhanced)return enhanced;
 const remaining=remainingHallMarkup(name,options);if(remaining)return remaining;
 const profile=exteriorProfile(name), floors=Math.max(1,Math.min(6,options.floorCount||profile.floors));
 const h=floors*29, family=profile.family;
 let shape='';
 if(family==='court'){
  shape+=volume(10,0,270,43,h,{floors,dormers:true});
  shape+=volume(10,43,55,110,h,{floors,dormers:true});
  shape+=volume(225,43,55,110,h,{floors,dormers:true});
  shape+=volume(124,0,44,45,h+23,{floors:floors+1});
  const a=point(132,46,0),b=point(132,46,26),c=point(146,46,45),d=point(160,46,26),e=point(160,46,0);
  shape+=`<path d="M${a}L${b}Q${c} ${d}L${e}Z" fill="#536457" stroke="#ded4bc" stroke-width="7"/>`;
 }else if(family==='zigzag'){
  shape+=volume(25,0,70,80,h,{floors,dormers:true});
  shape+=volume(95,50,100,48,h,{floors,dormers:true});
  shape+=volume(195,50,65,100,h,{floors,dormers:true});
 }else if(family==='wings'){
  shape+=volume(15,0,250,58,h,{floors,dormers:profile.confidence!=='low'});
  shape+=volume(15,58,65,60,h,{floors});
  shape+=volume(200,58,65,60,h,{floors});
 }else{
  shape+=volume(15,20,family==='house'?160:270,family==='gateway'?85:65,h,{floors,timber:family==='tudor',porch:true,dormers:['tudor','gothic'].includes(family)});
 }
 return `<svg class="exterior-model exterior-model--${family}" viewBox="0 -50 390 360" aria-hidden="true" focusable="false" data-confidence="${profile.confidence}"><title>${esc(name)} — illustrative exterior</title><ellipse cx="192" cy="252" rx="160" ry="31" fill="#405b4420"/>${shape}</svg>`;
}
// Slice decoration: independent of interactive wrapper and its hit target.
export function ufaFacadeMarkup({upper=false}={}) {
 return `<svg class="ufa-model-facade" viewBox="0 0 640 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="640" height="100" fill="${upper?'#ac7c62':'#b5876e'}"/><path d="M0 20H640M0 40H640M0 60H640M0 80H640" stroke="#ceaa91" stroke-width="1"/>${[70,205,370,505].map(x=>`<g fill="#a9c7c5" stroke="#eee5ce" stroke-width="5"><rect x="${x}" y="17" width="45" height="58"/><path d="M${x+22.5} 17V75M${x} 46H${x+45}" stroke-width="2"/></g>`).join('')}${upper?'':`<rect x="294" y="30" width="40" height="70" fill="#4d6155" stroke="#eee5ce" stroke-width="5"/><path d="M276 30L314 8L352 30Z" fill="#eee5ce" stroke="#5e6257" stroke-width="3"/>`}<path d="M0 2H640" stroke="#e9e1cb" stroke-width="6"/></svg>`;
}
export function ufaRoofMarkup(){return `<svg class="ufa-model-roof" viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 150L28 0H612L640 150Z" fill="#6b6f61"/><path d="M0 150H640L612 300H28Z" fill="#515b50"/><path d="M0 150H640" stroke="#84907b" stroke-width="4"/><path d="M18 65H622M10 110H630M10 195H630M20 245H620" stroke="#9ba28d" stroke-opacity=".25" stroke-width="2"/><path d="M28 300H612" stroke="#e7dfca" stroke-width="7"/></svg>`;}
