import {furnitureCatalog,plannerRooms,checkPlacement} from './dorm-planner-data.js';
export const STORAGE_KEY='reslife-planner-beta-v1';
export function readLayouts(raw){
 try{
  if(!raw||raw.length>150000)return {};
  const parsed=JSON.parse(raw);if(parsed?.version!==1||!parsed.rooms||typeof parsed.rooms!=='object')return {};
  const result={};
  for(const room of plannerRooms){
   const list=parsed.rooms[room.id];if(!Array.isArray(list)||list.length>30)continue;
   const ids=new Set();const cleaned=[];
   for(const item of list){
    const definition=furnitureCatalog.find(p=>p.type===item?.type);
    if(!definition||typeof item.id!=='string'||item.id.length>80||ids.has(item.id))continue;
    if(!['x','z','width','depth','height','rotation'].every(k=>Number.isFinite(item[k])))continue;
    if(item.width<.5||item.depth<.5||item.width>20||item.depth>20||item.height<.02||item.height>10)continue;
    const preset=room.initialFurniture?.find(p=>p.id===item.id);
    const next={...definition,...(typeof preset?.underBedStorage==='boolean'?{underBedStorage:preset.underBedStorage}:{}),...(typeof preset?.hasHutch==='boolean'?{hasHutch:preset.hasHutch}:{}),...(preset?.color?{color:preset.color}:{}),id:item.id,x:item.x,z:item.z,width:item.width,depth:item.depth,height:item.height,rotation:((item.rotation%360)+360)%360};
    const placement=checkPlacement(room,next);if(!placement.inside||placement.overlaps.length)continue;
    ids.add(next.id);cleaned.push(next);
   }
   result[room.id]=cleaned;
  }
  return result;
 }catch{return {};}
}
export function findOpenPosition(room,piece,items){
 // Look from the far wall toward the entrance. Quarter-foot precision is illustrative.
 for(let z=room.depth-piece.depth/2-.3;z>=piece.depth/2+.3;z-=.5){
  for(let x=piece.width/2+.3;x<=room.width-piece.width/2-.3;x+=.5){
   const item={...piece,x,z};const state=checkPlacement(room,item,items);
   if(state.inside&&!state.overlaps.length)return item;
  }
 }
 return null;
}
export function starterLayout(room){
 if(room.initialFurniture)return room.initialFurniture.map(item=>({...furnitureCatalog.find(p=>p.type===item.type),...item}));
 const result=[];
 for(const type of ['bed','desk','chair','dresser']){
  const base=furnitureCatalog.find(p=>p.type===type);
  const next=findOpenPosition(room,{...base,id:`starter-${type}`,rotation:0},result);
  if(next)result.push(next);
 }
 return result;
}
