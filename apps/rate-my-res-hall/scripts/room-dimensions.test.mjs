import test from'node:test';import assert from'node:assert/strict';
import{parseRoomDimensions,compareRoomAreas}from'../room-dimensions.js';
import data from'../room-size-data.js';
test('parses explicitly marked feet and inches including Unicode primes',()=>{
 assert.deepEqual(parseRoomDimensions('13’6" x 14’6"'),{width:13.5,height:14.5,area:195.75});
 assert.equal(parseRoomDimensions('9′ × 13′').area,117);
 assert.equal(parseRoomDimensions('14’ x 13.5’').area,189);
 assert.equal(parseRoomDimensions('8\' 11″ x 13\' 10″').width,8+11/12);
});
test('excludes irregular, incomplete, ambiguous or typo dimensions',()=>{
 for(const raw of ['14’ x 14’ + 6’ x 8’','12’4"(Long);8’8"(Short) x 8’7"','9’ x 13','17’11" x 12"','13’6" x 14’6"’','14’2’ x 16’7’','19’5" x 11’11"- 1 Alcove','14’ x 13’- 2 Closets','12’15" x 13’',null,'0’ x 12’'])assert.equal(parseRoomDimensions(raw),null,raw);
});
test('area difference uses A as percentage baseline and handles equality and invalid areas',()=>{
 assert.deepEqual(compareRoomAreas(100,150),{difference:50,percent:50});assert.deepEqual(compareRoomAreas(100,100),{difference:0,percent:0});assert.equal(compareRoomAreas(0,100),null);assert.equal(compareRoomAreas(100,NaN),null);
});
test('published comparison records retain provenance and match strict source dimensions',()=>{
 assert.ok(data.halls.length>=15);const ids=new Set(),roomKeys=new Set();for(const h of data.halls)for(const r of h.rooms){assert.ok(!ids.has(r.id));ids.add(r.id);const key=h.id+':'+r.room;assert.ok(!roomKeys.has(key),'Duplicate hall/room '+key);roomKeys.add(key);assert.ok(!/^Room [AB]$/i.test(r.room),'Must retain full source room identifier');assert.ok(r.source.startsWith('https://residencelife.richmond.edu/'));assert.deepEqual(parseRoomDimensions(r.dimensions),{width:r.width,height:r.height,area:r.width*r.height});}
 assert.ok(ids.size>900);
});

test('Gray defaults remain labeled and suspect Moore double stays quarantined',()=>{const rooms=data.halls.flatMap(h=>h.rooms);assert.ok(!rooms.some(r=>r.id==='room-description-0231'));const gray=data.halls.find(h=>h.id==='gray-court');assert.ok(gray.rooms.length>50);for(const r of gray.rooms.filter(r=>r.basis==='published-type-default')){assert.equal(r.width,13);assert.equal(r.height,14);}});
