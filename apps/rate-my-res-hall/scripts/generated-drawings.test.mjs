import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanPlanManifestFiles} from '../clean-plan-assets.js';
const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const housing=read('data/housing/index.json');
const layouts=read('data/housing/room-layouts.json').rooms;
const manifests=['clean-vector-assets.json','clean-raster-assets.json'].map(name=>read(`data/housing/${name}`));
const plans=new Map(Object.values(housing.places).flatMap(p=>p.plans).map(p=>[p.id,p]));
const pageKeys=[...plans.values()].flatMap(p=>p.pages.map(page=>`${p.id}:${page.page}`));
const entries=kind=>manifests.flatMap(m=>Object.entries(m[kind]));
const manualManifests=cleanPlanManifestFiles.filter(file=>file.startsWith('clean-plans/manual-')).map(file=>read(`data/housing/${file}`));

function sourceFor(asset,label){
 const plan=plans.get(asset.planId);assert.ok(plan,`${label}: unknown source plan`);
 assert.equal(asset.sourceSha256,plan.sha256,`${label}: stale source hash`);
 const page=plan.pages.find(p=>p.page===asset.pageNumber);assert.ok(page,`${label}: unknown source page`);
 return page;
}

test('Generated floor drawings retain exact page identity and coordinate aspect',()=>{
 const seen=new Set();
 for(const [key,asset] of entries('pages')){
  assert.ok(!seen.has(key),`${key}: competing floor generators`);seen.add(key);
  assert.equal(key,`${asset.planId}:${asset.pageNumber}`);
  const page=sourceFor(asset,key);
  assert.ok(Math.abs(asset.width/page.width-asset.height/page.height)<.001,`${key}: changed floor coordinate aspect`);
 }
});

test('Generated room drawings join reviewed source bounds and display orientation',()=>{
 const seen=new Set();
 for(const [id,asset] of entries('rooms')){
  assert.ok(!seen.has(id),`${id}: competing room generators`);seen.add(id);
  const layout=layouts[id];assert.ok(layout,`${id}: no reviewed mapping`);
  assert.equal(layout.status,'reviewed');sourceFor(asset,id);
  assert.equal(asset.planId,layout.planId);assert.equal(asset.pageNumber,layout.page);
  assert.equal(asset.sourceSha256,layout.sourceSha256);
  assert.deepEqual(asset.bounds,layout.bounds,`${id}: changed reviewed room bounds`);
  const expected=layout.width/layout.height,actual=asset.width/asset.height;
  // Reviewed crops already contain displayRotation. Allow crop rounding at the lower output resolution.
  const tolerance=Math.max(.015,3/Math.min(asset.width,asset.height));
  assert.ok(Math.abs(actual/expected-1)<tolerance,`${id}: wrong crop aspect/rotation (${actual} vs ${expected})`);
 }
});

