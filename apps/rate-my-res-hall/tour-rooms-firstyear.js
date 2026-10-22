// Editable reconstructions of six university-presented sample bedrooms.
// Coordinates use a nominal foot-like planning grid, NOT measurements taken from
// the scans. The tours do not identify these samples as any numbered room.
// Furniture positions preserve observed relationships, with planning clearances
// added so the illustrative pieces remain individually editable.
const provider = 'https://tours.vividmediany.com/3d-model/';
const bed = (id,x,z,rotation=0,height=2.2,underBedStorage=false) => ({id,type:'bed',x,z,width:3.1,depth:6.6,height,rotation,color:id.endsWith('b')?'#924a4d':'#526b99',underBedStorage});
const desk = (id,x,z,rotation=0,hasHutch=false,width=3.6) => ({id,type:'desk',x,z,width,depth:2.2,height:2.5,rotation,color:'#ac8059',hasHutch});
const chair = (id,x,z,rotation=0) => ({id,type:'chair',x,z,width:1.7,depth:1.8,height:3,rotation,color:'#53617b'});
const dresser = (id,x,z,rotation=0) => ({id,type:'dresser',x,z,width:3,depth:1.7,height:3,rotation,color:'#b38760'});
const windowAt = (x,z,width) => ({x,z,width,wall:'north',sill:3,height:4});
const common = (key,hall,slug,width,depth,notes) => ({
  id:`tour-${key}-example`,hall,name:'Tour example · double',width,depth,height:8,
  source:`${provider}${slug}/fullscreen/`,planUrl:`${provider}${slug}/fullscreen/`,
  dimensionLabel:'Tour reconstruction · dimensions unverified',
  scaleStatus:'unmeasured-tour-reference',
  notes:`Editable reconstruction of the university’s sample ${hall} double-room tour, not a verified numbered room. All dimensions use an illustrative nominal scale; do not use them to check purchases or real-world fit. ${notes}`,
  reviewedDate:'2026-10-22',
  obstacles:[],
  visualStyle:{floorColor:'#c9aa81',wallColor:'#ece8dd'},
});

