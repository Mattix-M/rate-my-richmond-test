// Beta geometry is hand-selected from reviewed architectural traces, not crop bounds.
// Feet; x/z are horizontal, object positions are centres, rotation is degrees.
const transformOutline = (points, scale, left, bottom) => points.map(([x, y]) => [(x - left) * scale, (bottom - y) * scale]);
const tracedBox = (id, name, x1, y1, x2, y2, scale, left, bottom, height = 8) => ({ id, name, x: ((x1 + x2) / 2 - left) * scale, z: (bottom - (y1 + y2) / 2) * scale, width: (x2 - x1) * scale, depth: (y2 - y1) * scale, height, rotation: 0 });
const dennisScale = (87 * 14.5 + 80 * 13.5) / (87 ** 2 + 80 ** 2);
const northScale = (470 * 12.75 + 439 * 11.75) / (470 ** 2 + 439 ** 2);

export const plannerRooms = [
  {
    id: 'dennis-0100', recordId: 'room-description-0001', hall: 'Dennis Hall', name: 'Room 0100',
    width: 87 * dennisScale, depth: 80 * dennisScale, height: 8,
    outline: transformOutline([[2, 82], [89, 82], [89, 2], [2, 2]], dennisScale, 2, 82),
    doors: [{ x: 39 * dennisScale, z: 0, width: 18 * dennisScale, wall: 'south' }],
    windows: [{ x: 46 * dennisScale, z: 80 * dennisScale, width: 38 * dennisScale, wall: 'north', sill: 3, height: 4 }],
    obstacles: [tracedBox('closet-a', 'Built-in closet', 54, 69, 71, 82, dennisScale, 2, 82), tracedBox('closet-b', 'Built-in closet', 72, 69, 89, 82, dennisScale, 2, 82)],
    dimensionLabel: 'Published bedroom: 13′6″ × 14′6″',
    source: 'https://residencelife.richmond.edu/housing/first%20years/dennis.html',
    planUrl: 'data/housing/clean-plans/manual-dennis-thomas/dennis-0100.svg',
    notes: 'Outline, entrance, window and two closets follow the reviewed Dennis 0100 drawing. A single approximate scale matches the published bedroom dimensions without stretching the drawing. The original scan is low resolution. Wall height, window height and furniture sizes are illustrative; this is not a measured fit guarantee.'
  },
  {
    id: 'north-0013', recordId: 'room-description-0764', hall: 'North Court', name: 'Room 0013',
    width: 513 * northScale, depth: 803 * northScale, height: 8,
    outline: transformOutline([[21,855],[115,855],[115,901],[237,901],[237,855],[534,855],[534,537],[491,537],[491,98],[21,98]], northScale, 21, 901),
    doors: [{ x: 155 * northScale, z: 0, width: 122 * northScale, wall: 'south' }],
    windows: [{ x: 273 * northScale, z: 803 * northScale, width: 216 * northScale, wall: 'north', sill: 3, height: 4 }],
    obstacles: [tracedBox('bathroom', 'Bathroom · not editable', 293,537,534,855,northScale,21,901), tracedBox('closet-a','Built-in closet',21,537,101,702,northScale,21,901),tracedBox('closet-b','Built-in closet',21,702,101,855,northScale,21,901)],
    dimensionLabel: 'Published main bedroom: 12′9″ × 11′9″',
    source: 'https://residencelife.richmond.edu/housing/upperclass/north-court.html',
    planUrl: 'data/housing/clean-plans/north-court-013.svg',
    notes: 'The stepped outline, entrance, window, closets and bathroom follow the source-traced North Court 013 plan. The published dimensions describe the main bedroom, not the entire footprint shown here. One approximate scale is applied to the main bedroom and its adjoining spaces. Bathroom fixtures are not editable. Wall/window heights and furniture sizes are illustrative; verify measurements before buying anything.'
  }
];

