import {complexFootprint} from './complex-footprints.js';
import {residenceFootprint} from './residence-footprints.js';
/**
 * Illustrative plan masses, not surveyed exterior geometry. Known silhouettes follow
 * the reviewed architecture modules/reference plan. Low-confidence entries remain
 * restrained schematic masses; their differences do not assert measured footprints.
 * Orthogonal roof rectangles tile each outline; angled roofs overlap only at
 * elbows. Roofs never bridge a courtyard. Fifth roof coordinate is rotationDegrees.
 */
const profile=(id,match,roofs,confidence,character,evidence)=>({id,match,roofs,confidence,character,evidence});
const reference='EXTERIOR_MODEL_REFERENCE_PLAN.md';
const profiles=[
 profile('north',/north court/i,[[0,0,240,42],[0,42,50,88],[190,42,50,88]],'high','Open brick court with arched rear range and two return wings','hall-architecture.js: north; named architect photographs'),
 profile('jeter',/jeter|residence hall (?:no\. )?1/i,[[0,0,240,46],[0,46,48,58],[192,46,48,58],[96,46,48,20]],'high','Tudor court with short projecting central entrance','hall-architecture.js: tudor(jeter)'),
 profile('wood',/wood hall/i,[[0,6,168,50],[168,2,62,50],[72,0,25,6],[86,56,34,5]],'medium','Long Tudor range with slightly offset eastern section and blue dormers','Reviewed official Wood first-floor preview 33c064b969ce8f5a; corrects prior provisional L mass'),
 profile('robins',/^robins hall$/i,[[0,112,230,54],[108,0,60,112]],'medium','T-shaped Tudor range with long off-center stem and blue dormers','Reviewed official Robins first-floor preview 92e5a30c65cdf4b0; corrects prior provisional L mass'),
 profile('gray',/gray court/i,[[0,0,45,110],[45,65,97,45],[97,110,45,45],[142,110,96,45]],'medium','Stepped W-like connected range with alternating wings','remaining-hall-architecture.js: gray and reviewed floor drawings'),
 profile('moore',/moore hall/i,[[105,0,46,48],[0,48,256,44],[105,92,46,112]],'medium','Three cross wings around a long central spine','remaining-hall-architecture.js: moore and reviewed second floor'),
 profile('keller',/keller hall/i,[[0,0,180,70],[180,0,45,70],[225,12,18,46]],'medium','Long residential bar with a stepped approximation of the polygonal end volume','remaining-hall-architecture.js: keller; polygonal end simplified for roof rectangles'),
 profile('gateway',/gateway/i,[[0,0,70,92],[70,18,90,50],[160,0,70,92]],'medium','Paired apartment wings with recessed connecting range',reference+'; apartment-architecture.js; representative block, not block-specific survey'),
 profile('forest',/university forest|ufa/i,[[0,0,125,85]],'medium','One compact two-level townhouse; projecting canopy supplied by renderer','UFA_EXTERIOR_REFERENCES.md; user photographs'),
 profile('thomas',/thomas|residence hall (?:no\. )?2/i,[[0,0,222,64]],'low','Restrained Tudor range; exact wing arrangement unverified',reference+'; architectural family established, schematic mass'),
 profile('marsh',/marsh hall/i,[[0,0,214,70]],'low','Substantial Tudor range; exact footprint unverified',reference+'; named Tudor description, schematic mass'),
 profile('westhampton',/westhampton hall/i,[[0,0,230,76]],'low','Collegiate Gothic range with light stone trim',reference+'; material vocabulary established, schematic mass'),
 profile('lakeview',/lakeview hall/i,[[0,0,220,84]],'low','Broad residential range with restrained pitched roof',reference+'; named reference available, schematic footprint'),
 profile('south',/south court/i,[[35,32,220,45],[35,8,43,24],[0,77,78,28],[176,0,43,32]],'medium','Long spine, cross wing at west end and separate northern projection','Reviewed official south_g.pdf preview eee875ae344ba240; minor bays simplified'),
 profile('dennis',/dennis hall/i,[[0,0,230,52],[126,52,52,96]],'medium','T-shaped range with off-center long return','Reviewed official dennis_1.gif preview 19ad9a19a1eaf94b; stairs and small bays simplified'),
 profile('freeman',/mitchell|freeman|residence hall (?:no\. )?3/i,[[0,0,218,72]],'low','Restrained residential range',reference+'; exterior arrangement unverified'),
 profile('lora',/lora/i,[[78,0,82,82],[112,82,30,30],[112,112,30,95],[142,112,82,95],[78,112,34,60],[0,160,78,82],[78,172,34,70]],'medium','Three offset residential pods around a connecting central spine','Reviewed official LoraRobinsCourtGround.pdf preview 20d69e4d6249b405; open paths and minor service projections omitted'),
 profile('atlantic',/atlantic house/i,[[0,0,90,92],[8,92,62,42]],'medium','Compact house with narrower rear projection; porch excluded from occupied floor','Reviewed official AtlaRoomNumbers1standDimsRev.pdf preview c414bf441581c853; exterior materials remain illustrative'),
 profile('pacific',/pacific house/i,[[0,0,90,145]],'medium','Simple elongated domestic rectangle; curved entry steps remain outside occupied mass','Reviewed official PacificHouse-1stfloor.pdf preview e1226122fe249cca; exterior materials remain illustrative'),
];

