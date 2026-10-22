// Original, editable reconstructions from reviewed tour views. All lengths are
// nominal planning coordinates, NOT measured room dimensions or a fit guarantee.
const source=slug=>`https://tours.vividmediany.com/3d-model/${slug}/fullscreen/`;
const shape=(name,x1,z1,x2,z2,color='#d6ba94')=>({name,outline:[[x1,z1],[x2,z1],[x2,z2],[x1,z2]],color});
const fixed=(id,name,x,z,width,depth,height=3,kind='fixture')=>({id,name,x,z,width,depth,height,rotation:0,kind});
const wall=(id,x,z,width,depth)=>fixed(id,'Partition',x,z,width,depth,8,'wall');
const defaults={bed:[3.25,6.67,2,'#849ac0'],desk:[3.5,2,2.5,'#ae8464'],chair:[1.7,1.8,3,'#465c80'],dresser:[3,1.7,3,'#b28163'],futon:[5,2.7,2.6,'#849ac0'],table:[4,2.5,2.5,'#ae8464'],rug:[5,7,.025,'#b7c6da']};
const item=(id,type,x,z,rotation=0)=>{const [width,depth,height,color]=defaults[type];return{id,type,x,z,rotation,width,depth,height,color,...(type==='rug'?{floorLayer:true}:{})};};
function model(id,hall,name,width,depth,outline,slug,more){return {id,hall,name,width,depth,height:8,outline,doors:[],windows:[],obstacles:[],initialFurniture:[],source:source(slug),planUrl:source(slug),scaleStatus:'unmeasured-tour-reference',dimensionLabel:'Tour reconstruction · dimensions unverified',notes:'Original editable reconstruction of a university-linked example unit. Shape, room connections and furnishing arrangement follow reviewed tour views; dimensions, wall heights, fixture sizes and furniture are illustrative. The tour has not been matched to an assigned unit. Do not use this model to confirm purchases or clearances.',...more};}
export const tourApartmentRooms=[
 model('tour-gateway-example','Gateway Village Apartments','Tour example · apartment',44,35,[[0,0],[39,0],[39,8],[44,8],[44,15],[41,15],[41,22],[44,22],[44,35],[0,35],[0,22],[3,22],[3,15],[0,15]],'richmond-gateway-apartment',{
  doors:[{x:44,z:11.5,width:3,wall:'east'}],windows:[{x:9,z:0,width:4,sill:3,height:4},{x:29,z:0,width:8,sill:3,height:4}],
  zones:[shape('Kitchen & dining',0,0,19,14,'#dbc6a6'),shape('Living room',19,0,39,13,'#d6ba94'),...[[0,10.7],[10.9,21.8],[22,32.9],[33.1,44]].map(([x1,x2],i)=>shape(`Bedroom ${i+1}`,x1,23,x2,35,'#c6bea9'))],
  obstacles:[fixed('kitchen-run','Kitchen counter',1.25,6.5,2.5,12),fixed('island','Kitchen island',8.5,6.5,3,7),fixed('fridge','Refrigerator',4,13.2,2.5,2.5,6),fixed('bath-a','Bathroom',18.2,18.5,6.3,8,.08),fixed('bath-b','Bathroom',25.5,18.5,6.3,8,.08),wall('bath-partition',21.85,18.5,.25,8),wall('bath-front-a',18.2,14.5,6.3,.25),wall('bath-front-b',25.5,14.5,6.3,.25),fixed('vanity-a','Sink',4,18.5,2,5,2.5),fixed('vanity-b','Sink',40,18.5,2,5,2.5),wall('bedroom-1',10.8,29,.2,12),wall('bedroom-2',21.9,29,.2,12),wall('bedroom-3',33,29,.2,12),...[[0,3.5],[6.5,14.5],[17.5,25.5],[28.5,36.5],[39.5,44]].map(([a,b],i)=>wall(`bedroom-door-${i}`,(a+b)/2,23,b-a,.2))],
  initialFurniture:[item('g-bed1','bed',2.1,30.8),item('g-bed2','bed',19.7,30.8),item('g-bed3','bed',24,30.8),item('g-bed4','bed',41.9,30.8),item('g-desk1','desk',8.8,30,90),item('g-desk2','desk',12.8,30,90),item('g-desk3','desk',31.1,30,90),item('g-desk4','desk',35,30,90),item('g-sofa1','futon',34,2,180),item('g-sofa2','futon',37,6.2,270),item('g-table','table',16,5)]
 }),
 model('tour-ufa-living','University Forest Apartments','Tour example · downstairs',32,15,[[0,0],[32,0],[32,7.5],[30,7.5],[30,15],[0,15]],'richmond-university-forest-apt',{
  doors:[{x:30,z:10.5,width:3,wall:'east'}],windows:[{x:0,z:7,width:8,sill:2.8,height:4},{x:32,z:3,width:3,sill:3,height:4}],
  zones:[shape('Living room',0,0,11,15,'#d0b68e'),shape('Kitchen & dining',11,0,30,11.7,'#e0d1b6')],
  obstacles:[fixed('stairs','Stairs',16.4,13.4,10,3.2,.12,'stairs'),fixed('half-bath','Half bath',27.2,13.4,5.6,3.2,.08),wall('bath-wall',24.4,13.4,.2,3.2),fixed('kitchen','Kitchen counter',16,1,10,2),fixed('fridge','Refrigerator',12.6,6.3,2.6,2.6,6),fixed('kitchen-return','Kitchen counter',11.7,3,1.4,4),fixed('partition-pier','Partition pier',19.5,7.5,2.6,1.5,8,'wall'),wall('stair-rail',16.4,11.8,10,.2)],
  initialFurniture:[item('u-sofa1','futon',5.2,1.8,180),item('u-sofa2','futon',9.3,4.3,270),item('u-coffee','table',5.5,6.3),item('u-dining','table',26,3.2,90),item('u-chair1','chair',23.6,3.2,90),item('u-chair2','chair',28.4,3.2,270),item('u-dresser','dresser',5.3,14)]
 }),
 model('tour-ufa-upstairs','University Forest Apartments','Tour example · upstairs',32,15,[[0,0],[11,0],[11,1.5],[21,1.5],[21,0],[32,0],[32,15],[24,15],[24,13],[21,13],[21,15],[11,15],[11,13],[8,13],[8,15],[3,15],[3,13],[0,13]],'richmond-university-forest-apt',{
  doors:[{x:16,z:15,width:3,wall:'north'}],windows:[{x:0,z:8,width:3,sill:3,height:4},{x:32,z:8,width:3,sill:3,height:4}],
  zones:[shape('Bedroom · two beds',0,0,11,13,'#c8bea7'),shape('Bedroom · two beds',21,0,32,13,'#c8bea7')],
  obstacles:[fixed('bath','Shared bathroom',16,5,9.5,7,.08),wall('bath-left',11,4.9,.2,7),wall('bath-right',21,4.9,.2,7),wall('bath-bottom-left',12.6,8.5,3.2,.2),wall('bath-bottom-right',19.4,8.5,3.2,.2),fixed('stairs','Stairs',16,13.7,9.6,2.6,.12,'stairs'),fixed('closet-left','Closet',5.5,14,4.8,1.7,6,'closet'),fixed('closet-right','Closet',26.5,14,4.8,1.7,6,'closet')],
  initialFurniture:[item('u-bed1','bed',1.9,3.7),item('u-bed2','bed',9.1,3.7),item('u-bed3','bed',22.9,3.7),item('u-bed4','bed',30.1,3.7),item('u-desk1','desk',1.9,9),item('u-desk2','desk',9,9),item('u-desk3','desk',23,9),item('u-desk4','desk',30,9)]
 }),
 model('tour-hall1-example','Residence Hall No. 1','Tour example · single / double suite',36,14,[[0,3],[12,3],[12,0],[16,0],[16,3],[28,3],[28,0],[32,0],[32,3],[36,3],[36,14],[7,14],[7,12],[3,12],[3,14],[0,14]],'richmond-res-hall-1-suite',{
  notes:'Tour-informed example with a double bedroom, a single and a shared central bathroom. Dormer/window bays and the irregular entrance edge are represented. The tour shows sloping ceilings; these are not yet modeled, and their clearance envelope is unmeasured. Nominal planning scale; not matched to a room number.',
  zones:[shape('Double bedroom',0,3,19,12,'#c9bfac'),shape('Single bedroom',25.5,3,36,14,'#c9bfac')],
  windows:[{x:14,z:0,width:3,sill:3,height:3},{x:30,z:0,width:3,sill:3,height:3}],doors:[{x:9,z:14,width:3,wall:'north'}],
  obstacles:[fixed('bath','Shared bathroom',22.3,8.5,6.2,11,.08),wall('bath-a-top',19.15,5.25,.2,4.5),wall('bath-a-bottom',19.15,12.25,.2,3.5),wall('bath-b-top',25.45,5.25,.2,4.5),wall('bath-b-bottom',25.45,12.25,.2,3.5),fixed('closet','Closet',1.5,13,2.7,1.8,6,'closet')],
  initialFurniture:[item('h1-bed1','bed',3.8,4.9,90),item('h1-bed2','bed',15,12,90),item('h1-bed3','bed',33.9,7),item('h1-desk1','desk',10,4.3),item('h1-desk2','desk',17.7,6,90),item('h1-desk3','desk',28.4,4.3)]
 }),
 model('tour-hall2-example','Residence Hall No. 2','Tour example · single / double suite',33,16,[[0,0],[8,0],[8,3],[18,3],[18,16],[8,16],[8,13],[0,13]],'richmond-res-hall-2-suites',{
  outline:[[0,0],[8,0],[8,3],[16,3],[16,10],[18,10],[18,3],[33,3],[33,16],[8,16],[8,13],[0,13]],
  zones:[shape('Single bedroom',0,0,8,13),shape('Double bedroom',18,3,33,16)],
  windows:[{x:4,z:0,width:4,sill:3,height:4},{x:24,z:3,width:6,sill:3,height:4}],doors:[{x:15,z:16,width:3,wall:'north'}],
  obstacles:[fixed('bath','Shared bathroom',12,6.5,7.6,6.8,.08),fixed('vanity','Double sink',11,15,5.7,1.8,2.5),wall('bed-left',8,5,.2,10),wall('bed-right',18,6.5,.2,7),wall('bath-bottom-a',9.45,10,2.7,.2),wall('bath-bottom-b',15.1,10,1.6,.2)],
  initialFurniture:[item('h2-bed1','bed',3.8,2,90),item('h2-bed2','bed',29.2,5,90),item('h2-bed3','bed',29.2,14,90),item('h2-desk1','desk',1.2,6.4,90),item('h2-desk2','desk',31.8,9.3,90),item('h2-desk3','desk',23,14.8)]
 }),
 model('tour-hall3-example','Residence Hall No. 3','Tour example · single / double suite',33,16,[[0,0],[33,0],[33,16],[20.5,16],[20.5,14.3],[17,14.3],[17,16],[13.5,16],[13.5,12.5],[9,12.5],[9,16],[3.5,16],[3.5,14.3],[0,14.3]],'richmond-res-hall-3-suites',{
  zones:[shape('Single bedroom',0,0,9,14),shape('Double bedroom',16,0,33,14)],
  windows:[{x:6,z:0,width:4,sill:3,height:4},{x:25,z:0,width:7,sill:3,height:4}],doors:[{x:6,z:16,width:3,wall:'north'}],
  obstacles:[fixed('bath','Shared bathroom',12.5,9,6.7,7,.08),wall('bath-left',9,9,.2,7),wall('bath-right',16,9,.2,7),wall('bath-top-a',10,5.5,2,.2),wall('bath-top-b',15,5.5,2,.2),wall('bed-entry-left',9,1.3,.2,2.6),wall('bed-entry-right',16,1.3,.2,2.6)],
  initialFurniture:[item('h3-bed1','bed',2,3.7),item('h3-bed2','bed',22.5,3.7),item('h3-bed3','bed',31,3.7),item('h3-desk1','desk',7.8,10,90),item('h3-desk2','desk',17.3,10,90),item('h3-desk3','desk',26,14)]
 })
];
