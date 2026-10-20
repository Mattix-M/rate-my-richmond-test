// Original illustrative apartment geometry, not a surveyed elevation.
// UFA visual reference inspected: https://www.milestonecc.net/about-1
// Forest Apartments Phase V: shallow repeated roofs, brick bays, dark windows,
// pale entrance canopies. It does not identify block 166 or locate unit letters.
const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Draw mortar explicitly, avoiding shared SVG pattern IDs when several models
// coexist. Subtle courses read as brick rather than an oversized grid.
function brickCourses(width, height) {
 let result = '';
 for (let y=7,row=0; y<height; y+=7,row++) {
  result += `<path d="M0 ${y}H${width}"/>`;
  for(let x=(row%2)*14; x<width; x+=28) result += `<path d="M${x} ${y}v-7"/>`;
 }
 return `<g stroke="#dfbba4" stroke-opacity=".27" stroke-width=".75">${result}</g>`;
}
function windowFront(x, y, w=27, h=43) {
 return `<g><rect x="${x-3}" y="${y-3}" width="${w+6}" height="${h+6}" fill="#754e3e"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#293b52" stroke="#b5afa0" stroke-width="1.5"/><path d="M${x+2} ${y+2}h${w-4}v${h*.44}h-${w-4}Z" fill="#8da5bd"/><path d="M${x+3} ${y+h*.6}l${w-6} -8v${h*.32}h-${w-6}Z" fill="#627e9c"/><path d="M${x} ${y+h*.5}h${w}" stroke="#464d43" stroke-width="1.8"/><path d="M${x-4} ${y+h+3}h${w+8}" stroke="#d0b39b" stroke-width="2"/></g>`;
}
export function ufaFacadeMarkup({upper=false}={}) {
 let bays='';
 for(let i=0;i<4;i++) {
  const x=i*160;
  bays+=`<path d="M${x+1} 0V100" stroke="#73533f" stroke-width="4" opacity=".45"/><path d="M${x+6} 0V100" stroke="#d6ad90" stroke-width="1" opacity=".6"/>`;
  bays+=windowFront(x+25,upper?24:28,30,upper?45:43);
  if(upper) bays+=windowFront(x+103,24,25,45);
  else bays+=`<g><path d="M${x+92} 35h38v65h-38Z" fill="#583d30"/><rect x="${x+99}" y="42" width="23" height="58" fill="#34483f"/><rect x="${x+103}" y="46" width="15" height="20" fill="#6b8277"/><path d="M${x+103} 74h15v19h-15Z" fill="none" stroke="#6c7a65"/><circle cx="${x+118}" cy="72" r="1.3" fill="#d8c694"/><path d="M${x+83} 46V100M${x+136} 46V100" stroke="#e3dece" stroke-width="4"/><path d="M${x+78} 45L${x+105} 23L${x+142} 45Z" fill="#e7e0cc" stroke="#c9c3b2"/><path d="M${x+78} 43L${x+104} 19L${x+143} 40L${x+142} 45L${x+105} 27L${x+78} 48Z" fill="#434b43"/><path d="M${x+79} 48H${x+141}" stroke="#f2ecdc" stroke-width="3"/></g>`;
 }
 return `<svg class="ufa-model-facade" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="640" height="100" fill="${upper?'#94483f':'#a15144'}"/>${brickCourses(640,100)}${bays}<path d="M0 3H640" stroke="#ded8c7" stroke-width="6"/><path d="M0 8H640" stroke="#614c3b" stroke-opacity=".5" stroke-width="3"/><path d="M0 99H640" stroke="#786c58" stroke-width="2"/></svg>`;
}
export function ufaRoofMarkup() {
 let shingles='';
 for(let y=12,row=0;y<300;y+=12,row++) {
  shingles+=`<path d="M0 ${y}H640"/>`;
  for(let x=(row%2)*10;x<640;x+=20)shingles+=`<path d="M${x} ${y}v-5"/>`;
 }
 return `<svg class="ufa-model-roof" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0H640V150H0Z" fill="#52647b"/><path d="M0 150H640V300H0Z" fill="#34445c"/><g stroke="#c0bdb0" stroke-width=".8" stroke-opacity=".18">${shingles}</g><path d="M160 0V300M320 0V300M480 0V300" stroke="#24334b" stroke-width="3" opacity=".28"/><path d="M0 150H640" stroke="#71839b" stroke-width="5"/><path d="M0 2H640M0 298H640" stroke="#e5decb" stroke-width="5"/></svg>`;
}

