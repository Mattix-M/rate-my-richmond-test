import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingShape} from '../interactive-building-profiles.js';
import {westhamptonRoofFaces,renderWesthamptonRoof} from '../westhampton-roof.js';
const area=pts=>Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1]},0))/2;
test('Westhampton has two clean intentional flat strips and complete roof coverage',()=>{
 const outline=buildingShape('Westhampton Hall').outline,faces=westhamptonRoofFaces(outline),flat=faces.filter(f=>f.flat);
 assert.equal(flat.length,2);assert.ok(faces.length<=10);assert.ok(faces.every(f=>f.points.flat().every(Number.isFinite)));
 assert.ok(Math.abs(faces.reduce((sum,f)=>sum+area(f.points),0)-area(outline))<.001);
 for(const face of flat){assert.ok(face.points.every(p=>Math.abs(p[2]-19.8)<.001));assert.equal(face.points.length,4,'straight quadrilateral strip');}
});

test('Westhampton renders only joined roof ranges, without a detached raised overlay',()=>{
 const outline=buildingShape('Westhampton Hall').outline,faces=[];
 renderWesthamptonRoof(outline,100,(points,fill,extra)=>{assert.ok(points.flat().every(Number.isFinite));faces.push({points,extra});return '';},()=>'');
 assert.equal(faces.length,westhamptonRoofFaces(outline).length);
 assert.ok(faces.every(f=>f.points.every(p=>p[2]<=119.8+1e-7)));
 assert.ok(faces.every(f=>!f.extra.includes('cross-gable')));
 assert.ok(Math.abs(faces.reduce((sum,f)=>sum+area(f.points),0)-area(outline))<.001);
});
