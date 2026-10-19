export type CourseSummary = {
  count: number; quality: number; difficulty: number; latest: string;
  distribution: number[]; tags: {tag: string; count: number}[];
};
export type Course = {
  titles: string[]; titleSourceUrl: string | null;
  code: string; subject: string; reviewDepartment: string; all: CourseSummary; recent: CourseSummary | null;
  professors: {id: string; all: CourseSummary; recent: CourseSummary | null}[];
};
export type CourseIndex = {
  meta: {totalReviews: number; indexedReviews: number; latestReview: string; courseCount: number; namedCourseCount: number};
  courses: Course[];
};
export function normalizeCourse(value: string) { return value.toUpperCase().replace(/[\s-]+/g, ''); }
function searchText(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function matchesCourse(course: Pick<Course, 'code' | 'titles'>, query: string) {
  const words = searchText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  if (course.code.includes(normalizeCourse(query))) return true;
  const text = searchText([course.code, ...course.titles].join(' '));
  return words.every(word => text.includes(word));
}
export function evidenceLabel(count: number) {
  return count < 5 ? 'Very small sample' : count < 15 ? 'Small sample' : count < 30 ? '15+ reviews' : '30+ reviews';
}
export function freshnessLabel(date: string, now = new Date()) {
  const days = (now.getTime() - Date.parse(date + 'T12:00:00Z')) / 86400000;
  return days <= 365 ? 'Review within a year' : days <= 1096 ? 'Latest review 1–3 years ago' : 'Latest review over 3 years ago';
}
