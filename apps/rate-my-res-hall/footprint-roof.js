import {renderLoraRoof} from './lora-roof.js';
import {renderWesthamptonRoof} from './westhampton-roof.js';
/** Illustrative hipped roof over the complete source perimeter. The height field
 * measures distance to the nearest exterior edge, so reentrant courts stay open.
 * It does not claim surveyed roof ridges, pitches or floor-specific setbacks. */
const cache=new Map();
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const dist2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
const within=(p,outline)=>{let inside=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
function triangulate(outline){
 const vertices=outline.map(p=>[...p]);
 // Tiny collinear survey segments do not affect the perimeter, but can stall ears.
 for(let i=vertices.length-1;i>=0&&vertices.length>3;i--)if(Math.abs(cross(vertices[(i+vertices.length-1)%vertices.length],vertices[i],vertices[(i+1)%vertices.length]))<1e-7)vertices.splice(i,1);
 const area=vertices.reduce((sum,p,i)=>{const q=vertices[(i+1)%vertices.length];return sum+p[0]*q[1]-q[0]*p[1]},0);
 if(area<0)vertices.reverse();
 const remaining=vertices.map((_,i)=>i),triangles=[];
 while(remaining.length>3){
  let clipped=false;
  for(let i=0;i<remaining.length;i++){
   const a=vertices[remaining[(i+remaining.length-1)%remaining.length]],b=vertices[remaining[i]],c=vertices[remaining[(i+1)%remaining.length]];
   if(cross(a,b,c)<=1e-8)continue;
   const occupied=remaining.some(j=>{const p=vertices[j];return p!==a&&p!==b&&p!==c&&cross(a,b,p)>=-1e-8&&cross(b,c,p)>=-1e-8&&cross(c,a,p)>=-1e-8});
   if(occupied)continue;
   triangles.push([a,b,c]);remaining.splice(i,1);clipped=true;break;
  }
  if(!clipped)throw Error('Cannot triangulate residence perimeter');
 }
 triangles.push(remaining.map(i=>vertices[i]));return triangles;
}
function distanceToBoundary(p,outline){
 let nearest=Infinity;
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
  nearest=Math.min(nearest,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));
 }
 return nearest;
}
export function footprintRoofMesh(outline,{name=''}={}){
 const mansard=/lora/i.test(name),flatStrip=/westhampton/i.test(name),cap=mansard?9:flatStrip?12:23;
 const key=JSON.stringify(outline)+(mansard?'mansard':flatStrip?'flatStrip':'hip');if(cache.has(key))return cache.get(key);
 const elevation=p=>.8+Math.min(cap,distanceToBoundary(p,outline)*(mansard?1:.9));
 const mesh=[],split=triangle=>{
  const lengths=triangle.map((p,i)=>dist2(p,triangle[(i+1)%3])),edge=lengths.indexOf(Math.max(...lengths));
  // Long triangles that straddle a hip/ridge interpolate below the real
  // roof height, producing the sawtooth skyline. Refine only those creases;
  // leave planar roof slopes at their existing inexpensive resolution.
  const creaseError=triangle.reduce((error,a,i)=>{const b=triangle[(i+1)%3],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];return Math.max(error,Math.abs(elevation(mid)-(elevation(a)+elevation(b))/2));},0);
  if(lengths[edge]>49||(lengths[edge]>3.0625&&creaseError>.35)){const a=triangle[edge],b=triangle[(edge+1)%3],c=triangle[(edge+2)%3],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];split([a,m,c]);split([m,b,c]);return;}
  mesh.push(triangle.map(p=>[...p,elevation(p)]));
 };
 triangulate(outline).forEach(split);
 // Far roof surfaces first for a stable painter's order at the fixed camera pose.
 mesh.sort((a,b)=>a.reduce((s,p)=>s+p[0]*.22+p[1]*.42,0)-b.reduce((s,p)=>s+p[0]*.22+p[1]*.42,0));
 if(cache.size>40)cache.clear();cache.set(key,mesh);return mesh;
}
export function renderFootprintRoof(outline,top,polygon,line,project,{name=''}={}){
 if(/lora/i.test(name))return renderLoraRoof(outline,top,polygon,line);
 if(/westhampton/i.test(name))return renderWesthamptonRoof(outline,top,polygon,line);
 let markup='',runFill='',runPath='';
 const flush=()=>{if(runPath)markup+=`<path class="building-face floor-face" data-roof="illustrative-hip" d="${runPath}" fill="${runFill}" stroke="${runFill}" stroke-width=".35" stroke-linejoin="round"/>`;runPath='';};
 for(const triangle of footprintRoofMesh(outline,{name})){
  const [a,b,c]=triangle,u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);
  const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0],norm=Math.hypot(nx,ny,nz)||1;
  const light=Math.max(-1,Math.min(1,(-nx*.65-ny*.65+nz*.35)/norm));
  const plateau=/lora/i.test(name)&&triangle.every(p=>p[2]>9.79),flatStrip=/westhampton/i.test(name)&&triangle.every(p=>p[2]>12.79);
  const shade=Math.round((flatStrip?214:plateau?123:64)+light*24);
  const fill=flatStrip?`rgb(${shade} ${shade+3} ${shade+4})`:plateau?`rgb(${shade} ${shade+7} ${shade+15})`:`rgb(${shade} ${shade+16} ${shade+39})`;
  // No wireframe: same-color subpixel strokes close antialiasing seams.
  const points=triangle.map(([x,y,z])=>project(x,y,top+z));
  // Batch adjacent equal-shade faces without changing painter order.
  // Detailed ridges no longer require a separate SVG node for every triangle.
  if(fill!==runFill){flush();runFill=fill;}
  runPath+=`M${points[0]}L${points[1]}L${points[2]}Z`;
 }
 flush();
 // Match the camera-facing wall test. The old independent sign checks also
 // selected rear eaves, then painted their cream lines on top of the roof.
 outline.forEach(([x,y],i)=>{const [xx,yy]=outline[(i+1)%outline.length];if(.55*(yy-y)-.92*(xx-x)>1e-6)markup+=line([x,y,top+.8],[xx,yy,top+.8],'#bac2cc',1.1);});
 // User-supplied named aerials establish repeated dormer vocabulary,
 // not exact survey dimensions. Keep small dormers on long exposed roof slopes.
 if(/dennis|gateway|gray|keller|lakeview|marsh|moore|north court|^robins hall$|wood hall|south court|westhampton/i.test(name))outline.forEach((a,i)=>{
  const b=outline[(i+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  if(length<45||.55*dy-.92*dx<=1e-6)return;
  const tx=dx/length,ty=dy/length,nx=-ty,ny=tx,count=Math.floor(length/34);
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,cx=a[0]+dx*t+nx*7,cy=a[1]+dy*t+ny*7,z=top+7.1;
   if(distanceToBoundary([cx,cy],outline)<5)continue;
   const point=(u,v,h)=>[cx+tx*u+nx*v,cy+ty*u+ny*v,z+h];
   // Entire detail must sit inside its roof wing, including reentrant corners.
   if([point(-4,0,0),point(4,0,0),point(-4,7,0),point(4,7,0)].some(p=>!within(p,outline)))continue;
   if(/lakeview|westhampton/i.test(name)){
    // The identified aerial shows broad rectangular rooflights on the slopes.
    const roofPoint=(u,v)=>{const p=point(u,v,0);p[2]=top+1.15+Math.min(23,distanceToBoundary(p,outline)*.9);return p;};
    markup+=polygon([roofPoint(-4,0),roofPoint(4,0),roofPoint(4,7),roofPoint(-4,7)],'#abbcc0','data-roof-detail="rooflight"');
    continue;
   }
   markup+=polygon([point(-3.5,0,0),point(3.5,0,0),point(3.5,0,5),point(0,0,9),point(-3.5,0,5)],'#dcd9cb');
   markup+=polygon([point(0,0,9),point(0,7,9),point(4,7,5),point(4,0,5)],'#34445c');
   markup+=polygon([point(-4,0,5),point(-4,7,5),point(0,7,9),point(0,0,9)],'#52647b');
   markup+=polygon([point(-1.6,0,1),point(1.6,0,1),point(1.6,0,5),point(-1.6,0,5)],'#6c8b92');
  }
 });
 return markup;
}
