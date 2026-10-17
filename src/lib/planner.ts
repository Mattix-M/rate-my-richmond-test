export type Meeting = {days: number[]; start: number; end: number};
export type Section = {id: string; course: string; section: string; title: string; instructor: string; location: string; meetings: Meeting[]};
export type Preferences = {earliest: number; latest: number; freeFriday: boolean; compact: boolean};
export type Block = Meeting & {id: string; title: string};
export type Plan = {version: 1; sections: Section[]; courses: string[]; locks: string[]; blocks: Block[]; preferences: Preferences; startDate: string; endDate: string; source: string; selectedOption?: number};
export const DEFAULT_PREFERENCES: Preferences = {earliest: 480, latest: 1320, freeFriday: false, compact: true};
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function timeText(value: number) { const n=value%1440;return `${Math.floor(n / 60) % 12 || 12}:${String(n % 60).padStart(2, '0')} ${n < 720 ? 'AM' : 'PM'}`; }
export function parseTime(input: string): number | null {
  const value = input.trim().toUpperCase().replace(/\./g, '');
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/) || value.match(/^(\d{1,2})(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;
  let hour = Number(match[1]); const minute = Number(match[2]), meridiem = match[3];
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (meridiem) hour = hour % 12 + (meridiem === 'PM' ? 12 : 0);
  return hour * 60 + minute;
}
export function parseDays(input: string): number[] {
  let value = input.trim().toUpperCase();
  if (!value || /TBA|ARRANGED|ONLINE|ASYNCH/.test(value)) return [];
  value = value.replace(/MON(DAY)?/g,'M').replace(/TUE(SDAY)?/g,'T').replace(/WED(NESDAY)?/g,'W').replace(/THU(RSDAY)?/g,'R').replace(/FRI(DAY)?/g,'F').replace(/SAT(URDAY)?/g,'S').replace(/SUN(DAY)?/g,'U').replace(/TH/g,'R').replace(/TU/g,'T').replace(/[\s,;/]+/g,'');
  if (!/^[MTWRFSU]+$/.test(value)) return [];
  return [...new Set([...value].map(c => 'MTWRFSU'.indexOf(c)))].sort();
}
export function overlap(a: Meeting, b: Meeting) { return a.days.some(d => b.days.includes(d)) && a.start < b.end && b.start < a.end; }
export function sectionsConflict(a: Section, b: Section) { return a.meetings.some(x => b.meetings.some(y => overlap(x, y))); }
export function scheduleScore(sections: Section[], compact: boolean) {
  let gaps = 0, days = 0;
  for (let day = 0; day < 7; day++) {
    const meetings = sections.flatMap(s => s.meetings.filter(m => m.days.includes(day))).sort((a,b) => a.start-b.start);
    if (meetings.length) days++;
    for (let i=1; i<meetings.length; i++) gaps += Math.max(0, meetings[i].start-meetings[i-1].end);
  }
  return compact ? gaps + days * 30 : days * 30;
}
export function generateSchedules(sections: Section[], courses: string[], preferences: Preferences, blocks: Block[] = [], locks: string[] = []) {
  const codes = [...new Set(courses)];
  if (!codes.length || codes.length > 7) return {schedules: [] as Section[][], checked: 0, truncated: false, missing: codes.length > 7 ? ['Choose at most seven courses.'] : []};
  const options = codes.map(code => ({code, sections: sections.filter(s => s.course === code && (!locks.some(id=>sections.find(x=>x.id===id)?.course===code) || locks.includes(s.id)) && s.meetings.length > 0 && s.meetings.every(m => m.start >= preferences.earliest && m.end <= preferences.latest && (!preferences.freeFriday || !m.days.includes(4)) && blocks.every(b => !overlap(m,b))))}));
  const missing = options.filter(o=>!o.sections.length).map(o=>o.code);
  if (missing.length) return {schedules: [] as Section[][], checked: 0, truncated: false, missing};
  options.sort((a,b)=>a.sections.length-b.sections.length || a.code.localeCompare(b.code));
  const found: {rows: Section[]; score: number}[] = []; let checked=0, truncated=false;
  function visit(depth: number, selected: Section[]) {
    if (checked >= 100000) {truncated=true; return;}
    if (depth===options.length) {
      found.push({rows:[...selected].sort((a,b)=>a.course.localeCompare(b.course)),score:scheduleScore(selected,preferences.compact)});
      found.sort((a,b)=>a.score-b.score || a.rows.map(s=>s.id).join().localeCompare(b.rows.map(s=>s.id).join()));
      if(found.length>12)found.pop(); return;
    }
    for(const section of options[depth].sections) {
      if(checked>=100000){truncated=true;break;} checked++;
      if(selected.every(other=>!sectionsConflict(section,other)))visit(depth+1,[...selected,section]);
    }
  }
  visit(0,[]);
  return {schedules:found.map(x=>x.rows),checked,truncated,missing};
}
// RFC 4180 quoting; supports comma CSV and copied tab-separated spreadsheets.
export function parseTable(text: string): string[][] {
  const clean=text.replace(/^\uFEFF/,''); const delimiter=clean.split(/\r?\n/)[0].includes('\t')?'\t':',';
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<clean.length;i++){
    const c=clean[i];
    if(c==='"'){if(quoted&&clean[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===delimiter&&!quoted){row.push(cell.trim());cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&clean[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('An opening quote has no closing quote. Check the CSV file.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function importSections(text: string): {sections: Section[]; warnings: string[]} {
  if(text.length>2000000)throw new Error('Choose a file smaller than 2 MB.');
  const [header,...rows]=parseTable(text);if(!header||!rows.length)throw new Error('Include a header row and at least one section.');
  if(rows.length>5000)throw new Error('Import at most 5,000 meeting rows at a time.');
  const names=header.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,''));
  const col=(...keys:string[])=>names.findIndex(n=>keys.includes(n));
  const columns={course:col('course','coursecode'),subject:col('subject','subj'),number:col('coursenumber','coursenum','crse','crsenumb'),section:col('section','sect','seqnumb'),id:col('crn','id'),title:col('title','coursetitle'),instructor:col('instructor','professor','instructors','faculty'),location:col('location','room','building'),days:col('days','meetingdays'),start:col('start','starttime','begintime','begin'),end:col('end','endtime')};
  if((columns.course<0&&(columns.subject<0||columns.number<0))||columns.days<0||columns.start<0||columns.end<0)throw new Error('Required columns: course, section, days, start, end. You may use subject + course number instead of course.');
  const map=new Map<string,Section>(),warnings:string[]=[];
  rows.forEach((row,i)=>{
    const get=(key:keyof typeof columns)=>row[columns[key]]||'';
    const course=(columns.course>=0?get('course'):get('subject')+get('number')).toUpperCase().replace(/[\s-]+/g,'');
    const section=get('section')||get('id');
    const start=parseTime(get('start')),end=parseTime(get('end')),days=parseDays(get('days'));
    if(!/^[A-Z]{2,6}\d{3}[A-Z]?$/.test(course)||!section||start===null||end===null||end<=start||!days.length){warnings.push(`Row ${i+2}: missing or invalid course, section, days, or time. Not imported.`);return;}
    const id=get('id')||`${course}-${section}`,meeting={days,start,end};
    const existing=map.get(id);
    if(existing){if(existing.course!==course||existing.section!==section)throw new Error(`Row ${i+2}: ID ${id} is used by different sections.`);if(!existing.meetings.some(m=>JSON.stringify(m)===JSON.stringify(meeting)))existing.meetings.push(meeting);}
    else map.set(id,{id,course,section,title:get('title'),instructor:get('instructor'),location:get('location'),meetings:[meeting]});
  });
  const sections=[...map.values()];
  for(const section of sections)if(section.meetings.some((m,i)=>section.meetings.slice(i+1).some(other=>overlap(m,other))))throw new Error(`${section.course} ${section.section} has overlapping meeting rows.`);
  if(!sections.length)throw new Error('No usable sections found. Check the column names and use times such as 09:00 or 1:30 PM.');
  return {sections,warnings};
}
export function validSection(value: unknown): value is Section {
  if(!value||typeof value!=='object')return false;const s=value as Section;
  return typeof s.id==='string'&&s.id.length>0&&s.id.length<100&&typeof s.course==='string'&&/^[A-Z]{2,6}\d{3}[A-Z]?$/.test(s.course)&&['section','title','instructor','location'].every(k=>typeof s[k as keyof Section]==='string'&&(s[k as keyof Section] as string).length<=300)&&Array.isArray(s.meetings)&&s.meetings.length>0&&s.meetings.length<=20&&s.meetings.every(validMeeting)&&s.meetings.every((m,i)=>!s.meetings.slice(i+1).some(other=>overlap(m,other)));
}
function validMeeting(value: unknown): value is Meeting {
  if(!value||typeof value!=='object')return false;const m=value as Meeting;
  return Array.isArray(m.days)&&m.days.length>0&&m.days.length<=7&&new Set(m.days).size===m.days.length&&m.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&Number.isInteger(m.start)&&Number.isInteger(m.end)&&m.start>=0&&m.end<1440&&m.end>m.start;
}
export function validDate(value: string){const time=Date.parse(value+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;}
export function readPlan(raw: string): Plan {
  if(raw.length>2000000)throw new Error('Plan file is too large.');
  const p=JSON.parse(raw) as Plan;
  if(p?.selectedOption!==undefined&&(!Number.isInteger(p.selectedOption)||p.selectedOption<0||p.selectedOption>11))throw new Error('The saved schedule option is invalid.');
  if(!p||p.version!==1||!Array.isArray(p.sections)||p.sections.length>5000||!p.sections.every(validSection)||new Set(p.sections.map(s=>s.id)).size!==p.sections.length||!Array.isArray(p.courses)||p.courses.length>7||p.courses.some(c=>typeof c!=='string'||!p.sections.some(s=>s.course===c))||!Array.isArray(p.locks)||p.locks.some(id=>!p.sections.some(s=>s.id===id))||!Array.isArray(p.blocks)||p.blocks.length>30||p.blocks.some(b=>!validMeeting(b)||typeof b.title!=='string'||typeof b.id!=='string')||!p.preferences||!Number.isInteger(p.preferences.earliest)||!Number.isInteger(p.preferences.latest)||p.preferences.earliest<0||p.preferences.latest>1440||p.preferences.latest<=p.preferences.earliest||typeof p.preferences.freeFriday!=='boolean'||typeof p.preferences.compact!=='boolean'||typeof p.source!=='string'||typeof p.startDate!=='string'||typeof p.endDate!=='string'||(p.startDate!==''&&!validDate(p.startDate))||(p.endDate!==''&&!validDate(p.endDate)))throw new Error('This plan file is incomplete or invalid.');
  if(new Set(p.courses).size!==p.courses.length||new Set(p.locks.map(id=>p.sections.find(s=>s.id===id)!.course)).size!==p.locks.length)throw new Error('Select each course once and lock at most one section per course.');
  return p;
}
export function calendarText(sections: Section[], startDate: string, endDate: string, stamp=new Date()) {
  if(!validDate(startDate)||!validDate(endDate)||endDate<startDate||Date.parse(endDate)-Date.parse(startDate)>366*86400000)throw new Error('Choose valid semester dates, no more than a year apart.');
  const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const time=(m:number)=>`${String(Math.floor(m/60)).padStart(2,'0')}${String(m%60).padStart(2,'0')}00`;
  // End of the selected date in Richmond, including evening classes on the final day.
  const noon=new Date(endDate+'T12:00:00Z');
  const offsetName=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'shortOffset'}).formatToParts(noon).find(p=>p.type==='timeZoneName')!.value;
  const offset=Number(offsetName.match(/GMT([+-]?\d+)/)?.[1]||'-5');
  const until=new Date(Date.parse(endDate+'T00:00:00Z')+86400000-offset*3600000-1000).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Rate My Richmond//Schedule Lab//EN','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:America/New_York','BEGIN:DAYLIGHT','DTSTART:19700308T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU','TZOFFSETFROM:-0500','TZOFFSETTO:-0400','TZNAME:EDT','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:19701101T020000','RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU','TZOFFSETFROM:-0400','TZOFFSETTO:-0500','TZNAME:EST','END:STANDARD','END:VTIMEZONE'];
  let events=0;
  for(const section of sections)for(const [i,m] of section.meetings.entries()){
    const first=new Date(startDate+'T12:00:00Z');
    for(let n=0;n<7;n++){if(m.days.includes((first.getUTCDay()+6)%7))break;first.setUTCDate(first.getUTCDate()+1);}
    if(first.toISOString().slice(0,10)>endDate)continue;
    const date=first.toISOString().slice(0,10).replace(/-/g,'');events++;
    lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(section.id)}-${i}-${startDate}@ratemyrichmond.local`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=America/New_York:${date}T${time(m.start)}`,`DTEND;TZID=America/New_York:${date}T${time(m.end)}`,`RRULE:FREQ=WEEKLY;BYDAY=${m.days.map(d=>['MO','TU','WE','TH','FR','SA','SU'][d]).join(',')};UNTIL=${until}`,`SUMMARY:${escape(section.course+' '+section.section+(section.title?' · '+section.title:''))}`,`LOCATION:${escape(section.location)}`,`DESCRIPTION:${escape([section.instructor,'Unofficial plan. Confirm dates and sections in BannerWeb. Remove holidays and breaks in your calendar.'].filter(Boolean).join('\n'))}`,'END:VEVENT');
  }
  if(!events)throw new Error('No meetings fall within those dates.');
  lines.push('END:VCALENDAR');
  // Fold at 73 UTF-8 octets without splitting a Unicode code point.
  return lines.map(line=>{const parts:string[]=[];let part='',bytes=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(bytes+size>73){parts.push(part);part=' ';bytes=1;}part+=c;bytes+=size;}parts.push(part);return parts.join('\r\n');}).join('\r\n')+'\r\n';
}
