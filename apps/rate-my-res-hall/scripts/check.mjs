import {cleanPlanAssets, cleanPlanManifestFiles} from '../clean-plan-assets.js';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root=new URL('../',import.meta.url);
for(const file of ['game.html','game.css','game.js','stats.html','stats.css','stats.js','site-navigation.css','smooth-map-zoom.js','residence-arrival.js','index.html','style.css','app.js','plans.js','building-explorer.js','clean-plan-assets.js','server.mjs','vendor/leaflet.js','vendor/leaflet.css','icon.svg','data/places.json','data/campus.geojson','data/manifest.json']) await access(new URL(file,root));
for(const file of ['game.js','stats.js','smooth-map-zoom.js','residence-arrival.js','app.js','plans.js','building-explorer.js','clean-plan-assets.js','server.mjs']) execFileSync(process.execPath,['--check',new URL(file,root).pathname]);
for(const file of ['places.json','campus.geojson','manifest.json','housing/index.json','apartment-buildings.json']) JSON.parse(await readFile(new URL(`data/${file}`,root),'utf8'));
const housing=JSON.parse(await readFile(new URL('data/housing/index.json',root),'utf8'));
const layouts=JSON.parse(await readFile(new URL('data/housing/room-layouts.json',root),'utf8'));
for(const file of ['room-descriptions.json','source-room-records.json','room-source-exceptions.json','room-labels.json','room-layout-coverage.json']) JSON.parse(await readFile(new URL(`data/housing/${file}`,root),'utf8'));
const assets=new Set(Object.values(housing.places).flatMap(e=>e.plans.flatMap(p=>[p.originalUrl,...p.pages.map(page=>page.url)])));
for(const layout of Object.values(layouts.rooms))assets.add(layout.url);
for(const asset of [...Object.values(cleanPlanAssets.pages),...Object.values(cleanPlanAssets.rooms)])assets.add(asset.url);
for(const file of cleanPlanManifestFiles){const generated=JSON.parse(await readFile(new URL('data/housing/'+file,root),'utf8'));for(const asset of [...Object.values(generated.pages||{}),...Object.values(generated.rooms||{})])assets.add(asset.url);}
JSON.parse(await readFile(new URL('data/housing/drawing-inventory.json',root),'utf8'));
await access(new URL('hall-explorer.css',root));
for(const asset of assets)await access(new URL(asset,root));
console.log(`Validated ${assets.size} local source, floor-preview and room-layout assets.`);
console.log('Asset validation passed: local references, JavaScript and JSON are valid.');