const project=(x,y,z)=>[70+x*.88-y*.46,145+x*.22+y*.39-z];
const poly=(vertices,fill,stroke='#6c5b49',weight=.7)=>`<polygon points="${vertices.map(p=>project(...p).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}" stroke-linejoin="round"/>`;
function window3d(x,y,z,w=11,h=17) {
 return poly([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],'#66817b','#e1dbca',2)+poly([[x,y+.2,z+h*.48],[x+w,y+.2,z+h*.48],[x+w,y+.2,z+h*.53],[x,y+.2,z+h*.53]],'#b5bcae','none');
}
function townBay(x,step) {
 const y=step,d=65,w=73,h=78;
 let out=poly([[x,y,0],[x,y+d,0],[x,y+d,h],[x,y,h]],'#74382f');
 out+=poly([[x,y+d,0],[x+w,y+d,0],[x+w,y+d,h],[x,y+d,h]],'#9b493e');
 for(let z=4;z<h;z+=5)out+=poly([[x,y+d+.2,z],[x+w,y+d+.2,z],[x+w,y+d+.2,z+.3],[x,y+d+.2,z+.3]],'#c69a7a','none');
 out+=window3d(x+11,y+d+1,10,14,23)+window3d(x+11,y+d+1,48,14,21)+window3d(x+47,y+d+1,48,12,21);
 out+=poly([[x+48,y+d+1,0],[x+62,y+d+1,0],[x+62,y+d+1,30],[x+48,y+d+1,30]],'#3c5145','#ddd8c4',2);
 // A shallow gable spans each townhouse bay; repeats form the characteristic row.
 const rise=14;
 out+=poly([[x-2,y-3,h],[x+w+2,y-3,h],[x+w+2,y+d/2,h+rise],[x-2,y+d/2,h+rise]],'#52647b');
 out+=poly([[x-2,y+d/2,h+rise],[x+w+2,y+d/2,h+rise],[x+w+2,y+d+3,h],[x-2,y+d+3,h]],'#34445c');
 out+=poly([[x-2,y-3,h],[x-2,y+d/2,h+rise],[x-2,y+d+3,h]],'#c5c3b0');
 out+=poly([[x-2,y+d+3,h],[x+w+2,y+d+3,h],[x+w+2,y+d+3,h-2],[x-2,y+d+3,h-2]],'#e4ddca','none');
 for(const px of [x+43,x+67])out+=poly([[px,y+d+13,0],[px+2,y+d+13,0],[px+2,y+d+13,28],[px,y+d+13,28]],'#e5dfcc');
 out+=poly([[x+39,y+d+14,29],[x+55,y+d+14,40],[x+71,y+d+14,29]],'#dedccc');
 out+=poly([[x+55,y+d+14,40],[x+55,y+d-1,40],[x+73,y+d-1,29],[x+73,y+d+14,29]],'#34445c');
 out+=poly([[x+39,y+d+14,29],[x+39,y+d-1,29],[x+55,y+d-1,40],[x+55,y+d+14,40]],'#52647b');
 return out;
}
// Used by the main model dispatcher for UFA overview cards; unit-letter
// placement deliberately omitted. The 166 exploration retains separate floors.
export function apartmentExteriorMarkup(name='University Forest Apartments') {
 let mass='';
 for(let i=3;i>=0;i--)mass+=townBay(i*75,(i%2)*4);
 return `<svg class="exterior-model exterior-model--forest" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365 270" aria-hidden="true" focusable="false" data-confidence="medium"><title>${escapeText(name)} — illustrative brick townhouse row</title><ellipse cx="184" cy="220" rx="161" ry="23" fill="#49634118"/>${poly([[-6,66,0],[305,66,0],[305,92,0],[-6,92,0]],'#d3c9b5','none')}${mass}</svg>`;
}

