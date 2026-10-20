import{readFile,writeFile}from'node:fs/promises';
import{parseRoomDimensions}from'../room-dimensions.js';
const root=new URL('../',import.meta.url);
const records=JSON.parse(await readFile(new URL('data/housing/room-descriptions.json',root),'utf8'));
const names={'dennis':'Dennis Hall','lora-robins':'Lora Robins Court','marsh-hall':'Marsh Hall','moore-hall':'Moore Hall','robins-hall':'Robins Hall','wood-hall':'Wood Hall','atlantic-house':'Atlantic House','pacific-house':'Pacific House','gray-court':'Gray Court','jeter-hall':'Residence Hall No. 1','keller-hall':'Keller Hall','lakeview-hall':'Lakeview Hall','mitchell-freeman-hall':'Residence Hall No. 3','north-court':'North Court','south-court':'South Court','thomas-hall':'Residence Hall No. 2','gateway-151':'Gateway 151','gateway-153':'Gateway 153','gateway-155':'Gateway 155','gateway-157':'Gateway 157','westhampton-hall':'Westhampton Hall'};
const halls=new Map();
// Published 5′×13′ double is suspicious; retain source record but exclude the comparison pending verification.
const quarantined=new Set(['room-description-0231']);
for(const r of records){
 let dimensions=r.dimensions_raw,basis='room-specific';
 // Gray explicitly publishes a 13×14-foot default for doubles on each floor,
 // 'unless otherwise noted'. Do not guess its two alternative triple sizes.
 if(!dimensions&&r.building_id==='gray-court'&&r.room_type==='double'&&!/[’′']\s*(?:x|×)/i.test(r.source_text||'')){dimensions='13’ x 14’';basis='published-type-default';}
 const dims=parseRoomDimensions(dimensions);
 if(quarantined.has(r.record_id)||!dims||r.ra_explicit||r.accessible_explicit||!/^(single|double|triple|quad)$/i.test(r.room_type||''))continue;
 if(!halls.has(r.building_id))halls.set(r.building_id,{id:r.building_id,name:names[r.building_id]||r.building_id,rooms:[]});
 halls.get(r.building_id).rooms.push({id:r.record_id,room:r.room_id||r.room_label,floor:r.floor_label,type:r.room_type,occupancy:r.occupancy,width:dims.width,height:dims.height,dimensions,basis,source:r.source_page});
}
const output={source:'University of Richmond room descriptions',retrieved:'2026-10-19',method:'One explicit rectangular pair, or Gray’s explicitly published double-room default (unless otherwise noted). Staff/RA and explicitly accessible rooms excluded. Not a complete room inventory.',halls:[...halls.values()].sort((a,b)=>a.name.localeCompare(b.name))};
await writeFile(new URL('room-size-data.js',root),'export default '+JSON.stringify(output)+';\n');
console.log(`${output.halls.length} halls; ${output.halls.reduce((n,h)=>n+h.rooms.length,0)} dimensioned rooms`);
