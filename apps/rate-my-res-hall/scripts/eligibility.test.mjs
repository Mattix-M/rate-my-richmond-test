import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHousing} from '../eligibility.js';
const first=['571561','571574','571575','571759','571861'];
const returning=['571565','571571','571573','571760','571570','571872','571562','571973'];
const all=[...first,...returning,'571866','571975','572483','572484','572061','572073'];
const status=(id,year,program='none')=>evaluateHousing(id,{year,program}).status;
test('unselected and unknown halls never receive a fit verdict',()=>{
 for(const id of all)assert.equal(status(id,''),null);
 assert.equal(status('unknown','junior'),null);
 assert.equal(status('571565','invented'),null);
});
test('all nineteen groups follow published first-year, returning, mixed and law populations',()=>{
 assert.equal(new Set(all).size,19);
 for(const id of first){assert.equal(status(id,'firstyear'),'match');for(const year of ['sophomore','junior','senior','law'])assert.equal(status(id,year),'notmatch');}
 for(const id of returning){assert.equal(status(id,'firstyear'),'notmatch');for(const year of ['sophomore','junior','senior'])assert.equal(status(id,year),'match');assert.equal(status(id,'law'),'notmatch');}
 for(const year of ['firstyear','sophomore','junior','senior'])assert.equal(status('571975',year),'match');
 for(const id of ['572483','572484']){assert.equal(status(id,'law'),'match');for(const year of ['firstyear','sophomore','junior','senior'])assert.equal(status(id,year),'notmatch');}
});
test('apartments require junior/senior status and explain four-person selection',()=>{
 for(const id of ['572061','572073']){
  for(const year of ['junior','senior']){assert.equal(status(id,year),'match');assert.match(evaluateHousing(id,{year}).reason,/four/);}
  for(const year of ['firstyear','sophomore','law'])assert.equal(status(id,year),'notmatch');
 }
});
test('SSIR is a sophomore program in South; nonparticipants require confirmation',()=>{
 assert.equal(status('571866','sophomore','ssir'),'match');
 for(const year of ['sophomore','junior','senior'])assert.equal(status('571866',year),'confirm');
 assert.equal(status('571866','firstyear'),'notmatch');
 for(const id of all.filter(id=>id!=='571866'))assert.equal(status(id,'sophomore','ssir'),'notmatch');
});
test('Endeavor lives in LoRo, which also accommodates other first-years',()=>{
 assert.equal(status('571574','firstyear','endeavor'),'match');assert.equal(status('571574','firstyear'),'match');
 for(const id of all.filter(id=>id!=='571574'))assert.equal(status(id,'firstyear','endeavor'),'notmatch');
});
test('contradictory program/year choices always require confirmation',()=>{
 for(const id of all){for(const year of ['sophomore','junior','senior','law'])assert.equal(status(id,year,'endeavor'),'confirm');for(const year of ['firstyear','junior','senior','law'])assert.equal(status(id,year,'ssir'),'confirm');}
});
test('every actionable verdict includes a primary source and does not promise availability',()=>{
 for(const id of all)for(const year of ['firstyear','sophomore','junior','senior','law']){
  const result=evaluateHousing(id,{year});assert.equal(new URL(result.sourceUrl).hostname.endsWith('.richmond.edu'),true);assert.ok(result.reason);assert.doesNotMatch(result.reason,/guaranteed|room available|you are eligible/i);
 }
 assert.equal(status(571565,'Junior'),'match');assert.equal(status('571574','first-year'),'match');
});