// Official photo inspected in the university's sustainability gallery:
// https://farm1.staticflickr.com/4181/33749262454_f74487815a.jpg
// Identifiers: brick parapet towers, pale bands, steep slate roofs, dormers,
// glazed recessed connections. Individual block footprints remain approximate.
export function gatewayExteriorMarkup(name='Gateway Village', {floorCount=4}={}) {
 const floors=Math.max(1,Math.min(4,Number(floorCount)||4)),h=floors*29;
 const box=(x,y,w,d,height,color='#b57558')=>poly([[x,y,0],[x,y+d,0],[x,y+d,height],[x,y,height]],'#955d48')+poly([[x,y+d,0],[x+w,y+d,0],[x+w,y+d,height],[x,y+d,height]],color)+poly([[x,y,height],[x+w,y,height],[x+w,y+d,height],[x,y+d,height]],'#a68e75');
 let mass=box(15,0,275,66,h);
 // Fine brick courses and a continuous pale plinth give the larger apartment
 // volume a different scale from the compact Forest townhouses.
 for(let z=5;z<h;z+=5)mass+=poly([[15,66.2,z],[290,66.2,z],[290,66.2,z+.35],[15,66.2,z+.35]],'#c6987c','none');
 mass+=poly([[15,66.5,0],[290,66.5,0],[290,66.5,4],[15,66.5,4]],'#c7b69a','none');
 for(let f=0;f<floors;f++)for(const y of [12,37]){
  mass+=poly([[14.8,y,9+f*29],[14.8,y+12,9+f*29],[14.8,y+12,26+f*29],[14.8,y,26+f*29]],'#546f69','#d5cdbb',1.5);
 }

 for(let f=0;f<floors;f++)for(let x=27;x<280;x+=24)mass+=window3d(x,67,9+f*29,12,17);
 mass+=poly([[11,-4,h],[294,-4,h],[294,30,h+29],[11,30,h+29]],'#72776c');
 mass+=poly([[11,30,h+29],[294,30,h+29],[294,70,h],[11,70,h]],'#4f5951');
 // Slate courses follow the roof slope; light eaves emphasize its silhouette.
 for(let row=1;row<8;row++){
  const y=30+row*5,z=h+29-(row*5/40)*29;
  mass+=poly([[11,y,z+.2],[294,y,z+.2],[294,y+.3,z],[11,y+.3,z]],'#879084','none');
 }
 mass+=poly([[11,70,h],[294,70,h],[294,70,h-2],[11,70,h-2]],'#e4dcc9','none');
 for(const x of [75,115,196,236]){ 
  mass+=poly([[x-6,58,h+4],[x+7,58,h+4],[x+7,58,h+18],[x,58,h+24],[x-6,58,h+18]],'#ded7c4');
  mass+=window3d(x-3,59,h+7,7,10);
  mass+=poly([[x-6,58,h+18],[x-6,46,h+18],[x,46,h+24],[x,58,h+24]],'#71796e');
  mass+=poly([[x,58,h+24],[x,46,h+24],[x+7,46,h+18],[x+7,58,h+18]],'#47554c');

 }
 // Slightly projecting stair towers with stepped brick parapets.
 for(const x of [15,260]){
  mass+=box(x,62,30,15,h+4);
  for(let f=0;f<floors;f++)mass+=window3d(x+11,78,9+f*29,7,16);
  // Limestone accents frame the projecting stair towers, rather than adding
  // extra apartment entrances or implying a surveyed unit arrangement.
  for(const edge of [x+1,x+27])mass+=poly([[edge,77.8,0],[edge+2,77.8,0],[edge+2,77.8,h+4],[edge,77.8,h+4]],'#d2bda0','none');
  for(const z of [h-7,h+3])mass+=poly([[x,77.6,z],[x+30,77.6,z],[x+30,77.6,z+1.5],[x,77.6,z+1.5]],'#e2d7bd','none');
  mass+=poly([[x,78,h+4],[x+30,78,h+4],[x+30,78,h+10],[x+22,78,h+10],[x+22,78,h+15],[x+8,78,h+15],[x+8,78,h+10],[x,78,h+10]],'#ab6d52','#e3d6bb',1.4);
 }
 // Recessed central entrance with a glazed upper bay, not a UFA-style porch.
 mass+=box(140,63,30,10,h-3,'#c68e6c');
 for(let f=1;f<floors;f++){
  mass+=window3d(145,74,7+f*29,20,20);
  mass+=poly([[154.5,74.2,7+f*29],[155.5,74.2,7+f*29],[155.5,74.2,27+f*29],[154.5,74.2,27+f*29]],'#ded8c6','none');
 }

 const a=project(144,75,0),b=project(144,75,19),c=project(155,75,31),d=project(166,75,19),e=project(166,75,0);
 mass+=`<path d="M${a}L${b}Q${c} ${d}L${e}Z" fill="#3d5347" stroke="#ddd0b6" stroke-width="2.5"/>`;
 return `<svg class="exterior-model exterior-model--gateway" xmlns="http://www.w3.org/2000/svg" viewBox="0 -35 365 300" aria-hidden="true" focusable="false" data-confidence="medium"><title>${escapeText(name)} — illustrative Gateway brick and slate architecture</title><ellipse cx="180" cy="215" rx="159" ry="24" fill="#49634118"/>${mass}</svg>`;
}
