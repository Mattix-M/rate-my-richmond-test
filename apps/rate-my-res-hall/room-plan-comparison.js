// Keep source geometry intact: only uniform scale and rigid rotation are allowed.
export function calibratePlan(bounds,room){
 const {width:w,height:h}=bounds;
 if(!(w>0&&h>0))return null;
 const candidates=[[room.width,room.height],[room.height,room.width]].map(([fw,fh])=>({fw,fh,error:Math.abs(Math.log((w/h)/(fw/fh)))}));
 const best=candidates.sort((a,b)=>a.error-b.error)[0];
 if(best.error>Math.log(1.1))return null;
 return {unitsToFeet:(w*best.fw+h*best.fh)/(w*w+h*h),aspectError:best.error};
}
export function safePlanDocument(text,parser){
 const doc=parser.parseFromString(text,'image/svg+xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid plan drawing');
 const allowed=new Set(['svg','g','path','rect','polygon','polyline','line','circle','ellipse']);
 for(const el of [...doc.documentElement.querySelectorAll('*')]){
  if(!allowed.has(el.localName)){el.remove();continue;}
  for(const a of [...el.attributes])if(/^on/i.test(a.name)||/href|style/i.test(a.name)||/url\(/i.test(a.value))el.removeAttribute(a.name);
 }
 // The paper background must not cover the other room in overlay view.
 for(const el of doc.querySelectorAll('rect'))if(el.getAttribute('width')==='100%'||el.getAttribute('fill')==='#faf9f5')el.remove();
 return doc.documentElement;
}

export function transformPlanBounds(box,m){
 const points=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));
 const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));
 return {x,y,width:Math.max(...points.map(p=>p.x))-x,height:Math.max(...points.map(p=>p.y))-y};
}