// Generic planning objects, not verified Richmond-issued furniture specifications.
export const furnitureCatalog = [
  { type: 'bed', name: 'Twin XL bed', width: 3.25, depth: 6.67, height: 2, color: '#849ac0' },
  { type: 'desk', name: 'Desk', width: 3.5, depth: 2, height: 2.5, color: '#ae8464' },
  { type: 'chair', name: 'Desk chair', width: 1.7, depth: 1.8, height: 3, color: '#465c80' },
  { type: 'dresser', name: 'Dresser', width: 3, depth: 1.7, height: 3, color: '#b28163' },
  { type: 'futon', name: 'Small sofa', width: 5, depth: 2.7, height: 2.6, color: '#a44b48' },
  { type: 'fridge', name: 'Mini fridge', width: 1.6, depth: 1.8, height: 2.7, color: '#64748b' },
  { type: 'rug', name: 'Rug', width: 4, depth: 6, height: 0.025, color: '#b7c6da', floorLayer: true }
];
export function initialItems() { return []; }

export function getItemFootprint(item) {
  const angle = (Number(item.rotation) || 0) * Math.PI / 180;
  const c = Math.cos(angle), s = Math.sin(angle);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b]) => {
    const x = a * item.width / 2, z = b * item.depth / 2;
    return [item.x + x * c - z * s, item.z + x * s + z * c];
  });
}
const epsilon = 1e-7;
const cross = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function onSegment(p,a,b) { return Math.abs(cross(a,b,p)) < epsilon && p[0] >= Math.min(a[0],b[0])-epsilon && p[0] <= Math.max(a[0],b[0])+epsilon && p[1] >= Math.min(a[1],b[1])-epsilon && p[1] <= Math.max(a[1],b[1])+epsilon; }
export function pointInOutline(point, polygon) {
  let inside = false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[j], b=polygon[i];
    if(onSegment(point,a,b)) return true;
    if((a[1]>point[1]) !== (b[1]>point[1]) && point[0] < (b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
// Split each footprint edge at all outline intersections, then test every interval.
// Corner-only checks miss furniture bridging a concave notch.
function edgeInside(a,b,polygon) {
  const ts=[0,1], dx=b[0]-a[0], dz=b[1]-a[1];
  for(let i=0;i<polygon.length;i++) {
    const p=polygon[i],q=polygon[(i+1)%polygon.length], ex=q[0]-p[0],ez=q[1]-p[1];
    const den=dx*ez-dz*ex;
    if(Math.abs(den)<epsilon) continue;
    const t=((p[0]-a[0])*ez-(p[1]-a[1])*ex)/den;
    const u=((p[0]-a[0])*dz-(p[1]-a[1])*dx)/den;
    if(t>0 && t<1 && u>=-epsilon && u<=1+epsilon) ts.push(t);
  }
  ts.sort((a,b)=>a-b);
  return ts.slice(1).every((t,i)=>pointInOutline([a[0]+dx*(t+ts[i])/2,a[1]+dz*(t+ts[i])/2],polygon));
}
function polygonsOverlap(a,b) {
  for(const polygon of [a,b]) for(let i=0;i<polygon.length;i++) {
    const p=polygon[i],q=polygon[(i+1)%polygon.length],axis=[p[1]-q[1],q[0]-p[0]];
    const pa=a.map(v=>v[0]*axis[0]+v[1]*axis[1]),pb=b.map(v=>v[0]*axis[0]+v[1]*axis[1]);
    if(Math.max(...pa)<=Math.min(...pb)+epsilon || Math.max(...pb)<=Math.min(...pa)+epsilon) return false;
  }
  return true;
}
export function checkPlacement(room,item,items=[]) {
  const valid = ['x','z','width','depth'].every(k=>Number.isFinite(item[k])) && item.width>0 && item.depth>0 && (item.rotation===undefined || Number.isFinite(item.rotation));
  if(!valid) return {inside:false,overlaps:[]};
  const shape=getItemFootprint(item);
  const inside=shape.every(p=>pointInOutline(p,room.outline)) && shape.every((p,i)=>edgeInside(p,shape[(i+1)%shape.length],room.outline));
  const isRug=item.type==='rug'||item.floorLayer;
  const others=[...(room.obstacles||[]),...items.filter(other=>other.id!==item.id && !isRug && other.type!=='rug' && !other.floorLayer)];
  const overlaps=others.filter(other=>polygonsOverlap(shape,getItemFootprint(other))).map(other=>other.id);
  return {inside,overlaps};
}
export function placementIssues(room,item,items=[]) {
  const result=checkPlacement(room,item,items);
  return [...(!result.inside?['Outside the room walls']:[]),...(result.overlaps.length?['Overlaps furniture or a fixed feature']:[])];
}
