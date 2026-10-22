import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {waterLocations} from '../water-locations.js';
import {printerLocations} from '../printer-locations.js';
import {filterAmenities} from '../map-amenities.js';
import {laundryHalls,rankedHalls,summarizeHall} from '../laundry-data.js';
const rows=[...waterLocations.map(x=>({...x,type:'water'})),...printerLocations.map(x=>({...x,type:'printer'}))];
test('amenity toggles stay independent and search honors active layers',()=>{
 assert.equal(filterAmenities(rows,new Set()).length,0);
 assert.equal(filterAmenities(rows,new Set(['water'])).length,36);
 assert.equal(filterAmenities(rows,new Set(['printer'])).length,11);
 assert.equal(filterAmenities(rows,new Set(['water','printer'])).length,47);
 const result=filterAmenities(rows,new Set(['printer']),' BOATWRIGHT ');
 assert.equal(result.length,1);assert.equal(result[0].printerCount,5);
 assert.equal(filterAmenities(rows,new Set(['water','printer']),'no-such-location').length,0);
});
test('amenity pins have unique identities, campus coordinates and source precision',()=>{
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 for(const row of rows){assert.ok(row.lat>37.56&&row.lat<37.60);assert.ok(row.lng> -77.56&&row.lng< -77.52);assert.match(row.sourceUrl,/^https:\/\//);assert.ok(row.locationPrecision);}
 assert.equal(printerLocations.reduce((sum,x)=>sum+x.printerCount,0),27);
 assert.equal(printerLocations.find(x=>x.name.includes('Gateway')).locationPrecision,'community');
});
test('laundry rankings use capacity per listed washer and leave missing data unknown',()=>{
 const ranked=rankedHalls();assert.equal(ranked[0].name,'Dennis Hall');assert.equal(ranked[0].residentsPerWasher,14);
 assert.equal(ranked[1].name,'Lakeview Hall');assert.equal(ranked[1].residentsPerWasher,14.1);
 assert.equal(ranked.filter(x=>x.residentsPerWasher===null).length,4);
 assert.equal(ranked.reduce((s,x)=>s+(x.washers??0),0),124);
 assert.equal(ranked.reduce((s,x)=>s+(x.dryers??0),0),133);
 const unknown=summarizeHall(laundryHalls.find(x=>x.name==='Atlantic House'));assert.equal(unknown.washers,null);
});
test('every primary page exposes Laundry and the new page marks it current',async()=>{
 for(const name of ['index','stats','room-compare','beta','game','data','laundry']){
 const html=await readFile(new URL(`../${name}.html`,import.meta.url),'utf8');assert.match(html,/href="laundry.html"/);
 if(name==='laundry')assert.match(html,/href="laundry.html" aria-current="page"/);
 }
});
