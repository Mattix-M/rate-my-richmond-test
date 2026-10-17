export type GameCourse = {code: string; title: string; sourceUrl: string; department?: string; count: number; difficulty: number; latest: string};
export type Matchup = {a: GameCourse; b: GameCourse};
// The title-verified pool changes the matchups; keep earlier results separate.
export const MATCHUP_VERSION = 'course-matchups-v2-titles';
export const MATCHUP_EPOCH = '2026-10-16';
export function richmondDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(t=>parts.find(p=>p.type===t)!.value).join('-');
}
export function edition(day: string) {return Math.floor((Date.parse(day+'T12:00:00Z')-Date.parse(MATCHUP_EPOCH+'T12:00:00Z'))/86400000)+1;}
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function dailyMatchups(pool: GameCourse[], day: string): Matchup[] {
  const sorted=[...pool].sort((a,b)=>hash(day+':'+a.code)-hash(day+':'+b.code)||a.code.localeCompare(b.code));
  const used=new Set<string>(),pairs:Matchup[]=[];
  for(const a of sorted){if(used.has(a.code))continue;const b=sorted.find(c=>!used.has(c.code)&&c.code!==a.code&&Math.abs(c.difficulty-a.difficulty)>=.4);if(!b)continue;used.add(a.code);used.add(b.code);pairs.push(hash(day+a.code)%2?{a,b}:{a:b,b:a});if(pairs.length===5)break;}
  return pairs;
}
export function correctChoice(pair:Matchup){return pair.a.difficulty>pair.b.difficulty?'a':'b';}
export function restorePicks(raw: unknown, pairs:Matchup[]): ('a'|'b')[] {
  if(!Array.isArray(raw))return [];const result:('a'|'b')[]=[];
  for(const p of raw){if(result.length>=pairs.length||p!=='a'&&p!=='b')break;result.push(p);}return result;
}
export function resultScore(picks:('a'|'b')[],pairs:Matchup[]){return picks.reduce((n,p,i)=>n+Number(p===correctChoice(pairs[i])),0);}
