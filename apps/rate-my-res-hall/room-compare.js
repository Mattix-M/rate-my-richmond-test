import data from './room-size-data.js';
import{compareRoomAreas}from'./room-dimensions.js';
const $=id=>document.getElementById(id);
const halls=data.halls;
const hallA=$('hall-a'),hallB=$('hall-b'),roomA=$('room-a'),roomB=$('room-b');
function option(select,value,text){const el=document.createElement('option');el.value=value;el.textContent=text;select.append(el);}
function hallFor(select){return halls.find(h=>h.id===select.value);}
function chosen(hall,room){return hallFor(hall)?.rooms.find(r=>r.id===room.value);}
function populateRooms(hall,room){
 const previous=room.value;room.replaceChildren();
 for(const r of hallFor(hall).rooms)option(room,r.id,`${r.room} · ${r.type} · ${r.floor}`);
 if([...room.options].some(o=>o.value===previous))room.value=previous;
 else{const regularDouble=hallFor(hall).rooms.find(r=>r.type==='double');if(regularDouble)room.value=regularDouble.id;}
}
const fmt=n=>Number(n.toFixed(1)).toLocaleString('en-US');
const ns='http://www.w3.org/2000/svg';
function svgNode(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function draw(a,b){
 const svg=$('room-overlay'),rotated=$('rotate-b').checked,beside=document.querySelector('[name="layout"]:checked').value==='beside';
 const bw=rotated?b.height:b.width,bh=rotated?b.width:b.height;
 const scale=Math.min(610/(beside?a.width+bw+5:Math.max(a.width,bw)),285/Math.max(a.height,bh));
 const drawnWidth=(beside?a.width+bw+5:Math.max(a.width,bw))*scale;
 const x=(720-drawnWidth)/2,y=330,xB=beside?x+(a.width+5)*scale:x;
 const title=svgNode('title',{id:'drawing-title'},'Room dimensions at the same scale');
 const desc=svgNode('desc',{id:'drawing-desc'},`A: ${hallFor(hallA).name} room ${a.room}, ${a.dimensions}. B: ${hallFor(hallB).name} room ${b.room}, ${b.dimensions}. ${rotated?'Room B is rotated 90 degrees. ':''}${beside?'Side by side':'Overlaid at the same bottom-left corner'}. Dimension-based rectangles, not actual room outlines.`);
 const defs=svgNode('defs'),pattern=svgNode('pattern',{id:'feet-grid',width:scale*5,height:scale*5,patternUnits:'userSpaceOnUse',x,y});
 pattern.append(svgNode('path',{d:`M ${scale*5} 0 H 0 V ${scale*5}`,fill:'none',stroke:'#dce2ec','stroke-width':1}));defs.append(pattern);
 svg.replaceChildren(title,desc,defs);
 svg.append(svgNode('rect',{x:35,y:25,width:650,height:320,fill:'url(#feet-grid)'}));
 for(const [key,w,h,xx,color]of[['A',a.width,a.height,x,'#294987'],['B',bw,bh,xB,'#990000']]){
  svg.append(svgNode('rect',{class:'room-shape',x:xx,y:y-h*scale,width:w*scale,height:h*scale,fill:color,'fill-opacity':.1,stroke:color,'stroke-width':3,'stroke-dasharray':key==='B'?'9 5':'none','vector-effect':'non-scaling-stroke'}));
  if(beside)svg.append(svgNode('text',{x:xx+8,y:y-h*scale-10,fill:color,'font-size':16,'font-family':'Arial, sans-serif','font-weight':700},key));
 }
 svg.append(svgNode('path',{d:`M55 365h${5*scale}m0-5v10M55 360v10`,fill:'none',stroke:'#575b70','stroke-width':2}));
 svg.append(svgNode('text',{x:55+2.5*scale,y:391,'text-anchor':'middle',fill:'#575b70','font-size':14,'font-family':'Arial, sans-serif'},'5 feet'));
 svg.append(svgNode('text',{x:680,y:382,'text-anchor':'end',fill:'#575b70','font-size':13,'font-family':'Arial, sans-serif'},'Shared scale · 5-foot grid'));
}
function measure(room,hall,key){
 const box=document.createElement('section');box.className='room-measure';
 const title=document.createElement('h2');title.textContent=`${key} / ${hall.name} · ${room.room}`;box.append(title);
 for(const text of [`${room.type[0].toUpperCase()+room.type.slice(1)}${room.occupancy?` · ${room.occupancy} ${room.occupancy===1?'resident':'residents'}`:''} · ${room.floor}`,`${room.basis==='published-type-default'?'Published double-room default':'Published'}: ${room.dimensions}`,`Rectangle estimate: ${fmt(room.width*room.height)} sq ft`]){const p=document.createElement('p');p.textContent=text;box.append(p);}
 if(room.basis==='published-type-default'){const note=document.createElement('p');note.className='dimension-basis';note.textContent='The university lists this size for doubles unless otherwise noted; this is not a separate measurement of this room.';box.append(note);}
 const link=document.createElement('a');link.href=room.source;link.target='_blank';link.rel='noopener';link.textContent='University room description ↗';box.append(link);return box;
}
function render(){
 const a=chosen(hallA,roomA),b=chosen(hallB,roomB);if(!a||!b)return;
 const {difference,percent}=compareRoomAreas(a.width*a.height,b.width*b.height);
 const result=document.createElement('p');result.className='room-result';
 result.textContent=Math.abs(difference)<.05?'Same rectangle area. Different room.':`Room B’s rectangle is ${fmt(Math.abs(difference))} sq ft ${difference>0?'larger':'smaller'} (${fmt(Math.abs(percent))}%).`;
 if(a.id===b.id)result.textContent='Same room. Same rectangle.';
 const small=document.createElement('small');small.textContent='Percentage compares B with A. Areas are calculated from the listed dimensions.';result.append(small);
 $('room-result').replaceChildren(result);
 $('room-measures').replaceChildren(measure(a,hallFor(hallA),'A'),measure(b,hallFor(hallB),'B'));draw(a,b);
 const params=new URLSearchParams({a:a.id,b:b.id});if($('rotate-b').checked)params.set('rotate','1');if(document.querySelector('[name="layout"]:checked').value==='beside')params.set('view','beside');history.replaceState(null,'',`#${params}`);
}
for(const select of[hallA,hallB])for(const h of halls)option(select,h.id,h.name);
const params=new URLSearchParams(location.hash.slice(1));
const requestedHallName=new URLSearchParams(location.search).get('hall');
const requestedHall=halls.find(h=>h.name===requestedHallName);
if(requestedHallName&&!requestedHall){const note=$('requested-hall-note');note.hidden=false;note.textContent=`We don’t have a usable dimension pair for ${requestedHallName} in this comparison yet. You can compare the available rooms below.`;}
for(const [hall,room,key,fallback]of[[hallA,roomA,'a','dennis'],[hallB,roomB,'b','moore-hall']]){
 const requested=params.get(key),found=halls.find(h=>h.rooms.some(r=>r.id===requested));
 hall.value=found?.id||(key==='a'&&requestedHall?requestedHall.id:(halls.find(h=>h.id===fallback)?.id||halls[0].id));populateRooms(hall,room);if(found)room.value=requested;
 hall.addEventListener('change',()=>{populateRooms(hall,room);render();});room.addEventListener('change',render);
}
$('rotate-b').checked=params.get('rotate')==='1';if(params.get('view')==='beside')document.querySelector('[name="layout"][value="beside"]').checked=true;
$('rotate-b').addEventListener('change',render);for(const radio of document.querySelectorAll('[name="layout"]'))radio.addEventListener('change',render);
$('coverage').textContent=`${halls.reduce((n,h)=>n+h.rooms.length,0).toLocaleString()} dimensioned rooms across ${halls.length} halls/buildings in this snapshot. Source records retrieved October 19, 2026; this is collection coverage, not total housing inventory.`;
render();
