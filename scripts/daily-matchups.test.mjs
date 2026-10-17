import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const {outputText}=ts.transpileModule(fs.readFileSync(new URL('../src/lib/daily-matchups.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const g=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const pool=JSON.parse(fs.readFileSync(new URL('../src/lib/course-game.json',import.meta.url),'utf8'));
test('a full year of daily games has five distinct, well-separated, sufficiently reviewed pairs',()=>{
 for(let n=0;n<366;n++){const day=new Date(Date.parse('2026-10-16T12:00:00Z')+n*86400000).toISOString().slice(0,10),pairs=g.dailyMatchups(pool,day);
 assert.equal(pairs.length,5);assert.equal(new Set(pairs.flatMap(p=>[p.a.code,p.b.code])).size,10);
 for(const pair of pairs){assert.ok(pair.a.count>=20&&pair.b.count>=20);assert.ok(Math.abs(pair.a.difficulty-pair.b.difficulty)>=.4);for(const course of [pair.a,pair.b]){assert.ok(course.title.trim());assert.equal(course.sourceUrl,'https://catalog.richmond.edu/courses/'+course.code);}}
 assert.deepEqual(g.dailyMatchups([...pool].reverse(),day),pairs);
 }
});
test('Richmond midnight controls the day, including a daylight-saving transition',()=>{
 assert.equal(g.richmondDay(new Date('2026-10-17T03:59:00Z')),'2026-10-16');assert.equal(g.richmondDay(new Date('2026-10-17T04:00:00Z')),'2026-10-17');
 assert.equal(g.richmondDay(new Date('2026-11-02T04:59:00Z')),'2026-11-01');assert.equal(g.richmondDay(new Date('2026-11-02T05:00:00Z')),'2026-11-02');
});
test('invalid or extra saved picks do not become completed games; scoring uses raw means',()=>{
 const pairs=g.dailyMatchups(pool,'2026-10-16');assert.deepEqual(g.restorePicks(['a','x','b'],pairs),['a']);assert.deepEqual(g.restorePicks({a:1},pairs),[]);assert.equal(g.restorePicks(Array(10).fill('a'),pairs).length,5);
 assert.equal(g.resultScore(pairs.map(g.correctChoice),pairs),5);assert.equal(g.edition('2026-10-16'),1);
});
