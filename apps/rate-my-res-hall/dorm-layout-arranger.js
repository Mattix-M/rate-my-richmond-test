import {checkPlacement,pointInOutline} from './dorm-planner-data.js';

// A planning heuristic in scene units, not a measured accessibility/egress assessment.
export function entranceBuffers(room){
 return (room.doors||[]).map((door,index)=>{
  const width=door.width+.5,depth=3;
  const values={south:{x:door.x,z:(door.z??0)+depth/2,width,depth},north:{x:door.x,z:(door.z??room.depth)-depth/2,width,depth},west:{x:(door.x??0)+depth/2,z:door.z,width:depth,depth:width},east:{x:(door.x??room.width)-depth/2,z:door.z,width:depth,depth:width}}[door.wall];
  return values?{id:`entry-buffer-${index}`,...values,rotation:0}:null;
 }).filter(Boolean);
}

export function arrangeFurniture(room,items){
 if(!items.length)return [];
 const clearRoom={...room,obstacles:[...(room.obstacles||[]),...entranceBuffers(room)]};
 const order=[...items].sort((a,b)=>Number(!!a.floorLayer)-Number(!!b.floorLayer)||b.width*b.depth-a.width*a.depth);
 const arranged=[];
 for(const piece of order){
  let best=null,bestScore=Infinity;
  const zone=room.zones?.find(zone=>pointInOutline([piece.x,piece.z],zone.outline));
  const rotations=[0,90,180,270].map(turn=>(piece.rotation+turn)%360);
  for(const rotation of rotations){
   const angle=rotation*Math.PI/180;
   const halfW=(Math.abs(Math.cos(angle))*piece.width+Math.abs(Math.sin(angle))*piece.depth)/2;
   const halfD=(Math.abs(Math.sin(angle))*piece.width+Math.abs(Math.cos(angle))*piece.depth)/2;
   for(let z=halfD+.15;z<=room.depth-halfD-.15;z+=.5){
    for(let x=halfW+.15;x<=room.width-halfW-.15;x+=.5){
     const item={...piece,x,z,rotation};
     const fit=checkPlacement(clearRoom,item,arranged);
     if(!fit.inside||fit.overlaps.length)continue;
     if(zone&&!checkPlacement({outline:zone.outline,obstacles:[]},item).inside)continue;
     const wall=Math.min(x-halfW,room.width-x-halfW,z-halfD,room.depth-z-halfD);
     const center=Math.hypot(x-room.width/2,z-room.depth/2);
     let score=piece.floorLayer?center:wall*5-center*.1;
     if(piece.type==='desk'&&room.windows?.length){score+=Math.min(...room.windows.map(w=>Math.hypot(x-w.x,z-w.z)))*.15;}
     if(piece.type==='chair'){
      const desks=arranged.filter(item=>item.type==='desk');
      if(desks.length){score=Math.min(...desks.map(d=>{const dx=d.x-x,dz=d.z-z,distance=Math.hypot(dx,dz)||1;const facing=(Math.sin(angle)*dx-Math.cos(angle)*dz)/distance;return distance+4*(1-facing);}))+wall*.1;}
     }
     if(score<bestScore){best=item;bestScore=score;}
    }
   }
  }
  // Never shrink or drop furniture to make an arrangement look successful.
  if(!best)return null;
  arranged.push(best);
 }
 return items.map(item=>arranged.find(next=>next.id===item.id));
}
