import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rankOneStarCourses, zeroOneStarCourses, rankDifficultyCourses} from '../src/lib/statistics-research.ts';

const {research} = JSON.parse(readFileSync(new URL('../src/lib/insights.json', import.meta.url), 'utf8'));
const course = code => research.courses.find(c => c.code === code);

test('course statistics keep exact archive counts and separate periods', () => {
  assert.equal(course('MATH211').all.reviews, 221);
  assert.equal(course('MATH211').all.distribution[0], 46);
  assert.equal(course('CHEM205').all.reviews, 102);
  assert.equal(course('CHEM205').all.distribution[0], 4);
  assert.equal(course('MATH211').recent.reviews, 67);
  assert.equal(course('CHEM205').recent.reviews, 34);
  assert.equal(course('FREN221').all.distribution[0], 0);
  assert.equal(course('LAIS221').all.distribution[0], 1);
  assert.equal(course('PLSC250').all.distribution[0], 2);
  for (const c of research.courses) {
    assert.ok(c.all.reviews >= 30 && c.title);
    assert.ok(!c.code.startsWith('FYS') && !c.code.startsWith('CORE'));
    for (const s of [c.all, c.recent].filter(Boolean)) {
      assert.equal(s.distribution.reduce((a, b) => a + b, 0), s.reviews);
      const mean = s.distribution.reduce((n, count, i) => n + count * (i + 1), 0) / s.reviews;
      assert.ok(Math.abs(s.quality - mean) < 1e-10);
      assert.ok(s.professors > 0 && s.professors <= s.reviews);
    }
  }
});

test('one-star share and count rankings differ and enforce the current-period minimum', () => {
  assert.equal(rankOneStarCourses(research.courses, 'all', 'share')[0].code, 'CHEM317');
  assert.equal(rankOneStarCourses(research.courses, 'all', 'count')[0].code, 'ECON101');
  const recent = rankOneStarCourses(research.courses, 'recent', 'share');
  assert.equal(recent[0].code, 'MATH212');
  assert.ok(recent.every(c => c.recent.reviews >= 30));
  assert.ok(!recent.some(c => c.code === 'PHIL101'));
  const before = research.courses.map(c => c.code);
  rankOneStarCourses(research.courses, 'all', 'count');
  assert.deepEqual(research.courses.map(c => c.code), before);
});

test('GOATED courses have literally zero one-star reviews and 30+ selected-period reviews', () => {
  assert.deepEqual(zeroOneStarCourses(research.courses, 'all').map(c => c.code), ['FREN221', 'HS100', 'PSYC100']);
  assert.deepEqual(zeroOneStarCourses(research.courses, 'recent').map(c => c.code), ['PSYC200', 'HS100', 'PLSC250']);
  for (const p of ['all', 'recent']) {
    assert.ok(zeroOneStarCourses(research.courses, p).every(c => c[p].reviews >= 30 && c[p].distribution[0] === 0));
  }
  assert.deepEqual(zeroOneStarCourses([{code: 'EMPTY100', all: {reviews: 30, distribution: [0, 0, 0, 0, 30]}, recent: null}], 'recent'), []);
});

test('difficulty ranking uses selected-period means and excludes undersized recent samples', () => {
  const all = rankDifficultyCourses(research.courses, 'all');
  assert.deepEqual(all.slice(0, 3).map(c => c.code), ['ECON271', 'MATH245', 'ACCT301']);
  const recent = rankDifficultyCourses(research.courses, 'recent');
  assert.equal(recent[0].code, 'ECON271');
  assert.ok(!recent.some(c => c.code === 'MATH245')); // Only 29 recent reviews.
  assert.ok(recent.every(c => c.recent.reviews >= 30));
  for (let i = 1; i < recent.length; i++) assert.ok(recent[i - 1].recent.difficulty >= recent[i].recent.difficulty);
});

test('hard-course percentages use hard-review denominators', () => {
  const counts = {Mathematics: [376, 110], Chemistry: [305, 187], 'Political Science': [278, 195]};
  for (const [name, [total, positive]] of Object.entries(counts)) {
    const s = research.periods.all.hardDepartments.find(d => d.department === name);
    assert.equal(s.reviews, total);
    assert.equal(s.distribution[3] + s.distribution[4], positive);
  }
});

test('monthly counts exclude partial years and FYS stays separate', () => {
  const all = research.periods.all;
  assert.equal(all.monthlyReviews, 11824);
  assert.equal(all.monthlyYears, '2003–2025');
  assert.equal(all.months.reduce((sum, m) => sum + m.reviews, 0), all.monthlyReviews);
  assert.equal(all.peakMonthReviews, 1979 + 1566 + 2569);
  assert.equal((all.peakMonthReviews / all.monthlyReviews * 100).toFixed(1), '51.7');
  assert.equal(all.fys.reviews, 788);
  assert.equal(all.fys.professors, 167);
  assert.equal(course('ECON101').all.reviews, 505);
});

test('small recent within-professor samples cannot look like broad department evidence', () => {
  assert.deepEqual(research.periods.all.levels.map(d => d.professors), [10, 5]);
  assert.deepEqual(research.periods.recent.levels.map(d => d.professors), [1, 1]);
});
