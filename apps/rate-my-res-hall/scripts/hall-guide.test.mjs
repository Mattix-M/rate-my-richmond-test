import test from 'node:test';
import assert from 'node:assert/strict';
import {hallGuideMarkup} from '../hall-guide.js';
import {housingProfiles} from '../housing-profiles.js';
import {readFile} from 'node:fs/promises';
const stats=JSON.parse(await readFile(new URL('../data/housing/residence-stats.json',import.meta.url)));
test('every residence has sourced selection guidance and unknown capacities stay unknown',()=>{
 for(const [id,s] of Object.entries(stats)){
  assert.ok(housingProfiles[id]?.eligibility,id);
  const html=hallGuideMarkup({id},s);
  assert.ok(html.includes(s.sourceUrl),id);
  if(s.capacity==null)assert.ok(html.includes('Not verified'),id);
 }
});
test('program placements distinguish mixed halls and official program eligibility',()=>{
 assert.match(housingProfiles['571574'].program.text,/other first-year/);
 assert.match(housingProfiles['571866'].program.text,/almost exclusively/);
 assert.equal(housingProfiles['571565'].program,undefined);
 assert.match(housingProfiles['571975'].eligibility,/First-year and returning/);
 assert.match(housingProfiles['572483'].eligibility,/Law/);
 for(const id of ['572061','572073'])assert.match(housingProfiles[id].selectionNote,/sophomore/);
});
test('record coverage is explicitly distinguished from capacity and full room count',()=>{
 const html=hallGuideMarkup({id:'571565'},stats['571565']);
 assert.match(html,/292/);assert.match(html,/146/);
 assert.match(html,/Mapped records, not a verified room total/);
 assert.match(html,/stats.html\?hall=571565#compare/);
});
test('profile markup escapes dynamic values',()=>{
 const html=hallGuideMarkup({id:'<script>'},{roomTypes:['<img>'],sourceUrl:'https://example.com/"'});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img>'));
});
