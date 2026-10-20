import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanPlanAssets} from '../clean-plan-assets.js';
const root=new URL('../',import.meta.url);
const housing=JSON.parse(readFileSync(new URL('data/housing/index.json',root),'utf8'));
const layouts=JSON.parse(readFileSync(new URL('data/housing/room-layouts.json',root),'utf8'));
test('Clean drawings retain source identity and floor hotspot coordinates',()=>{
 for(const [key,asset] of Object.entries(cleanPlanAssets.pages)){
  const [id,page]=key.split(':');const plan=Object.values(housing.places).flatMap(p=>p.plans).find(p=>p.id===id);
  assert.ok(plan);assert.equal(asset.sourceSha256,plan.sha256);
  const preview=plan.pages.find(p=>p.page===Number(page));assert.ok(preview);
  assert.ok(Math.abs(asset.width/asset.height-preview.width/preview.height)<.001,'Full floor aspect ratio must retain hotspot alignment');
 }
 for(const [id,asset] of Object.entries(cleanPlanAssets.rooms)){
  assert.ok(layouts.rooms[id]);assert.equal(asset.sourceSha256,layouts.rooms[id].sourceSha256);
 }
 for(const asset of [...Object.values(cleanPlanAssets.pages),...Object.values(cleanPlanAssets.rooms)]){
  assert.ok(asset.width>0&&asset.height>0);const svg=readFileSync(new URL(asset.url,root),'utf8');
  assert.match(svg,/<svg\b/);assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<(?:image|script)\b/,'Redraws must remain native vectors');
 }
 assert.ok(cleanPlanAssets.rooms['room-description-0764']);
});
