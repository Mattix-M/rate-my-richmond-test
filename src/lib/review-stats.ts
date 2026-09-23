import type {Period, Review} from './model';

export const courseKey = (course: string) => course.trim().toUpperCase().replace(/\s+/g, '');
export const inPeriod = (rows: Review[], period: Period) => period === 'all' ? rows : rows.filter(r => r.year >= 2022 && r.year <= 2026);

export function summarizeReviews(rows: Review[]) {
  const count = rows.length;
  const mean = (field: 'quality' | 'difficulty') => count ? rows.reduce((sum, r) => sum + r[field], 0) / count : null;
  const courses = new Map<string, Review[]>();
  const tags = new Map<string, number>();
  for (const r of rows) {
    const code = courseKey(r.course);
    if (code) courses.set(code, [...(courses.get(code) || []), r]);
    // One mention per review, even when tags differ only in capitalization.
    for (const tag of new Set(r.tags.map(t => t.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))) {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    }
  }
  return {
    count,
    quality: mean('quality'),
    difficulty: mean('difficulty'),
    latest: count ? rows.reduce((latest, r) => r.date > latest ? r.date : latest, '') : null,
    distribution: [1, 2, 3, 4, 5].map(rating => ({rating, quality: rows.filter(r => r.quality === rating).length, difficulty: rows.filter(r => r.difficulty === rating).length})),
    courses: [...courses].map(([course, rs]) => ({course, count: rs.length, quality: rs.reduce((sum, r) => sum + r.quality, 0) / rs.length, difficulty: rs.reduce((sum, r) => sum + r.difficulty, 0) / rs.length})).sort((a, b) => b.count - a.count || a.course.localeCompare(b.course)),
    tags: [...tags].map(([tag, count]) => ({tag: tag[0].toUpperCase() + tag.slice(1), count})).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
  };
}

export function sharedCourses(groups: Review[][]) {
  if (groups.length < 2) return [];
  const sets = groups.map(rows => new Set(rows.map(r => courseKey(r.course)).filter(Boolean)));
  return [...sets[0]].filter(code => sets.every(set => set.has(code))).sort();
}

export function dateLabel(date: string | null) {
  return date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'No reviews';
}
