/** Parse only one explicit rectangular feet/inches pair; ambiguous source text stays out. */
export function parseRoomDimensions(raw){
 if(typeof raw!=='string')return null;
 const text=raw.trim().replace(/[’‘′]/g,"'").replace(/[“”″]/g,'"').replace(/×/g,'x');
 const side="(\\d{1,2}(?:\\.\\d+)?)\\s*'(?:\\s*(\\d{1,2})\\s*\")?";
 const match=text.match(new RegExp(`^${side}\\s*x\\s*${side}$`,'i'));
 if(!match)return null;
 const inches=[Number(match[2]||0),Number(match[4]||0)];
 if(inches.some(n=>n>11))return null;
 const width=Number(match[1])+inches[0]/12,height=Number(match[3])+inches[1]/12;
 if(width<4||height<4||width>50||height>50)return null;
 return{width,height,area:width*height};
}
export function compareRoomAreas(a,b){
 if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0)return null;
 const difference=b-a;
 return{difference,percent:difference/a*100};
}
