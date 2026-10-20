import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeQuiz,questionBank,shuffled} from '../game.js';
const stats=JSON.parse(readFileSync(new URL('../data/housing/residence-stats.json',import.meta.url)));
const research=JSON.parse(readFileSync(new URL('../data/housing/residence-stat-questions.json',import.meta.url)));
test('all ten bank questions have one answer, unique options, and university evidence',()=>{
 const rounds=questionBank(stats,research);
 assert.equal(rounds.length,10);assert.equal(new Set(rounds.map(q=>q.id)).size,10);
 for(const q of rounds){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(a=>a===q.correct).length,1);assert.ok(q.explanation);assert.ok(q.sources.length);for(const source of q.sources){const url=new URL(source);assert.equal(url.protocol,'https:');assert.ok(url.hostname.endsWith('.richmond.edu'));}}
});
test('capacity answers use published capacities, and historical explanations use verified records',()=>{
 const rounds=questionBank(stats,research),find=id=>rounds.find(q=>q.id===id);
 assert.equal(find('atlantic').correct,`${stats['572483'].capacity} residents`);
 assert.equal(find('gray-lora').correct,stats['571565'].capacity>stats['571574'].capacity?stats['571565'].name:stats['571574'].name);
 assert.equal(find('north').explanation,research.questions.find(q=>q.id==='new-old-north').answer);
 assert.equal(find('bedrooms').caveat,research.questions.find(q=>q.id==='apartment-comparison').caveat);
 assert.equal(stats['571872'].capacity,stats['571562'].capacity);
});
test('shuffle preserves inputs while varying order; missing evidence fails closed',()=>{
 const values=['a','b','c','d'];assert.deepEqual(values,['a','b','c','d']);assert.notDeepEqual(shuffled(values,()=>0),shuffled(values,()=>.999));assert.deepEqual(values,['a','b','c','d']);
 assert.throws(()=>makeQuiz({},research));assert.throws(()=>makeQuiz(stats,{questions:[]}));
});

test('replays draw five distinct questions from the larger bank',()=>{
 const first=makeQuiz(stats,research,()=>0),second=makeQuiz(stats,research,()=>.999);
 for(const run of [first,second]){assert.equal(run.length,5);assert.equal(new Set(run.map(q=>q.id)).size,5);}
 assert.notDeepEqual(new Set(first.map(q=>q.id)),new Set(second.map(q=>q.id)));
});
