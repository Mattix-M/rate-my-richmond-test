import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingShape} from '../interactive-building-profiles.js';
import {footprintRoofMesh,renderFootprintRoof} from '../footprint-roof.js';
const area=pts=>Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1]},0))/2;
const inside=(p,pts)=>{let result=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;};
const names=['North Court','Residence Hall No. 1','Wood Hall','Robins Hall','Gray Court','Moore Hall','Keller Hall','Residence Hall No. 2','Marsh Hall','Westhampton Hall','Lakeview Hall','South Court','Dennis Hall','Residence Hall No. 3','Atlantic House','Pacific House','Lora Robins Court',...['151','153','155','157'].map(n=>`Gateway Village Apartments ${n}`)];
test('pitched mesh covers full footprint without bridging concave courtyards',()=>{
 for(const name of names){const outline=buildingShape(name).outline,mesh=footprintRoofMesh(outline);assert.ok(Math.abs(mesh.reduce((s,t)=>s+area(t),0)-area(outline))<.001,name);assert.ok(mesh.flat(2).every(Number.isFinite),name);assert.ok(mesh.some(t=>t.some(p=>p[2]>5)),`${name} pitched rise`);for(const triangle of mesh){const centroid=[0,1].map(i=>triangle.reduce((s,p)=>s+p[i],0)/3);assert.ok(inside(centroid,outline),`${name} triangle inside perimeter`);}}
});
test('Dennis aerial vocabulary adds dormers without invalid geometry',()=>{const s=buildingShape('Dennis Hall'),polygon=pts=>pts.flat().every(Number.isFinite)?'<polygon/>':'NaN',line=()=>'',project=(x,y,z)=>`${x},${y-z}`;const result=renderFootprintRoof(s.outline,100,polygon,line,project,{name:'Dennis Hall'});assert.ok(result.includes('illustrative-hip'));assert.ok(result.includes('<polygon/>'));assert.ok(!result.includes('NaN'));});
test('Lora aerial treatment keeps truncated flat roof centers inside the full pods',()=>{const outline=buildingShape('Lora Robins Court').outline,mesh=footprintRoofMesh(outline,{name:'Lora Robins Court'});assert.ok(mesh.some(t=>t.every(p=>Math.abs(p[2]-9.8)<.001)));assert.ok(mesh.flat().every(p=>p[2]<=9.8));assert.ok(Math.abs(mesh.reduce((s,t)=>s+area(t),0)-area(outline))<.001);});
test('Lakeview uses rectangular rooflights from supplied aerial',()=>{const outline=buildingShape('Lakeview Hall').outline;const result=renderFootprintRoof(outline,100,(p,c,extra)=>`<polygon ${extra||''}/>`,()=>'',(x,y,z)=>`${x},${y-z}`,{name:'Lakeview Hall'});assert.match(result,/data-roof-detail="rooflight"/);});
test('Marsh Moore and North aerials enable dormers on their full connected roof outlines',()=>{for(const name of ['Marsh Hall','Moore Hall','North Court']){let detailCount=0;const shape=buildingShape(name);renderFootprintRoof(shape.outline,100,points=>{assert.ok(points.flat().every(Number.isFinite));detailCount++;return '<polygon/>';},()=>'',(x,y,z)=>`${x},${y-z}`,{name});assert.ok(detailCount>0,`${name} source-supported roof detail`);}});
test('Westhampton reference adds light flat strips without changing full footprint coverage',()=>{const outline=buildingShape('Westhampton Hall').outline,mesh=footprintRoofMesh(outline,{name:'Westhampton Hall'});assert.ok(mesh.some(t=>t.every(p=>Math.abs(p[2]-12.8)<.001)));assert.ok(Math.abs(mesh.reduce((s,t)=>s+area(t),0)-area(outline))<.001);});
test('final Robins South and Wood aerials enable dormers',()=>{for(const name of ['Robins Hall','South Court','Wood Hall']){let details=0;renderFootprintRoof(buildingShape(name).outline,100,()=>{details++;return '';},()=>'',(x,y,z)=>`${x},${y-z}`,{name});assert.ok(details>0,name);}});
test('roof eaves do not paint hidden rear-edge zigzags over the roof',()=>{
 for(const name of ['Marsh Hall','Lakeview Hall','Moore Hall']){
  const outline=buildingShape(name).outline,trim=[];
  renderFootprintRoof(outline,100,()=>'',(a,b,color)=>{if(color==='#bac2cc')trim.push([a,b]);return '';},(x,y,z)=>`${x},${y-z}`,{name});
  assert.ok(trim.length>0);
  for(const [a,b] of trim)assert.ok(.55*(b[1]-a[1])-.92*(b[0]-a[0])>1e-6,`${name}: hidden rear eave`);
 }
});
test('roof ridge sampling bounds interpolation dips without uniformly refining slopes',()=>{
 const outline=[[0,0],[160,0],[160,60],[0,60]],mesh=footprintRoofMesh(outline);
 const height=([x,y])=>.8+Math.min(23,Math.min(x,y,160-x,60-y)*.9);
 let coarsePlanar=0;
 for(const triangle of mesh){
  const longest=Math.max(...triangle.map((a,i)=>Math.hypot(a[0]-triangle[(i+1)%3][0],a[1]-triangle[(i+1)%3][1])));
  if(longest<=1.75+1e-7)continue;
  let maxError=0;
  for(let i=0;i<3;i++){const a=triangle[i],b=triangle[(i+1)%3];maxError=Math.max(maxError,Math.abs(height([(a[0]+b[0])/2,(a[1]+b[1])/2])-(a[2]+b[2])/2));}
  assert.ok(maxError<=.35+1e-7,'crease cannot retain a large interpolation dip');
  if(longest>3.5&&maxError<1e-7)coarsePlanar++;
 }
 assert.ok(coarsePlanar>0,'planar slopes keep coarse triangles');
});

test('roof batching preserves every triangle while reducing SVG nodes',()=>{
 const name='Dennis Hall',outline=buildingShape(name).outline;
 const mesh=footprintRoofMesh(outline,{name});
 const svg=renderFootprintRoof(outline,100,()=>'',()=>'',(x,y,z)=>`${x},${y-z}`,{name});
 assert.equal((svg.match(/M/g)||[]).length,mesh.length);
 assert.ok((svg.match(/<path/g)||[]).length<mesh.length*.8);
});
