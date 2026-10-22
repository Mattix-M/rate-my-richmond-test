import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlannerScene } from '../dorm-planner-scene.js';
import { plannerRooms, furnitureCatalog } from '../dorm-planner-data.js';

test('3D renderer produces finite mesh geometry for both source-traced rooms and every furniture type', () => {
  const original = Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame','ResizeObserver','getComputedStyle'].map(k=>[k,globalThis[k]]));
  let queued, mesh, draws=0;
  const gl = new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,bufferData:(_target,data)=>{mesh=data;},drawArrays:()=>draws++}, {get:(target,key)=>key in target?target[key]:()=>({})});
  let canvas;
  const element = tag => {const handlers={};const node=({tag,handlers,style:{},children:[],setAttribute(){},append(node){this.children.push(node);},replaceChildren(){this.children=[];},remove(){},addEventListener(name,fn){handlers[name]=fn;},removeEventListener(){},setPointerCapture(){},getContext:()=>gl,getBoundingClientRect:()=>({width:900,height:600,left:0,top:0})});if(tag==='canvas')canvas=node;return node;};
  try {
    globalThis.document={createElement:element};globalThis.window={devicePixelRatio:1};globalThis.requestAnimationFrame=fn=>{queued=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.getComputedStyle=()=>({position:'relative'});
    let commits=0;const scene=createPlannerScene(element('div'),{onMove:()=>commits++});
    for(const room of plannerRooms){scene.setRoom(room);scene.setItems(furnitureCatalog.map((item,i)=>({...item,id:`item-${i}`,x:3+i*.5,z:4,rotation:45})), 'item-0');queued();assert.ok(mesh.length>1000);assert.ok([...mesh].every(Number.isFinite));scene.setView('top');queued();assert.ok([...mesh].every(Number.isFinite));}
    assert.equal(draws,plannerRooms.length*2);
    scene.setRoom({width:14,depth:14,height:8});scene.setView('top');scene.setItems([{id:'test',type:'dresser',x:7,z:7,width:3,depth:3,height:2,color:'#123456'}]);queued();const baseline=[...mesh];
    const event=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,pointerType:'touch',button:0});
    canvas.handlers.pointerdown(event(450,300));canvas.handlers.pointermove(event(510,300));queued();assert.notDeepEqual([...mesh],baseline,'drag visibly moves the furniture');
    canvas.handlers.pointercancel(event(510,300));queued();assert.deepEqual([...mesh],baseline,'cancellation restores original geometry');assert.equal(commits,0,'cancel does not commit a move');
    canvas.handlers.pointerdown(event(450,300));canvas.handlers.pointermove(event(510,300));queued();canvas.handlers.pointerdown(event(600,300,2));queued();assert.deepEqual([...mesh],baseline,'switching to pinch restores the pending furniture drag');canvas.handlers.pointerup(event(600,300,2));canvas.handlers.pointerup(event(510,300));assert.equal(commits,0,'pinch transition does not commit the interrupted move');
    scene.dispose();
  } finally {for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