// Trace the exterior of a connected, hole-free union of axis-aligned roof pieces.
// Splitting on all rectangle coordinates ensures matching edges cancel exactly.
function outlineFromRoofs(roofs){
 const xs=[...new Set(roofs.flatMap(([x,,w])=>[x,x+w]))].sort((a,b)=>a-b);
 const ys=[...new Set(roofs.flatMap(([,y,,d])=>[y,y+d]))].sort((a,b)=>a-b);
 const edges=new Map(),key=([x,y])=>`${x},${y}`;
 const edge=(a,b)=>{const reverse=`${key(b)}>${key(a)}`;if(edges.has(reverse))edges.delete(reverse);else edges.set(`${key(a)}>${key(b)}`,[a,b]);};
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2;
  if(!roofs.some(([rx,ry,w,d])=>x>rx&&x<rx+w&&y>ry&&y<ry+d))continue;
  const a=[xs[i],ys[j]],b=[xs[i+1],ys[j]],c=[xs[i+1],ys[j+1]],d=[xs[i],ys[j+1]];
  edge(a,b);edge(b,c);edge(c,d);edge(d,a);
 }
 const next=new Map([...edges.values()].map(([a,b])=>[key(a),b])),start=[...edges.values()][0][0],outline=[start];
 let cursor=next.get(key(start));
 while(key(cursor)!==key(start)){outline.push(cursor);cursor=next.get(key(cursor));if(outline.length>edges.size)throw new Error('Disconnected building profile');}
 return outline.filter((p,i)=>{const a=outline[(i+outline.length-1)%outline.length],b=outline[(i+1)%outline.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});
}
// Bent ranges use an actual angled wing, not a stair-step surrogate. The small
// roof overlap at the elbow is intentional; outline is the union of both masses.
function bentRange(id,length,depth,wing,angle,evidence){
 const t=angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
 const roofs=[[0,0,length,depth],[length,0,wing,depth,angle]];
 const outline=[[0,0],[length,0],[length+wing*c,wing*s],[length+wing*c-depth*s,wing*s+depth*c],[length-depth*Math.tan(t/2),depth],[0,depth]];
 return {id,roofs,outline,confidence:'medium',character:'Plan-informed bent residential range; small entrance bays simplified',evidence,roofOverlap:true};
}
const angled={
 thomas:bentRange('thomas',178,43,90,60,'Reviewed official RH2 ground-floor preview 696d76f6b25871dc; central and end bay projections simplified'),
 freeman:bentRange('freeman',194,43,76,60,'Reviewed official RH3 first-floor preview 7d81e6c701472151; bay and stair projections simplified'),
 westhampton:bentRange('westhampton',172,65,112,35,'Reviewed official West_1.pdf.pdf preview 2f6b0f4b2f3c4f32; broader central core simplified'),
 lakeview:bentRange('lakeview',140,58,108,30,'Reviewed official lakeview_2_left/right previews 23af18b97df0684f and 320442b7d1153664; joined at central circulation core'),
};
// Marsh's terminal wing turns back from the angled range, as the official
// ground-floor overview shows. The source's separated drawing sections are
// represented as one continuous illustrative range, with the connector simplified.
{
 const t=Math.PI/3,c=Math.cos(t),s=Math.sin(t),length=180,depth=42,wing=90,tail=90;
 const e=[length+wing*c,wing*s],h=[e[0]-depth*c,e[1]-depth*s];
 const f=[e[0]-tail*s,e[1]+tail*c],g=[h[0]-tail*s,h[1]+tail*c],joint=[h[0]-depth*s,h[1]+depth*c];
 angled.marsh={id:'marsh',roofs:[[0,0,length,depth],[length,0,wing,depth,60],[...e,tail,depth,150]],outline:[[0,0],[length,0],e,f,g,joint,[length-depth*Math.tan(t/2),depth],[0,depth]],confidence:'medium',character:'Bent Tudor range with returning terminal wing',evidence:'Reviewed official MarshG.pdf preview 65a591e1eb09a6dd; disconnected sheet sections and service projections simplified',roofOverlap:true};
}
const shapes=profiles.map(p=>({...p,...(angled[p.id]||{outline:outlineFromRoofs(p.roofs)})}));
export function buildingShape(name='',family='wings'){
 const mapped=complexFootprint(name);
 if(mapped)return mapped;
 const found=shapes.find(p=>p.match.test(name));
 if(found)return residenceFootprint(found.id)||{...found,outline:found.outline.map(p=>[...p]),roofs:found.roofs.map(r=>[...r])};
 const roofs=family==='house'||family==='forest'?[[0,0,125,85]]:[[0,0,230,68]];
 return {id:'schematic',outline:outlineFromRoofs(roofs),roofs,confidence:'low',character:'Schematic residential mass',evidence:'No building-specific exterior reference'};
}
export const buildingShapeCoverage=Object.freeze(shapes.map(shape=>{
 const {id,confidence,character,evidence}=residenceFootprint(shape.id)||complexFootprint(shape.id==='lora'?'Lora Robins Court':'')||shape;
 return Object.freeze({id,confidence,character,evidence});
}));
