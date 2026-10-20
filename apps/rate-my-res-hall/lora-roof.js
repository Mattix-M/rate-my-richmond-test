/** Lora's three broad residential roof pods. Deliberately simple architectural
 * masses replace the noisy distance-field plateaus; service roof centers are
 * illustrative. The underlying full mapped perimeter is never altered. */
export function renderLoraRoof(outline,top,polygon,line){
 let markup=polygon(outline.map(([x,y])=>[x,y,top+1]),'#425775','data-lora-roof="base"');
 // Each pod has a continuous dark mansard rim and one calm pale service cap.
 // Coordinates follow the normalized mapped outline, not rectangular bounding
 // boxes spanning its open recesses.
 const pods=[
  {outer:[[6.331,0],[39.251,2.726],[44.624,14.204],[111.855,19.126],[108.775,87.943],[109,114],[0,115.777]],inner:[[19,16],[34,17],[40,28],[97,32],[95,99],[16,101]]},
  {outer:[[159.061,76.888],[179.291,76.601],[190.169,84.391],[271.343,87],[280,191.902],[166.307,190.832]],inner:[[175,94],[185,98],[258,101],[264,177],[180,176]]},
  {outer:[[41.133,128.895],[62.115,125.017],[152,125],[152.344,173.123],[152.757,233.365],[27.864,233.365],[24.277,190.32],[41.272,189.608]],inner:[[56,143],[137,141],[138,218],[42,218],[40,204],[56,204]]},
 ];
 // Build each mansard as one continuous eave-to-cap surface. The previous
 // version left a flat outer platform and extruded a separate inset object;
 // that produced floating slab-like roofs rather than pitched roof bands.
 pods.sort((a,b)=>a.outer.reduce((sum,p)=>sum+.55*p[0]+.92*p[1],0)/a.outer.length-b.outer.reduce((sum,p)=>sum+.55*p[0]+.92*p[1],0)/b.outer.length);
 for(const {outer} of pods){
  const center=outer.reduce((a,p)=>[a[0]+p[0]/outer.length,a[1]+p[1]/outer.length],[0,0]);
  const inner=outer.map(([x,y])=>[center[0]+(x-center[0])*.62,center[1]+(y-center[1])*.62]);
  const facets=outer.map((p,i)=>{const next=(i+1)%outer.length,q=outer[next];return {p,q,a:inner[i],b:inner[next],depth:.55*(p[0]+q[0])/2+.92*(p[1]+q[1])/2};}).sort((a,b)=>a.depth-b.depth);
  for(const {p,q,a,b} of facets){
   const dx=q[0]-p[0],dy=q[1]-p[1],front=.55*dy-.92*dx>0;
   markup+=polygon([[...p,top+1],[...q,top+1],[...b,top+15],[...a,top+15]],front?'#344b69':'#576c84','data-lora-roof="pitched-band"');
   markup+=line([...p,top+1],[...q,top+1],'#bdc4cc',1.1);
  }
  markup+=polygon(inner.map(([x,y])=>[x,y,top+15]),'#c7cbd0','data-lora-roof="service-cap"');
  inner.forEach((p,i)=>markup+=line([...p,top+15],[...inner[(i+1)%inner.length],top+15],'#aab3bf',.7));
 }
 return markup;
}
