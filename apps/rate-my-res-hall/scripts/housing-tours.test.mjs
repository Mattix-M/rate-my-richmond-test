import test from 'node:test';
import assert from 'node:assert/strict';
import {housingTours,tourForHall,findTours} from '../housing-tours.js';
import {hallGuideMarkup} from '../hall-guide.js';
test('university directory has 17 distinct hall tours and no invented law-house coverage',()=>{
 assert.equal(housingTours.length,17);assert.equal(new Set(housingTours.map(t=>t.placeId)).size,17);
 for(const tour of housingTours){assert.match(tour.url,/^https:\/\/tours\.vividmediany\.com\/3d-model\/richmond-[a-z0-9-]+\/fullscreen\/$/);assert.ok(tour.scope.includes('Example unit'));}
 assert.equal(tourForHall('572483'),null);assert.equal(tourForHall('572484'),null);
 assert.equal(findTours(' ufa ')[0].placeId,'572061');assert.equal(findTours('LoRo')[0].placeId,'571574');assert.equal(findTours('unlisted hall').length,0);
});
test('hall guide points to its correct example tour and does not invent tours for other buildings',()=>{
 const north=hallGuideMarkup({id:'571760'});assert.ok(north.includes(tourForHall('571760').url));assert.ok(north.includes('example unit'));
 assert.ok(!hallGuideMarkup({id:'572483'}).includes('3D tour'));
});
