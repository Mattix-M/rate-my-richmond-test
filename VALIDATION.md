# V1 validation — September 10, 2026

## Automated

- `npm test`: passed. 12,239 unique review keys; exact original comments; all source-to-professor joins; all 219 supplied professor counts and means; all 9 official award scores and winning identities; every supplied department/group/comparison/course/time value; 30 curated Funny keys and exact comments.
- `npm run typecheck`: passed (also checked by the final production build).
- Production build: passed; Next.js static export generated successfully.
- Export audit: every one of 877 professor pages, 27 department pages, all main routes, and all 877 per-professor review files exists. Exported review JSON matches generated public JSON exactly.

## Browser checks

- Desktop: inspected homepage, statistics notebook, professor and department detail pages.
- 390 × 844 mobile viewport: inspected homepage awards, scatterplot, controls, navigation menu, and course-level chart. Page width equals viewport width; no document overflow. Restored normal viewport after testing.
- Search for Saif Mehkari: correct highlight and link. Clicked the red scatterplot point and reached his detail page with 58 source reviews.
- Recent filtering: Saif has 23 recent reviews; switching back restores 58.
- Funny: Saif has 1 verified curated review. Full-text search “GOAT” returns 3 reviews; oldest-first correctly begins with the January 2, 2022 comment.
- Professor explorer: name search, Finance filter, minimum review count, sort controls, and period switch exercised. Missing adjusted scores stay visibly unavailable.
- Academic groups: both supplied periods rendered; recent and all-time review counts and means matched their sources.
- Finance detail: 198 reviews, 17 supplied professors, quality 3.64, difficulty 3.39, difficulty rank 3 and quality rank 21.
- About: author text and exact Instagram destination verified.
- Optional WebMCP action: valid filter input updated the same visible controls and returned Saif; invalid department rejected without changing the controls.
- Fixed an SVG title hydration issue found during testing. Final production export served separately on port 3001: no production console errors, period persistence after reload worked, recent Robins coefficient was −0.345, Kevin Webster remained the recent winner, and his 40 original reviews loaded successfully.

## Data limits

See README.md and data-validation.json. Missing recent Alpha and unavailable model outputs remain explicitly labeled; no substitute regression was fitted. No deployment was performed.
