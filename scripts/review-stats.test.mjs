import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/lib/review-stats.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}});
const {summarizeReviews, inPeriod, sharedCourses, courseKey} = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const row = (changes = {}) => ({key: 'r', date: '2021-12-31', year: 2021, course: 'ECON 101', quality: 5, difficulty: 2, tags: ['Caring', 'CARING'], comment: '', funny: false, ...changes});
test('recent window is inclusive and disjoint from earlier reviews', () => {
  const rows = [row(), row({year: 2022}), row({year: 2026}), row({year: 2027})];
  assert.equal(inPeriod(rows, 'recent').length, 2);
  assert.equal(inPeriod(rows, 'all').length, 4);
});
test('summary counts tags once per review and preserves rating distributions', () => {
  const summary = summarizeReviews([row(), row({key: 's', date: '2026-01-01', year: 2026, quality: 1, difficulty: 4, tags: ['caring', 'Tough grader']})]);
  assert.equal(summary.quality, 3);
  assert.equal(summary.difficulty, 3);
  assert.equal(summary.latest, '2026-01-01');
  assert.deepEqual(summary.distribution.map(r => r.quality), [1, 0, 0, 0, 1]);
  assert.equal(summary.tags.find(t => t.tag === 'Caring').count, 2);
  assert.equal(summary.courses[0].count, 2);
});
test('empty reviews are missing values, not zero ratings', () => {
  const s = summarizeReviews([]);
  assert.equal(s.quality, null); assert.equal(s.latest, null); assert.equal(s.count, 0);
  assert.deepEqual(s.tags, []);
});
test('shared courses require a match for every professor, without guessing aliases', () => {
  assert.equal(courseKey(' econ 101 '), 'ECON101');
  const a = [row(), row({course: 'BIO101'})], b = [row({course: 'econ101'}), row({course: 'BIOL101'})];
  assert.deepEqual(sharedCourses([a, b]), ['ECON101']);
  assert.deepEqual(sharedCourses([a, b, []]), []);
  assert.deepEqual(sharedCourses([a]), []);
});
test('course means and latest dates use only the selected rows', () => {
  const rows = [row(), row({course: 'ECON102', quality: 1, date: '2026-01-01', year: 2026})];
  const s = summarizeReviews(rows.filter(r => courseKey(r.course) === 'ECON101'));
  assert.equal(s.count, 1); assert.equal(s.quality, 5); assert.equal(s.latest, '2021-12-31');
});
