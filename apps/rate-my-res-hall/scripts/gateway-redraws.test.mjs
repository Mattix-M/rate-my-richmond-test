import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanPlanManifestFiles} from '../clean-plan-assets.js';
const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
test('all 24 Gateway pages default to semantic redraws with source-aligned room labels',()=>{
 const pages={};for(const file of cleanPlanManifestFiles)Object.assign(pages,read('data/housing/'+file).pages||{});
 const plans=read('data/housing/index.json').places['572073'].plans;
 const rooms=Object.values(read('data/housing/room-layouts.json').rooms);
 assert.equal(plans.length,24);
 for(const plan of plans)for(const page of plan.pages){
  const asset=pages[`${plan.id}:${page.page}`];assert.equal(asset?.renderKind,'semantic-floor-redraw',plan.label);
  assert.equal(asset.sourceSha256,plan.sha256);assert.equal(asset.width,page.width);assert.equal(asset.height,page.height);
  const svg=readFileSync(new URL(asset.url,root),'utf8');assert.doesNotMatch(svg,/<(?:image|script)\b/);
  for(const room of rooms.filter(r=>r.planId===plan.id))assert.ok(svg.includes(room.roomId),`${plan.label}: ${room.roomId}`);
 }
});
