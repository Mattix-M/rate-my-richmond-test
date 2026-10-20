// Original architectural illustrations, not surveyed models.
// North: smbw.com/education/ur-northcourt and Virginia DHR 127-0364-0003.
// Jeter: tceva.com/porfolio/university-of-richmond and theclio.com/entry/29715.
// Wood/Robins: Richmond historic district register, timber accents and blue dormers.
// Footprint proportions, opening counts and roof heights are interpretive.
const project = (x,y,z=0) => [110+x*.82-y*.50,155+x*.25+y*.36-z];
const pt = p => project(...p).join(',');
const face=(ps,fill,stroke='#655b51',width=.8)=>`<polygon points="${ps.map(pt).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const line=(ps,color,width=1)=>`<polyline points="${ps.map(pt).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const stone='#ddd5bf', roof='#515b60', glass='#839f9d';
function windowAt(x,y,z,w=9,h=15){return face([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],glass,stone,2)+line([[x+w/2,y,z],[x+w/2,y,z+h]],stone,.8)+line([[x,y,z+h*.6],[x+w,y,z+h*.6]],stone,.8);}
function arch(x,y,w,h){const a=pt([x,y,0]),b=pt([x,y,h*.6]),c=pt([x+w/2,y,h*1.22]),d=pt([x+w,y,h*.6]),e=pt([x+w,y,0]);return `<path d="M${a}L${b}Q${c} ${d}L${e}Z" fill="#46574c" stroke="${stone}" stroke-width="3.6"/>`;}
function block(x,y,w,d,h,{timber=false,dormers=0,blue=false,arcade=false,entry=false}={}){
 let s=face([[x,y,0],[x,y+d,0],[x,y+d,h],[x,y,h]],'#855849')+face([[x,y+d,0],[x+w,y+d,0],[x+w,y+d,h],[x,y+d,h]],'#ac7560');
 s+=line([[x,y+d,4],[x+w,y+d,4]],stone,2);
 // Continuous pale eaves and visible end windows keep wings legible at small scale.
 s+=line([[x,y,h-2],[x,y+d,h-2],[x+w,y+d,h-2]],stone,2.2);
 for(let f=0;f<Math.max(2,Math.round(h/26));f++)for(let c=0;c<Math.max(1,Math.floor(d/30));c++){
  const wy=y+(c+.5)*d/Math.max(1,Math.floor(d/30)),wz=8+f*(h-8)/Math.max(2,Math.round(h/26));
  s+=face([[x-.1,wy-4,wz],[x-.1,wy+4,wz],[x-.1,wy+4,wz+13],[x-.1,wy-4,wz+13]],glass,stone,1.5);
  s+=line([[x-.2,wy,wz],[x-.2,wy,wz+13]],stone,.7);
 }
 const rows=Math.max(2,Math.round(h/26)), cols=Math.max(2,Math.round(w/26));
 for(let f=0;f<rows;f++)for(let c=0;c<cols;c++){
  if(f===0&&(arcade||(entry&&c===Math.floor(cols/2))))continue;
  s+=windowAt(x+(c+.5)*w/cols-4.5,y+d+.2,8+f*(h-8)/rows,9,13);
 }
 if(arcade)for(let c=0;c<cols;c++)s+=arch(x+c*w/cols+5,y+d+.4,w/cols-10,25);
 if(entry)s+=arch(x+w*.5-9,y+d+.4,18,29);
 const rise=Math.min(d*.65,32), ridge=y+d*.43;
 s+=face([[x-3,y-3,h],[x+w+3,y-3,h],[x+w+3,ridge,h+rise],[x-3,ridge,h+rise]],'#73797a');
 s+=face([[x-3,ridge,h+rise],[x+w+3,ridge,h+rise],[x+w+3,y+d+3,h],[x-3,y+d+3,h]],roof);
 s+=face([[x-3,y-3,h],[x-3,ridge,h+rise],[x-3,y+d+3,h]],timber?'#d8d4c3':'#986854');
 if(timber){s+=line([[x-3,ridge,h+rise],[x-3,ridge,h]],'#514e45',2.3);s+=line([[x-3,y+3,h+4],[x-3,ridge,h+rise-4],[x-3,y+d-3,h+4]],'#514e45',2);}
 // Small timber cross-gable marks the photographed Tudor material family.
 if(timber&&entry){
  const gx=x+w*.5,gy=y+d+.5;
  s+=face([[gx-19,gy,h-2],[gx+19,gy,h-2],[gx,gy,h+24]],'#ded9c9',stone,1.8);
  s+=line([[gx-19,gy,h-2],[gx,gy,h+24],[gx+19,gy,h-2]],'#514e45',2.4);
  s+=line([[gx,gy,h-2],[gx,gy,h+24]],'#514e45',2);
  s+=line([[gx-11,gy,h+3],[gx+11,gy,h+3]],'#514e45',1.6);
 }
 for(let i=0;i<dormers;i++){
  const dx=x+(i+.5)*w/dormers,dy=y+d*.77,z=h+3;
  s+=face([[dx-7,dy,z],[dx+7,dy,z],[dx+7,dy,z+13],[dx,dy,z+23],[dx-7,dy,z+13]],blue?'#718c9a':stone);
  s+=face([[dx,dy,z+23],[dx,dy-13,z+23],[dx+9,dy-13,z+12],[dx+9,dy,z+12]],'#464f53');
  s+=windowAt(dx-3.5,dy+.2,z+3,7,10);
 }
 // End chimney stacks break the roof silhouette, rather than texture noise.
 if(w>100){s+=face([[x+w-19,ridge-4,h+rise-3],[x+w-9,ridge-4,h+rise-3],[x+w-9,ridge-4,h+rise+13],[x+w-19,ridge-4,h+rise+13]],'#a06c57');s+=line([[x+w-21,ridge-4,h+rise+13],[x+w-7,ridge-4,h+rise+13]],stone,2);}
 return s;
}
function north(){
 let s=face([[12,0,0],[300,0,0],[300,170,0],[12,170,0]],'#d6cfb8','none');
 s+=face([[80,57,.3],[236,57,.3],[236,153,.3],[80,153,.3]],'#a8b89a','none');
 s+=face([[147,57,.5],[160,57,.5],[160,170,.5],[147,170,.5]],'#c6a48d','none');
 s+=block(12,0,288,48,68,{dormers:7,arcade:true});
 s+=block(12,48,61,120,68,{dormers:2});
 s+=block(240,48,60,120,68,{dormers:2});
 // The arched patio and courtyard are the defining photographed identifiers.
 // Entry pavilion is deliberately low, not an invented castle tower.
 s+=block(125,-2,55,53,82,{entry:true,dormers:0});
 return s;
}
function tudor(kind){
 if(kind==='jeter')return block(18,5,270,52,65,{dormers:6})+block(18,57,55,65,65,{timber:true,dormers:1})+block(233,57,55,65,65,{timber:true,dormers:1})+block(125,53,56,22,70,{timber:true,entry:true});
 if(kind==='wood')return block(25,15,255,56,66,{timber:true,dormers:6,blue:true,entry:true})+block(25,71,58,47,66,{timber:true,dormers:1,blue:true});
 return block(25,12,260,57,66,{timber:true,dormers:7,blue:true,entry:true})+block(223,69,62,45,66,{timber:true,dormers:1,blue:true});
}
export function enhancedHallMarkup(name='',options={}){
 const kind=/north court/i.test(name)?'north':/jeter|residence hall (?:no\. )?1/i.test(name)?'jeter':/wood hall/i.test(name)?'wood':/^robins hall$/i.test(name)?'robins':null;
 if(!kind)return null;
 const title=String(name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<svg xmlns="http://www.w3.org/2000/svg" class="exterior-model exterior-model--${kind}" viewBox="0 -5 390 300" aria-hidden="true" focusable="false" style="pointer-events:none" data-confidence="${kind==='north'||kind==='jeter'?'high':'medium'}"><title>${title} — reference-informed architectural illustration</title><ellipse cx="195" cy="244" rx="165" ry="26" fill="#405b4418"/>${kind==='north'?north():tudor(kind)}</svg>`;
}
