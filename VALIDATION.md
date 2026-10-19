# V1 validation — September 10, 2026

## Local UI and private feedback revision — October 19, 2026

- Course-name search follow-up: 31 tests passed and production build passed. Imported 2,293 exact catalog code/title records from the publicly linked PDF, with 583 matching archive labels covering 7,076 indexed reviews. All 57 previously verified game titles agree where the PDF also has the code; the game pool is unchanged. Search accepts partial names, accents, mixed terms and spaced/hyphenated codes. Unmatched labels remain searchable by code. Mobile name search and opening the matching professor list were verified in the browser.

- 28 tests passed; data source integrity checks passed; final TypeScript check and production build passed (918 generated pages, one dynamic feedback endpoint).
- Compatible dependency security updates installed; npm audit reported zero vulnerabilities.
- Mobile homepage duplicate title is visually hidden while the page heading remains accessible. Both review-period buttons remain visible. No document overflow at 320px or 390px; desktop header checked at 1280px.
- Decorative link arrows removed. Existing statistics punchlines and original review text preserved.
- First-visit URdle invitation displayed, dismissed, and confirmed absent after refresh. Existing game progress suppresses it.
- Website vote saved to the private Blob store, restored after refresh, and changed from like to dislike without creating a second current vote.
- Feedback form saved a message; rapid repeats returned 429 and kept the typed draft. Cross-origin requests returned 403, invalid votes 400, oversized bodies 413. Another visitor could not retrieve the saved vote.
- Direct unauthenticated access to the test Blob returned 403. No credential found in browser assets; `.env.local` is ignored by Git.
- Disposable test records were removed. An optional all-record export check was rejected by automatic approval review; no export ran and the export feature was omitted.
- Production preview runs locally on port 3001. This revision has not been pushed or deployed. Before eventual deployment, keep Vercel's Next.js default output directory; remove any legacy `out` override.

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
- About: unofficial status and methodology shown without personal author links.
- Optional WebMCP action: valid filter input updated the same visible controls and returned Saif; invalid department rejected without changing the controls.
- Fixed an SVG title hydration issue found during testing. Final production export served separately on port 3001: no production console errors, period persistence after reload worked, recent Robins coefficient was −0.345, Kevin Webster remained the recent winner, and his 40 original reviews loaded successfully.

## Data limits

See README.md and data-validation.json. Missing recent Alpha and unavailable model outputs remain explicitly labeled; no substitute regression was fitted. No deployment was performed.

## Local statistics refresh — October 19, 2026

- Seven main questions: most-reviewed named courses; interactive course comparisons; hard-review reactions across departments; the retained yearly trend; positive course outliers; the retained school comparison; the retained difficulty-quality pattern.
- `prepare_insights.py` now derives the compact 42-course comparison pool and department/month/course-level summaries from canonical review keys. Exact course labels are preserved. FYS100 remains separate from individual named courses.
- The course tool shows raw means, professor/review counts, one-star shares, percentage distributions and expandable exact counts. Period changes update every selected-course metric. Small recent samples are labeled.
- Monthly seasonality uses complete calendar years only (2003–2025 or 2022–2025). The 51.7% figure is 6,114 of 11,824 reviews in April, November and December.
- The advanced-course disclosure uses raw, equally weighted within-professor differences with at least three reviews per level band; it explicitly does not claim year/difficulty controls. Recent coverage is too thin and is withheld from department comparisons.
- All 35 tests and the final Next.js production build passed. Browser checks covered course/period changes, a seven-review sample, links to the correct course detail, exact counts and expandable findings. The 320px page and expanded comparison tables fit without document overflow.
- Local preview remains on port 3001. No GitHub push or production deployment for this revision.

### Six-question follow-up

- Reorganized the notebook into the six requested sections. Removed the course comparison component and its styles. One-star courses can be ranked by share or count, always requiring 30 reviews in the selected period.
- Separated the overall difficulty/quality relationship from the Poli Sci/Chemistry/Math hard-review comparison. GOATED cards now require exactly zero one-star reviews and 30+ selected-period reviews, rather than using near-zero examples.
- Added the user-requested ECON101/applied-economics backstory and the short statistics author note on the homepage. No name or contact details added.
- All 37 tests and the production build passed. Browser checks confirmed distinct share/count leaders, correct recent-period lists, literal zero-one-star cards, six sections, no comparison tool, visible homepage note, and no document overflow at 320px or 1280px. Restored the normal browser viewport. No push or deployment.

### Ten-statistics copy and phone-heading follow-up

- Ten main sections. Added monthly posting counts, the historical yearly trend, the small within-professor intro/advanced comparison, and a course-difficulty ranking with a 30-review minimum in the selected period.
- Rewrote the first six around the user's supplied copy. Longer qualifications are inside closed disclosures; no direct-child explanatory micro paragraphs remain beneath the question content. The course comparison tool stays removed.
- Jepson is now visible beside Robins and Gottwald in the raw difficulty chart. Its small raw lead is distinguished from the separate adjusted Robins/Gottwald model; the author's disagreement and math/stats view are labeled as opinion.
- Historical sections 08 and 09 explicitly stay all-time when the global period changes. Monthly seasonality excludes partial boundary years. Difficulty ordering, current-period thresholds and existing source joins are tested.
- Compact left-aligned About/Feedback titles on phones, without the floating eyebrow labels. Removed the duplicate work-in-progress label and reduced the rating-subheading size on the full Feedback page.
- All 38 tests and the final production build passed. Browser checks confirmed ten sections/index links, all-time/recent figures, the all-time-only scope, Jepson's displayed average, and About/Feedback fit at 320px and 390px. No browser console errors. Local production preview remains on port 3001; no push or deployment.

### Bottom navigation and branding studies

- Mobile More opens a native modal bottom sheet with six additional destinations. The phone header menu button is removed; primary destinations remain in the bottom bar. Opening the sheet preserves the current scroll position. Body scroll is locked while open, keyboard focus wraps, and close/Escape/backdrop/navigation dismiss it. Resizing to desktop closes it and restores the desktop header navigation.
- Browser verification: opened at scroll position 6288 without moving; checked close focus restoration, forward/backward focus wrapping, Escape, backdrop, route navigation, current-page highlighting, 320px fit, and automatic close at 1280px. No browser console errors. The 38-test suite and final production build passed.
- `scripts/build-brand-options.mjs` generates three local share-card studies, three R icon directions, PNG/SVG sources and a comparison board in ignored `output/brand-options/`. All three share PNGs are 1200×630; each icon has 512/180/64/32/16px exports. Variant A uses the five actual mean-quality-by-difficulty points from the existing archive. Navy is #000066 and red is #990000.
- The local branding gallery runs separately on port 3002; the website remains on port 3001. Active public share card, icons and metadata have not been replaced. No push or deployment.