export const tourFirstyearRooms = [
  {
    ...common('dennis','Dennis Hall','richmond-dennis-double',15.5,17,
      'The sample has a projecting window bay and an offset entry area. One bed is turned across the window end and the other runs along a side wall. This is deliberately separate from the reviewed Dennis 0100 drawing; no room-number match is known.'),
    // Clear wall shapes seen in the interior and overhead view, simplified; scan
    // holes and ragged mesh edges are not interpreted as real wall openings.
    outline:[[6.5,0],[15.5,0],[15.5,15],[11,15],[10,17],[5,17],[4,15],[0,15],[0,2.5],[6.5,2.5]],
    doors:[{x:10.5,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(7.5,17,4.5)],
    initialFurniture:[
      bed('dennis-bed-a',3.8,13.25,90),bed('dennis-bed-b',13.65,10.9),
      desk('dennis-desk-a',1.3,8.7,90,true),desk('dennis-desk-b',14.3,4.3,270,true),
      chair('dennis-chair-a',3.7,8.7,270),chair('dennis-chair-b',11.9,4.3,90),
      dresser('dennis-dresser-a',1.4,4.5,90),dresser('dennis-dresser-b',14,1.15),
    ],
  },
  {
    ...common('loro','Lora Robins Court','richmond-lora-robins-double',12.8,17.5,
      'Two raised beds occupy opposite side walls, with desks nearer the entrance and a window between the beds. Under-bed storage is represented as part of the illustrative bed, not an independently measured drawer unit. The entry-side wall inset is simplified; closet interiors were not verified.'),
    outline:[[0,0],[3.4,0],[3.4,2.5],[8,2.5],[8,0],[12.8,0],[12.8,17.5],[0,17.5]],
    doors:[{x:10.3,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(6.4,17.5,3.6)],
    initialFurniture:[
      bed('loro-bed-a',1.9,13.7,0,3.3,true),bed('loro-bed-b',10.9,13.7,0,3.3,true),
      desk('loro-desk-a',1.3,7.6,90,true),desk('loro-desk-b',11.5,6.5,270,true),
      chair('loro-chair-a',3.7,7.6,270),chair('loro-chair-b',9.1,6.5,90),
    ],
  },
  {
    ...common('marsh','Marsh Hall','richmond-marsh-double',14,16,
      'The sample places beds against opposite walls, a desk below the broad window, and a second workstation near the entrance. One raised bed has storage below. The visible ceiling projection is recorded as an overhead feature, not a floor obstruction; its height and loft clearance are unverified.'),
    outline:[[0,0],[2.6,0],[2.6,2.2],[5.7,2.2],[5.7,0],[14,0],[14,16],[0,16]],
    doors:[{x:8.8,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(7,16,8)],
    ceilingFeatures:[{id:'marsh-window-bulkhead',kind:'bulkhead',x:7,z:15.5,width:14,depth:1,height:0.7,baseY:7.3,nominal:true}],
    visualStyle:{floorColor:'#c9c4b9',wallColor:'#e9e6dc'},
    initialFurniture:[
      bed('marsh-bed-a',1.9,11.5,0,3.3,true),bed('marsh-bed-b',12.1,11.5),
      desk('marsh-desk-a',7,14.8,0,false,4),desk('marsh-desk-b',12.8,4.3,270,false),
      chair('marsh-chair-a',7,12.3,180),chair('marsh-chair-b',10.4,4.3,90),
    ],
  },
  {
    ...common('moore','Moore Hall','richmond-moore-double',14,17,
      'Raised beds sit along both side walls with storage beneath. One desk sits below the window and the other at the entry end. The entry wall projection is retained without treating incomplete scan fragments as additional rooms. Current furniture and lofting rules are not verified by the tour.'),
    outline:[[0,0],[8,0],[8,2.4],[11,2.4],[11,0],[14,0],[14,17],[0,17]],
    doors:[{x:2,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(7,17,6.5)],
    visualStyle:{floorColor:'#c7c5bd',wallColor:'#e9e6dc'},
    initialFurniture:[
      bed('moore-bed-a',1.9,12,0,3.3,true),bed('moore-bed-b',12.1,12.8,0,3.3,true),
      desk('moore-desk-a',7,15.8,0,false,4),desk('moore-desk-b',5.5,1.3,180,true),
      chair('moore-chair-a',7,13.3,180),chair('moore-chair-b',5.5,3.8,0),
    ],
  },
  {
    ...common('robins','Robins Hall','richmond-robins-double',16,15.5,
      'The staged sample turns one raised bed across the far end and places the other along the side wall. Two desks have hutches, a separate drawer chest sits near the entrance, and storage is visible beneath the beds. The entry-side recess is represented approximately; this is not a complete hall plan.'),
    outline:[[7,0],[16,0],[16,15.5],[0,15.5],[0,2.4],[7,2.4]],
    doors:[{x:10.1,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(8.2,15.5,3.7)],
    initialFurniture:[
      bed('robins-bed-a',4,13.65,90,3.0,true),bed('robins-bed-b',14.0,11.2,0,3.0,true),
      desk('robins-desk-a',1.3,9.4,90,true),desk('robins-desk-b',14.7,4.7,270,true),
      chair('robins-chair-a',3.7,9.4,270),chair('robins-chair-b',12.3,4.7,90),
      dresser('robins-dresser-a',1.4,4.7,90),
    ],
  },
  {
    ...common('wood','Wood Hall','richmond-wood-double',13.6,16,
      'The sample uses two lower beds on opposing sides, two separate drawer chests below the window, and two entry-side desks with hutches. The entry-side wall inset is retained approximately. Small isolated fragments at the scan edge are omitted because they do not verify another room or closet.'),
    outline:[[0,0],[3,0],[3,2.7],[7.2,2.7],[7.2,0],[13.6,0],[13.6,16],[0,16]],
    doors:[{x:10.3,z:0,width:2.8,wall:'south'}],
    windows:[windowAt(6.8,16,7.8)],
    initialFurniture:[
      bed('wood-bed-a',1.9,11),bed('wood-bed-b',11.7,11),
      desk('wood-desk-a',1.3,5.1,90,true),desk('wood-desk-b',12.3,4.6,270,true),
      chair('wood-chair-a',3.7,5.1,270),chair('wood-chair-b',9.9,4.6,90),
      dresser('wood-dresser-a',5.15,14.9),dresser('wood-dresser-b',8.35,14.9),
    ],
  },
];