test('Generated and manual SVG assets are finite vectors without active or embedded image content',()=>{
 for(const [id,a] of [...entries('pages'),...entries('rooms'),...manualManifests.flatMap(m=>[...Object.entries(m.rooms||{}),...Object.entries(m.pages||{})])]){
  assert.ok(Number.isFinite(a.width)&&a.width>0&&Number.isFinite(a.height)&&a.height>0,id);
  assert.ok(a.url.startsWith('./data/housing/clean-plans/'),`${id}: unexpected asset location`);
  const svg=readFileSync(new URL(a.url,root),'utf8');
  assert.match(svg,/<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="[^"]+"/);
  assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b/i,`${id}: embedded content`);
  assert.doesNotMatch(svg,/\son[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["'](?:https?:|data:|javascript:)/i,id);
  const geometry=[...svg.matchAll(/\b(?:d|points|viewBox|transform|x|y|width|height|cx|cy|r|rx|ry)="([^"]*)"/g)].map(m=>m[1]);
  for(const value of geometry)assert.doesNotMatch(value,/NaN|Infinity|undefined|null/,`${id}: nonfinite geometry`);
 }
});

test('Every published page and reviewed room has a generated asset or an explicit fallback reason',()=>{
 const generatedPages=new Set(entries('pages').map(([key])=>key));
 const pageFallbacks=new Map(manifests.flatMap(m=>m.report.pageAudit).filter(a=>a.status==='skipped'&&a.reason?.trim()).map(a=>[`${a.planId}:${a.page}`,a.reason]));
 const generatedRooms=new Set(entries('rooms').map(([id])=>id));
 const roomFallbacks=new Map(manifests.flatMap(m=>m.report.skippedRooms).filter(a=>a.reason?.trim()).map(a=>[a.recordId,a.reason]));
 assert.equal(pageKeys.length,97);assert.equal(Object.keys(layouts).length,1436);
 for(const key of pageKeys)assert.ok(generatedPages.has(key)||pageFallbacks.has(key),`${key}: missing drawing coverage decision`);
 for(const id of Object.keys(layouts))assert.ok(generatedRooms.has(id)||roomFallbacks.has(id),`${id}: missing room coverage decision`);
 for(const id of roomFallbacks.keys())assert.ok(layouts[id],`${id}: fallback for unknown room`);
});

test('Manual redraws preserve reviewed crop identity and the shared 007/009 source',()=>{
 const manuals=manualManifests.map(manifest=>manifest.rooms||{});
 const seen=new Set();
 for(const rooms of manuals)for(const [id,asset] of Object.entries(rooms)){
  assert.ok(!seen.has(id),`${id}: competing manual traces`);seen.add(id);
  const layout=layouts[id];assert.ok(layout);assert.equal(layout.status,'reviewed');
  sourceFor(asset,id);assert.equal(asset.planId,layout.planId);assert.equal(asset.pageNumber,layout.page);
  assert.equal(asset.sourceSha256,layout.sourceSha256);assert.deepEqual(asset.bounds,layout.bounds);
  assert.ok(Math.abs((asset.width/asset.height)/(layout.width/layout.height)-1)<.005,`${id}: changed manual crop aspect`);
  assert.equal(asset.renderKind,'manual-trace');
  if(asset.contentBounds){
   const b=asset.contentBounds;
   assert.equal(b.length,4,`${id}: invalid focus bounds`);
   assert.ok(b.every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&b[0]<b[2]&&b[1]<b[3],`${id}: focus outside original crop`);
  }
  const svg=readFileSync(new URL(asset.url,root),'utf8');
  assert.match(svg,/<svg\b/);assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b/i);
  const viewBox=svg.match(/viewBox="([^"]+)"/)[1].trim().split(/[ ,]+/).map(Number);
  assert.ok(Math.abs((viewBox[2]/viewBox[3])/(asset.width/asset.height)-1)<.005,`${id}: SVG canvas differs from manifest aspect`);
 }
 const west=manuals[1],seven=west['room-description-0762'],nine=west['room-description-0763'];
 assert.equal(seven.url,nine.url,'007 and 009 must retain their shared source drawing');
 assert.deepEqual(seven.bounds,nine.bounds);
 const shared=readFileSync(new URL(seven.url,root),'utf8');
 for(const label of ['007','009','007R'])assert.ok(shared.includes(label),`Shared trace missing ${label}`);
});


test('Reviewed floor overviews retain the original coordinate system and valid fit bounds',()=>{
 for(const [key,asset] of manualManifests.flatMap(m=>Object.entries(m.pages||{}))){
  const page=sourceFor(asset,key);
  assert.equal(key,`${asset.planId}:${asset.pageNumber}`);
  assert.ok(Math.abs(asset.width/page.width-asset.height/page.height)<.001,`${key}: changed floor aspect`);
  assert.ok(['reviewed-source-vectors','reviewed-scan-overview','manual-trace','semantic-floor-redraw'].includes(asset.renderKind));
  const bounds=asset.contentBounds;
  assert.equal(bounds.length,4);
  assert.ok(bounds.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
  assert.ok(bounds[0]<bounds[2]&&bounds[1]<bounds[3]);
 }
});
