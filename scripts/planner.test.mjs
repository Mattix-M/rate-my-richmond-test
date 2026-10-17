import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/lib/planner.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const p=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const section=(id,course,days,start,end)=>({id,course,section:id,title:'',instructor:'',location:'',meetings:[{days,start,end}]});
const prefs=p.DEFAULT_PREFERENCES;
test('back-to-back classes work; same-day overlaps do not; different days work',()=>{
 const a=section('a','ECON101',[0,2],540,590),b=section('b','CHEM141',[0],590,650),c=section('c','CHEM141',[2],580,630);
 assert.equal(p.sectionsConflict(a,b),false);assert.equal(p.sectionsConflict(a,c),true);
 assert.equal(p.sectionsConflict(a,section('d','MATH211',[1],540,590)),false);
});
test('generator explores alternatives and never returns a conflicting combination',()=>{
 const rows=[section('a','ECON101',[0],540,600),section('b','ECON101',[1],540,600),section('c','CHEM141',[0],570,620),section('d','CHEM141',[2],540,600)];
 const result=p.generateSchedules(rows,['ECON101','CHEM141'],prefs);
 assert.equal(result.schedules.length,3);
 for(const schedule of result.schedules){assert.equal(schedule.length,2);assert.equal(p.sectionsConflict(...schedule),false);}
});
test('all meeting rows participate in conflict checks, including labs',()=>{
 const a=section('a','CHEM141',[0],540,600);a.meetings.push({days:[3],start:780,end:900});
 const b=section('b','MATH211',[3],840,900);
 assert.equal(p.generateSchedules([a,b],['CHEM141','MATH211'],prefs).schedules.length,0);
});
test('locks, Friday, earliest start, latest end and recurring unavailable times are enforced',()=>{
 const rows=[section('a','ECON101',[4],540,600),section('b','ECON101',[1],660,720),section('c','ECON101',[1],780,840)];
 assert.deepEqual(p.generateSchedules(rows,['ECON101'],{...prefs,freeFriday:true,earliest:720,latest:900}).schedules.map(s=>s[0].id),['c']);
 assert.equal(p.generateSchedules(rows,['ECON101'],{...prefs,freeFriday:true},[],['a']).schedules.length,0);
 const blocks=[{id:'lunch',title:'Lunch',days:[1],start:660,end:720}];
 assert.equal(p.generateSchedules(rows,['ECON101'],{...prefs,freeFriday:true},blocks).schedules[0][0].id,'c');
});
test('parser reads military/12-hour times, rejects impossible times and handles Thursday',()=>{
 assert.equal(p.parseTime('12:00 AM'),0);assert.equal(p.parseTime('12:30 PM'),750);assert.equal(p.parseTime('0900'),540);assert.equal(p.parseTime('1:30 PM'),810);
 for(const bad of ['25:00','09:70','0:30 PM','TBA',''])assert.equal(p.parseTime(bad),null);
 assert.deepEqual(p.parseDays('Tue Thu'),[1,3]);assert.deepEqual(p.parseDays('Thursday'),[3]);assert.deepEqual(p.parseDays('MWF'),[0,2,4]);assert.deepEqual(p.parseDays('TBA'),[]);
});
test('quoted CSV and TSV preserve text; meeting rows merge; unplaceable rows are reported',()=>{
 const text='CRN,Subject,Course Number,Section,Title,Days,Begin Time,End Time\r\n123,ECON,101,01,"Money, mostly",MW,09:00,09:50\r\n123,ECON,101,01,"Money, mostly",F,10:00,10:50\r\n124,MATH,211,02,Calculus,TBA,TBA,TBA';
 const result=p.importSections(text);assert.equal(result.sections.length,1);assert.equal(result.sections[0].title,'Money, mostly');assert.equal(result.sections[0].meetings.length,2);assert.equal(result.warnings.length,1);
 assert.equal(p.importSections('course\tsection\tdays\tstart\tend\nECON101\t01\tTR\t09:00\t10:15').sections.length,1);
 assert.throws(()=>p.importSections('course,section,days,start,end\nECON101,01,M,10:00,09:00'));
 assert.throws(()=>p.parseTable('course,title\nECON101,"unfinished'));
});
test('conflicting identifiers and overlapping linked rows fail instead of guessing',()=>{
 assert.throws(()=>p.importSections('crn,course,section,days,start,end\n12,ECON101,01,M,09:00,09:50\n12,MATH211,01,T,09:00,09:50'));
 assert.throws(()=>p.importSections('course,section,days,start,end\nECON101,01,M,09:00,10:00\nECON101,01,M,09:30,10:30'));
});
const base={version:1,sections:[section('a','ECON101',[0],540,600)],courses:['ECON101'],locks:[],blocks:[],preferences:prefs,startDate:'',endDate:'',source:'Test'};
test('plan import validates structure and does not accept unknown selected courses or invalid dates',()=>{
 assert.deepEqual(p.readPlan(JSON.stringify(base)),base);
 for(const change of [{sections:[{}]},{courses:['FAKE101']},{preferences:{...prefs,earliest:1400,latest:500}},{blocks:[{days:[8],start:1,end:5}]},{startDate:'2026-99-99'}])assert.throws(()=>p.readPlan(JSON.stringify({...base,...change})));
});
test('calendar starts on the first matching weekday, escapes values, handles DST and includes final evenings',()=>{
 const s=section('a','ECON101',[0,2],1140,1200);s.location='Room, A; North';s.title='Money\nMarkets';
 const ics=p.calendarText([s],'2026-10-17','2026-12-07',new Date('2026-10-16T12:00:00Z'));
 const unfolded=ics.replace(/\r\n /g,'');
 assert.match(unfolded,/DTSTART;TZID=America\/New_York:20261019T190000/);
 assert.match(unfolded,/UNTIL=20261208T045959Z/);assert.match(unfolded,/BEGIN:VTIMEZONE/);assert.match(unfolded,/LOCATION:Room\\, A\\; North/);assert.match(unfolded,/Money\\nMarkets/);
 assert.match(p.calendarText([s],'2026-08-01','2026-08-31').replace(/\r\n /g,''),/UNTIL=20260901T035959Z/);
 assert.throws(()=>p.calendarText([s],'2026-02-30','2026-05-01'));assert.throws(()=>p.calendarText([s],'2026-10-18','2026-10-18'));
});
test('calendar line folding preserves Unicode and keeps physical lines within 75 octets',()=>{
 const s=section('a','ECON101',[0],540,600);s.title='é'.repeat(200);
 const ics=p.calendarText([s],'2026-10-19','2026-12-07');
 assert.ok(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));assert.ok(ics.replace(/\r\n /g,'').includes(s.title));
});
test('bounded search reports truncated results for huge option spaces',()=>{
 const rows=[];const codes=[];for(let n=0;n<6;n++){const code='TEST'+(100+n);codes.push(code);for(let j=0;j<20;j++)rows.push(section(`${n}-${j}`,code,[n],540,600));}
 const r=p.generateSchedules(rows,codes,prefs);assert.equal(r.truncated,true);assert.equal(r.checked,100000);assert.ok(r.schedules.length<=12);
});
