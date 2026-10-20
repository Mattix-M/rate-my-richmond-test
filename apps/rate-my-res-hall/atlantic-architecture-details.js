/** Photo-informed Atlantic House details. Full mapped footprint stays untouched.
 * The supplied street view establishes the steep slate roof, one broad cream
 * shed dormer, tall brick chimney and small gabled door hood. Heights and the
 * unseen rear roof junction remain illustrative, not a measured reconstruction.
 */
export function atlanticRoofDetails({outline,top,polygon,line}){
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),front=Math.max(...ys),w=x1-x0,d=front-y0;
 // One continuous ridge covers the actual outline, including its rear return.
 // Keeping both slopes in the same roof system avoids detached crossing planes.
 const ridge=(y0+front)/2,rise=Math.min(64,d*.29);
 let s='';
 const roof=(a,b,c,e,fill)=>polygon([a,b,c,e],fill,'data-atlantic-roof="true"');
 const clip=(points,axis,value,less)=>{
  const out=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],inside=p=>less?p[axis]<=value:p[axis]>=value,ia=inside(a),ib=inside(b);
   if(ia)out.push(a);
   if(ia!==ib){const t=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  return out;
 };
 const roofPart=(points,z,fill)=>points.length>2?polygon(points.map(([x,y])=>[x,y,z(x,y)]),fill,'data-atlantic-roof="true"'):'';
 const main=outline;
 const heightAt=y=>top+rise*Math.max(0,1-Math.abs(y-ridge)/(d/2));
 // Close only actual footprint edges. Bounding-box gables would fill the air
 // over the missing rear corner, creating the enormous cream triangle.
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],cuts=[a];
  if((a[1]<ridge&&b[1]>ridge)||(b[1]<ridge&&a[1]>ridge)){
   const t=(ridge-a[1])/(b[1]-a[1]);cuts.push([a[0]+t*(b[0]-a[0]),ridge]);
  }
  cuts.push(b);
  for(let j=0;j<cuts.length-1;j++){
   const c=cuts[j],e=cuts[j+1];
   if(Math.max(heightAt(c[1]),heightAt(e[1]))>top+.1)
    s+=polygon([[...c,top],[...e,top],[e[0],e[1],heightAt(e[1])],[c[0],c[1],heightAt(c[1])]],'#b5b9bd','data-atlantic-gable="true"');
  }
 }
 s+=roofPart(clip(main,1,ridge,true),(x,y)=>heightAt(y),'#52647b');
 s+=roofPart(clip(main,1,ridge,false),(x,y)=>heightAt(y),'#34445c');
 const spans=y=>{
  const intersections=[];
  for(let i=0;i<main.length;i++){const a=main[i],b=main[(i+1)%main.length];if((a[1]>y)!==(b[1]>y))intersections.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
  intersections.sort((a,b)=>a-b);
  const result=[];for(let i=0;i<intersections.length-1;i+=2)result.push([intersections[i],intersections[i+1]]);return result;
 };
 for(let i=1;i<10;i++){
  const t=i/10,y=ridge+(front-ridge)*t,z=top+rise*(1-t);
  for(const [left,right] of spans(y)){
   s+=line([left,y,z],[right,y,z],'#748298',.65);
   for(let x=left+(i%2)*10;x<right;x+=20)if(spans(y+3).some(([a,b])=>x>=a&&x<=b))s+=line([x,y,z],[x,y+3,z-rise*3/(front-ridge)],'#63748c',.5);
  }
 }
 // Trace only actual roof spans; a bounding-box line can float across a recess.
 for(const [left,right] of spans(front-1e-5))s+=line([left,front,top],[right,front,top],'#443e36',3);
 for(const [left,right] of spans(ridge))s+=line([left,ridge,top+rise],[right,ridge,top+rise],'#8290a5',1.5);
 // Wide shed dormer sits on the front slope, with cream panels and dark timber.
 const dx=x0+w*.63,dw=w*.19,fy=front-d*.075,back=fy-28,bottom=top+8,lintel=top+29;
 // Close both dormer cheeks down to the supporting roof slope. Without these
 // surfaces the shed roof reads as a floating panel from the oblique camera.
 for(const [x,color] of [[dx,'#c1c4c8'],[dx+dw,'#a7adb5']]){
  s+=polygon([[x,fy,heightAt(fy)],[x,back,heightAt(back)],[x,back,lintel+8],[x,fy,lintel]],color,'data-atlantic-dormer-side="true"');
 }
 s+=polygon([[dx,fy,bottom],[dx+dw,fy,bottom],[dx+dw,fy,lintel],[dx,fy,lintel]],'#e9e4da','data-atlantic-dormer="true"');
 s+=roof([dx-2,fy+2,lintel+2],[dx+dw+2,fy+2,lintel+2],[dx+dw+2,back,lintel+8],[dx-2,back,lintel+8],'#34445c');
 s+=line([dx,fy,bottom],[dx+dw,fy,bottom],'#51483d',2.4);
 for(const x of [dx,dx+dw*.29,dx+dw*.71,dx+dw])s+=line([x,fy,bottom],[x,fy,lintel],'#51483d',2.4);
 s+=polygon([[dx+dw*.34,fy,bottom+3],[dx+dw*.66,fy,bottom+3],[dx+dw*.66,fy,lintel-3],[dx+dw*.34,fy,lintel-3]],'#8b9fa9','data-window="true"');
 s+=line([dx+dw*.5,fy,bottom+3],[dx+dw*.5,fy,lintel-3],'#655e4d',1.4);
 // Tall, slender chimney beside the dormer is a defining visible feature.
 const cx=x0+w*.44,cy=front-d*.19,cw=14,cd=13,base=top+16,cap=top+76;
 s+=polygon([[cx,cy,base],[cx+cw,cy,base],[cx+cw,cy,cap],[cx,cy,cap]],'#9b493e','data-atlantic-chimney="true"');
 s+=polygon([[cx,cy,base],[cx,cy-cd,base],[cx,cy-cd,cap],[cx,cy,cap]],'#74382f');
 for(let z=base+4;z<cap;z+=4)s+=line([cx,cy,z],[cx+cw,cy,z],'#b78270',.6);
 s+=roof([cx-2,cy+2,cap],[cx+cw+2,cy+2,cap],[cx+cw+2,cy-cd-2,cap],[cx-2,cy-cd-2,cap],'#986255');
 s+=line([cx-2,cy+2,cap-4],[cx+cw+2,cy+2,cap-4],'#c3a08d',2);
 return s;
}

export function atlanticEntryDetails({outline,base=0,height=31,polygon,line}){
 const xs=outline.map(p=>p[0]),front=Math.max(...outline.map(p=>p[1])),x0=Math.min(...xs),w=Math.max(...xs)-x0,cx=x0+w*.69,half=14,depth=15,eave=base+height*.76,ridge=base+height*.95;
 let s=polygon([[cx-half*.7,front,base],[cx+half*.7,front,base],[cx+half*.7,front,eave],[cx-half*.7,front,eave]],'#293c53','data-house-door="true"');
 s+=polygon([[cx-half,front,eave],[cx,front,ridge],[cx,front+depth,ridge],[cx-half,front+depth,eave]],'#52647b','data-atlantic-entry="true"');
 s+=polygon([[cx,front,ridge],[cx+half,front,eave],[cx+half,front+depth,eave],[cx,front+depth,ridge]],'#34445c');
 s+=line([cx-half,front+depth,eave],[cx,front+depth,ridge],'#655141',3);
 s+=line([cx,front+depth,ridge],[cx+half,front+depth,eave],'#655141',3);
 for(const x of [cx-half+3,cx+half-3])s+=line([x,front+depth,eave],[x,front+4,base+13],'#655141',2.4);
 return s;
}
