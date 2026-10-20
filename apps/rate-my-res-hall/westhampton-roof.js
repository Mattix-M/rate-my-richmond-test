/** Two deliberate architectural roof ranges, with straight light service strips.
 * The user's aerial supports this treatment. Roof pitch/endpoints are illustrative;
 * every face is clipped to the mapped perimeter, including entry projections. */
const halfPlane=(points,axis,value,less)=>{
 const result=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],inside=p=>less?p[axis]<=value+1e-8:p[axis]>=value-1e-8,ai=inside(a),bi=inside(b);
  if(ai)result.push(a);
  if(ai!==bi){const t=(value-a[axis])/(b[axis]-a[axis]);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
 }return result;
};
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function clipConvex(subject,clip){
 let result=subject;
 for(let i=0;i<clip.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],input=result;result=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=cross(a,b,p),dq=cross(a,b,q),pi=dp>=-1e-8,qi=dq>=-1e-8;
   if(pi)result.push(p);
   if(pi!==qi){const t=dp/(dp-dq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
  }
 }return result;
}
export function westhamptonRoofFaces(outline){
 const result=[];
 // Right main range and oblique western return meet at the entrance core.
 for(const [section,angle] of [[halfPlane(outline,0,104,false),0],[halfPlane(outline,0,104,true),Math.atan2(48,82)]]){
  const c=Math.cos(angle),s=Math.sin(angle),local=section.map(([x,y])=>[x*c+y*s,-x*s+y*c]);
  const u0=Math.min(...local.map(p=>p[0])),u1=Math.max(...local.map(p=>p[0])),v0=Math.min(...local.map(p=>p[1])),v1=Math.max(...local.map(p=>p[1]));
  // A narrow service strip, not a broad white lid: the slate slopes dominate.
  const insetU=Math.min(28,(u1-u0)*.24),insetV=(v1-v0)*.425,a=u0+insetU,b=u1-insetU,d=v0+insetV,e=v1-insetV,rise=19;
  const regions=[
   {clip:[[u0,v0],[u1,v0],[b,d],[a,d]],z:(u,v)=>rise*(v-v0)/(d-v0),color:'#52647b'},
   {clip:[[u1,v0],[u1,v1],[b,e],[b,d]],z:(u,v)=>rise*(u1-u)/(u1-b),color:'#40526b'},
   {clip:[[a,e],[b,e],[u1,v1],[u0,v1]],z:(u,v)=>rise*(v1-v)/(v1-e),color:'#34445c'},
   {clip:[[u0,v0],[a,d],[a,e],[u0,v1]],z:(u,v)=>rise*(u-u0)/(a-u0),color:'#63758a'},
   {clip:[[a,d],[b,d],[b,e],[a,e]],z:()=>rise,color:'#e5e7e5',flat:true},
  ];
  for(const region of regions){const points=clipConvex(local,region.clip);if(points.length<3)continue;result.push({points:points.map(([u,v])=>[u*c-v*s,u*s+v*c,.8+Math.max(0,region.z(u,v))]),color:region.color,flat:Boolean(region.flat)});}
 }
 return result.sort((a,b)=>a.points.reduce((sum,p)=>sum+p[0]*.22+p[1]*.42,0)/a.points.length-b.points.reduce((sum,p)=>sum+p[0]*.22+p[1]*.42,0)/b.points.length);
}
export function renderWesthamptonRoof(outline,top,polygon,line){
 let markup='';
 for(const face of westhamptonRoofFaces(outline))markup+=polygon(face.points.map(([x,y,z])=>[x,y,top+z]),face.color,`data-roof="westhampton-${face.flat?'flat-strip':'pitch'}"`);
 // The two clipped roof ranges form the entire roof. Do not add an elevated
 // cross-gable overlay: its independent eaves create open seams and a floating
 // wing above the main roof. A measured entrance roof can replace these faces
 // later, but should share their boundary vertices rather than sit on top.
 outline.forEach((p,i)=>{const q=outline[(i+1)%outline.length];if(q[0]<p[0]||q[1]<p[1])markup+=line([...p,top+.8],[...q,top+.8],'#e4dfd5',1.7);});
 return markup;
}
