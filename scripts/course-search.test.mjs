import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchesCourse} from '../src/lib/course-data.ts';

const index = JSON.parse(readFileSync(new URL('../public/courses-index.json', import.meta.url), 'utf8'));
test('search finds catalog names, partial words, codes, and mixed name/code queries', () => {
  const econ = index.courses.find(c => c.code === 'ECON101');
  assert(econ.titles.includes('Principles of Microeconomics'));
  for (const query of ['ECON101', 'econ 101', 'econ-101', 'microeconomics', 'micro econ', 'principles micro', '101 micro', '']) assert(matchesCourse(econ, query), query);
  for (const query of ['calculus', 'ECON102', 'macroeconomics']) assert.equal(matchesCourse(econ, query), false, query);
  assert(matchesCourse({code: 'LANG301', titles: ['Littérature française']}, 'litterature francaise'));
});
test('untitled historical review labels still work by code without inferred aliases', () => {
  const course = index.courses.find(c => !c.titles.length);
  assert(course);
  assert(matchesCourse(course, course.code));
  assert.equal(matchesCourse({code: 'BIO101', titles: []}, 'BIOL101'), false);
});
test('verified title coverage does not change archived review totals or the game pool', () => {
  assert.equal(index.courses.reduce((n, c) => n + c.all.count, 0), index.meta.indexedReviews);
  assert.equal(index.courses.filter(c => c.titles.length).length, index.meta.namedCourseCount);
  assert(index.meta.namedCourseCount > 300);
  for (const course of index.courses) {
    assert.equal(new Set(course.titles).size, course.titles.length);
    for (const title of course.titles) assert(title.length > 1 && title.length <= 180 && !title.includes('Subject code'));
    if (course.titles.length) assert(course.titleSourceUrl.startsWith('https://'));
  }
  const game = JSON.parse(readFileSync(new URL('../src/lib/course-game.json', import.meta.url), 'utf8'));
  assert.equal(game.length, 57);
});
