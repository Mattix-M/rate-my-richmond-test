// Footprint-informed architectural illustrations; dimensions and façade openings are approximate.
// Gray: reviewed Gray floor sheets (stepped/W plan) and Richmond postwar archive.
// Moore: reviewed second-floor cross plan and reduced fourth-floor A wing.
// Keller: reviewed third-floor outline with polygonal eastern volume; university music
// history confirms the former gymnasium and tower. No surveyed elevation is claimed.
const project=([x,y,z=0])=>[205+x*.76-y*.55,120+x*.24+y*.37-z];
const face=(points,fill,stroke='#635d52',width=.7)=>`<polygon points="${points.map(p=>project(p).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const line=(points,color,width=1)=>`<polyline points="${points.map(p=>project(p).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const stone='#d9d3bf',glass='#7f9996',roof='#535d5c';
function edgeWindows(a,b,h,rows=3,tall=false){
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.floor(length/27));let out='';
 const point=(t,z)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,z];
 for(let f=0;f<rows;f++)for(let i=0;i<n;i++){
  const t=(i+.5)/n,half=Math.min(.16,4/length),z=9+f*(h-10)/rows,wh=tall?26:13;
  out+=face([point(t-half,z),point(t+half,z),point(t+half,z+wh),point(t-half,z+wh)],glass,stone,1.6);
  out+=line([point(t,z),point(t,z+wh)],stone,.65)+line([point(t-half,z+wh*.6),point(t+half,z+wh*.6)],stone,.65);
 }return out;
}
function wing(x,y,w,d,h,{axis='x',dormers=0,rows=3,tall=false}={}){
 const a=[x,y],b=[x+w,y],c=[x+w,y+d],e=[x,y+d];let s='';
 s+=face([[...a,0],[...e,0],[...e,h],[...a,h]],'#895e4d');
 s+=face([[...e,0],[...c,0],[...c,h],[...e,h]],'#af7d66');
 s+=edgeWindows(e,c,h,rows,tall)+edgeWindows(a,e,h,rows,tall);
 s+=line([[...a,5],[...e,5],[...c,5]],stone,2);
 s+=line([[...a,h-2],[...e,h-2],[...c,h-2]],stone,2.2);
 const rise=Math.min(25,(axis==='x'?d:w)*.4),r1=axis==='x'?[x,y+d/2,h+rise]:[x+w/2,y,h+rise],r2=axis==='x'?[x+w,y+d/2,h+rise]:[x+w/2,y+d,h+rise];
 if(axis==='x')s+=face([[...a,h],[...b,h],r2,r1],'#727975')+face([r1,r2,[...c,h],[...e,h]],roof)+face([[...a,h],r1,[...e,h]],'#a7745c');
 else s+=face([[...a,h],r1,r2,[...e,h]],roof)+face([r1,[...b,h],[...c,h],r2],'#747a71')+face([[...e,h],r2,[...c,h]],'#a7745c');
 if(axis==='x')for(let i=0;i<dormers;i++){
  const dx=x+(i+.5)*w/dormers,dy=y+d*.78,z=h+3;
  s+=face([[dx-5,dy,z],[dx+5,dy,z],[dx+5,dy,z+10],[dx,dy,z+17],[dx-5,dy,z+10]],stone);
  // Give each dormer a real roof return instead of a flat pentagon.
  s+=face([[dx,dy,z+17],[dx,dy-9,z+17],[dx+6,dy-9,z+10],[dx+6,dy,z+10]],roof);
  s+=face([[dx-2.5,dy+.1,z+2],[dx+2.5,dy+.1,z+2],[dx+2.5,dy+.1,z+10],[dx-2.5,dy+.1,z+10]],glass,'#65756e',.6);
 }
 return s;
}
function gray(){
 // Orthogonal staircase footprint, not three detached rectangular halls.
 return wing(-130,-80,48,125,72,{axis:'y'})+
  wing(-82,-3,103,48,72,{dormers:3})+
  wing(21,-3,48,100,72,{axis:'y'})+
  wing(69,49,110,48,72,{dormers:3});
}
function moore(){
 // B and C cross wings, long A spine. Small upper A section follows fourth-floor sheet.
 return wing(-25,-105,50,60,75,{axis:'y'})+
  wing(-155,-45,130,49,75,{dormers:4})+
  wing(25,-45,130,49,75,{dormers:4})+
  wing(-25,-45,50,175,75,{axis:'y'})+
  wing(-25,130,50,52,92,{axis:'y',rows:4});
}
function keller(){
 // Long residential bar and distinct polygonal eastern volume visible in the floor outline.
 let s=wing(-135,-25,180,76,86,{dormers:5});
 const cx=86,cy=13,r=51,n=8,h=100;
 const ring=Array.from({length:n},(_,i)=>[cx+r*Math.cos(Math.PI/8+i*Math.PI/4),cy+r*Math.sin(Math.PI/8+i*Math.PI/4)]);
 const visible=[];for(let i=0;i<n;i++){
  const a=ring[i],b=ring[(i+1)%n],normal=[b[1]-a[1],a[0]-b[0]];
  if(normal[0]*-.55+normal[1]*.76>0)visible.push([a,b]);
 }
 for(const [a,b] of visible){s+=face([[...a,0],[...b,0],[...b,h],[...a,h]],'#a87661')+edgeWindows(a,b,h,3);s+=line([[...a,h-3],[...b,h-3]],stone,2.3);}
 s+=face(ring.map(p=>[...p,h]),'#626b65');
 // A shallow polygon roof avoids inventing a steep spire or crenellations.
 for(let i=0;i<n;i++)s+=face([[...ring[i],h],[...ring[(i+1)%n],h],[cx,cy,h+15]],i<4?'#68716b':'#4e5954');
 return s;
}
export function remainingHallMarkup(name='',options={}){
 const kind=/gray court/i.test(name)?'gray':/moore hall/i.test(name)?'moore':/keller hall/i.test(name)?'keller':null;if(!kind)return null;
 const title=String(name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<svg xmlns="http://www.w3.org/2000/svg" class="exterior-model exterior-model--${kind}" viewBox="0 -60 425 290" aria-hidden="true" focusable="false" style="pointer-events:none" data-confidence="medium" data-footprint="${kind}"><title>${title} — footprint-informed architectural illustration</title><ellipse cx="208" cy="165" rx="155" ry="25" fill="#405b4416"/>${({gray,moore,keller})[kind]()}</svg>`;
}
