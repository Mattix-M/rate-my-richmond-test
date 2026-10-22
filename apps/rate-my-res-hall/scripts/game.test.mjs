import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tourActions} from '../game.js';
import {scoreDorms,distanceMeters,saveHall,mealPlanFor,validateAnswers} from '../dorm-match.js';
const read=file=>JSON.parse(readFileSync(new URL(`../data/${file}`,import.meta.url)));
const places=read('places.json'),stats=read('housing/residence-stats.json');
const base={year:'junior',program:'none',group:'four',hosting:'elsewhere',privacy:'either',cooking:'dining',destination:'none',laundry:'neutral',priorities:[]};
const run=changes=>scoreDorms({...base,...changes},places,stats);
test('missing year and conflicting program fail closed',()=>{
 assert.ok(run({year:''}).error);assert.equal(run({year:''}).matches.length,0);
 assert.ok(run({program:'ssir'}).error);assert.ok(run({program:'endeavor'}).error);
 assert.ok(validateAnswers({...base,priorities:['hosting','laundry','privacy']}));
});
test('year and program eligibility gate the ranking before preferences',()=>{
 const first=run({year:'firstyear',hosting:'living',cooking:'regular'});
 assert.ok(first.matches.every(r=>!['572061','572073'].includes(r.id)));
 assert.deepEqual(run({year:'firstyear',program:'endeavor'}).matches.map(r=>r.id),['571574']);
 assert.deepEqual(run({year:'sophomore',program:'ssir'}).matches.map(r=>r.id),['571866']);
 assert.deepEqual(new Set(run({year:'law'}).matches.map(r=>r.id)),new Set(['572483','572484']));
 assert.ok(run({year:'sophomore'}).uncertain.some(r=>r.id==='571866'));
});
test('unformed apartment groups and unknown program rules stay out of confirmed results',()=>{
 const group=run({group:'forming',hosting:'living',cooking:'regular'});
 assert.ok(group.matches.every(r=>!r.apartment));assert.equal(group.uncertain.filter(r=>r.apartment).length,2);
 const unknown=run({program:'other'});assert.equal(unknown.matches.length,0);assert.ok(unknown.uncertain.length>0);
});
test('private bedroom plus separate living space distinguishes Gateway from UFA',()=>{
 const result=run({hosting:'living',privacy:'own',cooking:'regular',priorities:['hosting','privacy']});
 const gateway=result.matches.find(r=>r.id==='572073'),ufa=result.matches.find(r=>r.id==='572061');
 assert.equal(result.matches[0].id,'572073');assert.ok(gateway.score>ufa.score);
 assert.match(ufa.compromise,/double bedrooms/);assert.match(gateway.reasons.join(' '),/single bedrooms/);
});
test('laundry uses actual capacity ratios and never treats missing counts as zero',()=>{
 const result=run({year:'firstyear',laundry:'important',priorities:['laundry']});
 assert.equal(result.matches[0].id,'571561');assert.equal(result.matches[0].ratio,14);
 assert.equal(result.matches.find(r=>r.id==='571861').ratio,null);
 assert.match(result.matches.find(r=>r.id==='571861').compromise,/unavailable/);
});
test('distance uses campus pins and never outputs walking time',()=>{
 assert.equal(distanceMeters({lat:37,lng:-77},{lat:37,lng:-77}),0);
 assert.equal(distanceMeters(null,{}),null);
 const result=run({destination:'571951',priorities:['location']});
 const closest=Math.min(...result.matches.map(r=>r.meters));assert.equal(result.matches[0].meters,closest);
 for(const r of result.matches){assert.match(r.reasons.join(' '),/straight-line/);assert.ok(!/minute/.test(r.reasons.join(' ')));}
});
test('priorities have threefold weight; unselected preferences produce no personality claims',()=>{
 const result=run({hosting:'living',laundry:'important',priorities:['laundry']});
 assert.equal(result.matches[0].metrics.find(m=>m.key==='laundry').weight,3);
 assert.equal(result.matches[0].metrics.find(m=>m.key==='hosting').weight,1);
 assert.equal(run({}).hasPreferences,false);
});
test('shortlist saves append and remain idempotent',()=>{
 let value='["571561"]';const storage={getItem:()=>value,setItem:(key,v)=>{assert.equal(key,'res-hall-saved');value=v;}};
 assert.equal(saveHall(storage,'572073'),true);assert.equal(saveHall(storage,'572073'),true);
 assert.deepEqual(JSON.parse(value),['571561','572073']);
 assert.equal(saveHall({getItem(){throw new Error('blocked');}},'572073'),false);
});
test('meal plans distinguish apartment choice and law-house exceptions',()=>{
 assert.match(mealPlanFor('572061'),/no meal plan/);assert.match(mealPlanFor('572073'),/Spider 50/);
 assert.match(mealPlanFor('571561'),/Unlimited is required/);
 assert.match(mealPlanFor('572483'),/meal plan is required.*Spider 50/);
});

test('Endeavor does not advertise ordinary singles as a privacy match',()=>{
 const result=run({year:'firstyear',program:'endeavor',privacy:'own',priorities:['privacy']});
 assert.equal(result.matches.length,1);assert.match(result.matches[0].compromise,/Endeavor uses doubles/);
 assert.ok(!result.matches[0].reasons.some(reason=>/include singles/.test(reason)));
});

test('law houses without tours never link to a default apartment model',()=>{
 assert.deepEqual(tourActions('572483'),[]);assert.deepEqual(tourActions('572484'),[]);assert.deepEqual(tourActions('missing'),[]);
 const actions=tourActions('572061');assert.equal(actions.length,2);
 assert.ok(actions.every(action=>action.href.includes('hall=572061')));
});
