type Summary = {reviews: number; distribution: number[]};
type Course = {code: string; all: Summary; recent: Summary | null};
type Period = 'all' | 'recent';
export type OneStarOrder = 'share' | 'count';

export function rankOneStarCourses<T extends Course>(courses: T[], period: Period, order: OneStarOrder, minimum = 30): T[] {
  return courses.filter(c => c[period] && c[period]!.reviews >= minimum).sort((a, b) => {
    const x = a[period]!, y = b[period]!;
    const difference = order === 'share'
      ? y.distribution[0] / y.reviews - x.distribution[0] / x.reviews
      : y.distribution[0] - x.distribution[0];
    return difference || y.reviews - x.reviews || a.code.localeCompare(b.code);
  });
}

export function zeroOneStarCourses<T extends Course>(courses: T[], period: Period, minimum = 30): T[] {
  return courses.filter(c => c[period] && c[period]!.reviews >= minimum && c[period]!.distribution[0] === 0)
    .sort((a, b) => b[period]!.reviews - a[period]!.reviews || a.code.localeCompare(b.code));
}

type DifficultyCourse = {code: string; all: Summary & {difficulty: number}; recent: (Summary & {difficulty: number}) | null};
export function rankDifficultyCourses<T extends DifficultyCourse>(courses: T[], period: Period, minimum = 30): T[] {
  return courses.filter(c => c[period] && c[period]!.reviews >= minimum)
    .sort((a, b) => b[period]!.difficulty - a[period]!.difficulty || b[period]!.reviews - a[period]!.reviews || a.code.localeCompare(b.code));
}
