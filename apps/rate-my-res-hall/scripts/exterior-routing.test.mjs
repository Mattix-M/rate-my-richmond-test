import test from 'node:test';
import assert from 'node:assert/strict';
import {exteriorModelMarkup} from '../exterior-models.js';
test('architectural overrides keep different residence families distinct',()=>{
 for(const [name,family] of [['North Court','north'],['Residence Hall No. 1','jeter'],['Wood Hall','wood'],['Robins Hall','robins'],['University Forest Apartments','forest'],['Gateway Village Apartments','gateway'],['Gray Court','gray']]){
  assert.ok(exteriorModelMarkup(name,{floorCount:3}).includes(`exterior-model--${family}`),name);
 }
});
