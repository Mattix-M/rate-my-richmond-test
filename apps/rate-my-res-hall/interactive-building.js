import {buildingMetricScale} from './building-metric-scale.js';
import {renderFootprintRoof} from './footprint-roof.js';
import {atlanticRoofDetails,atlanticEntryDetails} from './atlantic-architecture-details.js';
import {buildingShape} from './interactive-building-profiles.js';
import {exteriorProfile} from './exterior-models.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Actual SVG faces are the targets: there are no rectangular hit overlays. */
export function interactiveBuildingMarkup(name,floors,attribute='floor'){
 if(!Array.isArray(floors)||!floors.length)return '';
 if(!/^[a-z][a-z0-9-]*$/.test(attribute))throw new Error('Invalid floor data attribute');
 const {family,confidence}=exteriorProfile(name), shape=buildingShape(name,family),outline=shape.outline, points=[];
 let roofRotation=null;
 const project=(x,y,z)=>{if(roofRotation){const [rx,ry,a]=roofRotation,dx=x-rx,dy=y-ry;x=rx+dx*Math.cos(a)-dy*Math.sin(a);y=ry+dx*Math.sin(a)+dy*Math.cos(a);}const p=[x*.92-y*.55,x*.22+y*.42-z];points.push(p);return p.map(n=>n.toFixed(2)).join(',');};
 const polygon=(coords,fill,extra='')=>`<polygon class="building-face floor-face" points="${coords.map(p=>project(...p)).join(' ')}" fill="${fill}" stroke="#796d5b" stroke-width="${.9*Math.min(1.5,height/31)}" stroke-linejoin="round" ${extra}/>`;
 const line=(a,b,color,width=1)=>`<path d="M${project(...a)}L${project(...b)}" fill="none" stroke="${color}" stroke-width="${width*Math.min(1.5,height/31)}" pointer-events="none"/>`;
 // Source footprint scale keeps a small house from getting hall-sized window counts.
 const height=shape.sourceOsmId?(buildingMetricScale(shape.sourceOsmId)||9.6875)*3.2:31,gap=Math.max(4,height*.22);
 let body='';
 floors.forEach((floor,index)=>{
  const atlantic=['atlantic','pacific'].includes(shape.id),roofStory=atlantic&&index===floors.length-1;
  const base=index*(height+gap),top=base+(roofStory?height*.25:height);
  let faces=polygon(outline.map(([x,y])=>[x,y,top]),'#e0dac7');
  // Projection x=.92x-.55y looks toward the positive-x/positive-y faces.
  // For clockwise XY outlines, the outward normal is (dy,-dx): use its
  // dot product with camera direction (.55,.92), not independent sign tests.
  // Sort complete wall+window groups back-to-front so rear-wing textures
  // cannot paint over the nearer wing merely because the source ring starts
  // at a different vertex. Very short source bays retain solid brick faces.
  const walls=outline.map(([x,y],i)=>{
   const [xx,yy]=outline[(i+1)%outline.length];
   return {x,y,xx,yy,dx:xx-x,dy:yy-y,depth:.55*(x+xx)/2+.92*(y+yy)/2};
  }).filter(({dx,dy})=>.55*dy-.92*dx>1e-6).sort((a,b)=>a.depth-b.depth);
  walls.forEach(({x,y,xx,yy,dx,dy})=>{
   const dark=dy>0;
   faces+=polygon([[x,y,base],[xx,yy,base],[xx,yy,top],[x,y,top]],dark?'#74382f':'#9b493e','data-wall="true"');
   for(let z=base+height*.22;z<top;z+=height*.22)faces+=line([x,y,z],[xx,yy,z],dark?'#a66b63':'#bc8275',.55);
   const length=Math.hypot(dx,dy),count=roofStory?0:Math.floor(length/(height*.95));
   const hasEntry=!atlantic&&index===0&&dx<0&&dy===0&&length>height*2.1;
   // A continuous stone plinth and shaded cornice anchor each brick storey.
   faces+=line([x,y,base+1],[xx,yy,base+1],dark?'#80624f':'#a3755d',2);
   faces+=line([x,y,top-.8],[xx,yy,top-.8],'#f0e8d5',1.1);
   for(let w=0;w<count;w++){
    const center=(w+.5)/count;
    if(hasEntry&&Math.abs(center-.5)<.095)continue;
    const half=Math.min(.065,height*.16/length),ax=x+dx*(center-half),ay=y+dy*(center-half),bx=x+dx*(center+half),by=y+dy*(center+half);
    faces+=polygon([[ax,ay,base+height*.22],[bx,by,base+height*.22],[bx,by,base+height*.81],[ax,ay,base+height*.81]],'#293b52','data-window="true"');
    const inset=.13,ix=ax+(bx-ax)*inset,iy=ay+(by-ay)*inset,jx=bx-(bx-ax)*inset,jy=by-(by-ay)*inset;
    faces+=polygon([[ix,iy,base+height*.29],[jx,jy,base+height*.29],[jx,jy,base+height*.74],[ix,iy,base+height*.74]],'#92a9bf','data-window="true"');
    faces+=line([ax,ay,base+height*.81],[bx,by,base+height*.81],'#d9cbb1',1.6);
    faces+=line([ax,ay,base+height*.22],[bx,by,base+height*.22],'#efe4cc',1.8);
    faces+=line([ax,ay,base+height*.52],[bx,by,base+height*.52],'#e4dfcd',1.2);
   }
   faces+=line([x,y,top-2],[xx,yy,top-2],'#e8dfca',2.5);
   if(hasEntry){
    // Arched entrances/arcade follow the established Gothic/courtyard family.
    const arcade=family==='court'&&y===42,entries=arcade?Math.max(2,Math.floor(length/28)):1;
    for(let entry=0;entry<entries;entry++){
     const t=(entry+.5)/entries,cx=x+dx*t,hw=height*(arcade?.26:.23);
     faces+=`<path class="building-face floor-face" d="M${project(cx-hw,y,base)}L${project(cx-hw,y,base+height*.55)}Q${project(cx,y,base+height*.94)} ${project(cx+hw,y,base+height*.55)}L${project(cx+hw,y,base)}Z" fill="#293b52" stroke="#e2d8bf" stroke-width="2.5"/>`;
     faces+=line([cx,y,base+1],[cx,y,base+height*.58],'#b8b89e',.8);
     if(!arcade){
      // Projecting entrance canopy reads clearly at the overview scale.
      faces+=polygon([[cx-height*.32,y,base+height*.71],[cx+height*.32,y,base+height*.71],[cx+height*.32,y+height*.32,base+height*.61],[cx-height*.32,y+height*.32,base+height*.61]],'#34445c');
      faces+=line([cx-height*.32,y+height*.32,base+height*.61],[cx+height*.32,y+height*.32,base+height*.61],'#e6ddc6',2);
      faces+=line([cx-height*.29,y+height*.29,base],[cx-height*.29,y+height*.29,base+height*.61],'#78808c',2.2);
      faces+=line([cx+height*.29,y+height*.29,base],[cx+height*.29,y+height*.29,base+height*.61],'#78808c',2.2);
     }
    }
   }

  });
  if(index===floors.length-1){
   // Separate roof masses keep courts and wings open instead of bridging their voids.
   if(atlantic)faces+=atlanticRoofDetails({outline,top,polygon,line,project});
   else if(shape.footprintRoof)faces+=renderFootprintRoof(outline,top,polygon,line,project,{name});
   const roofs=shape.roofs;
   roofs.forEach(([x,y,w,d,rotation=0])=>{
    roofRotation=rotation?[x,y,rotation*Math.PI/180]:null;
    const rise=Math.min(20,d*.28),ridge=y+d/2;
    faces+=polygon([[x-2,y-2,top],[x+w+2,y-2,top],[x+w+2,ridge,top+rise],[x-2,ridge,top+rise]],'#52647b');
    faces+=polygon([[x-2,ridge,top+rise],[x+w+2,ridge,top+rise],[x+w+2,y+d+2,top],[x-2,y+d+2,top]],'#34445c');
    faces+=polygon([[x-2,y-2,top],[x-2,ridge,top+rise],[x-2,y+d+2,top]],'#e3dbc7');
    for(let r=1;r<5;r++){const t=r/5;faces+=line([x,ridge+(d/2)*t,top+rise*(1-t)],[x+w,ridge+(d/2)*t,top+rise*(1-t)],'#879084',.5);}
    faces+=line([x-2,ridge,top+rise],[x+w+2,ridge,top+rise],'#a4aa97',1.25);
    faces+=line([x-2,y+d+2,top],[x+w+2,y+d+2,top],'#eee4cb',1.8);
    if(['tudor','gothic','court','zigzag'].includes(family)&&w>75){
     const count=Math.max(2,Math.floor(w/43));
     for(let dormer=0;dormer<count;dormer++){
      const cx=x+(dormer+.5)*w/count,fy=y+d*.83,z=top+2;
      faces+=polygon([[cx-5,fy,z],[cx+5,fy,z],[cx+5,fy,z+10],[cx,fy,z+17],[cx-5,fy,z+10]],/wood|robins/i.test(name)?'#728d9b':'#dcd5c0');
      faces+=polygon([[cx,fy,z+17],[cx,fy-9,z+17],[cx+6,fy-9,z+10],[cx+6,fy,z+10]],'#34445c');
      faces+=polygon([[cx-2,fy,z+2],[cx+2,fy,z+2],[cx+2,fy,z+9],[cx-2,fy,z+9]],'#88a6a4','data-window="true"');
     }
    }
    if(family==='tudor'){
     faces+=line([x-2,ridge,top],[x-2,ridge,top+rise],'#554c42',1.7);
     faces+=line([x-2,y+5,top+2],[x-2,ridge,top+rise-3],'#554c42',1.5);
     faces+=line([x-2,ridge,top+rise-3],[x-2,y+d-5,top+2],'#554c42',1.5);
    }

    roofRotation=null;
   });
  }
  if(atlantic&&index===0)faces+=atlanticEntryDetails({outline,base,height,polygon,line});
  body+=`<g class="floor-slab architectural-floor" data-${attribute}="${esc(floor.value)}" data-floor-index="${index}" role="button" tabindex="0" aria-label="${esc(floor.label)}"><title>${esc(floor.label)}</title>${faces}</g>`;
 });
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs)-18,minY=Math.min(...ys)-20,width=Math.max(...xs)-minX+18,heightBox=Math.max(...ys)-minY+18;
 return `<svg class="interactive-building interactive-building--${family}" viewBox="${minX} ${minY} ${width} ${heightBox}" role="group" aria-label="${esc(name)} — select a floor" data-confidence="${confidence}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
