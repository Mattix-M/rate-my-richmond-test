# October 16, 2026 upgrade

## Plan and result

Make the site useful before registration, make the game playable without knowing faculty, and show honest dates beside the numbers.

User correction: entering classes by hand duplicates BannerWeb and is not worthwhile. The manual planner is parked at its direct route, removed from navigation/homepage and course promotions. Do not present it as a flagship feature. Course-specific professor comparison and saved course shortlists are the main workflow.

Built:

- `/courses/`: a searchable index of 1,460 recognizable review course labels, with review-count filters, all-time/recent periods, raw course-specific professor averages, distributions, saved courses, and links into filtered professor reviews.
- `/planner/`: manually entered or CSV/TSV-imported sections; one course with multiple section alternatives; multiple meeting rows per CRN; section locks; recurring unavailable time; earliest/latest limits; Friday preference; bounded conflict-free combination search; twelve best alternatives; weekly class-time and gap totals; responsive calendar; local persistence; plan backup/restore; print and `.ics` export. The built-in example uses explicitly invented DEMO courses.
- `/games/`: URdle is now five higher/lower reported-difficulty matchups rather than guessing professor identities. Daily Richmond-time puzzles, raw-score reveals, result sharing, local history and a 4/5 streak threshold, plus unlimited practice.
- `/data/`: archive dates, coverage, limitations, browser storage details, and official course/schedule links.
- Professor pages: sample-size labels, latest archive dates, freshness labels and direct original RMP profile links.
- Homepage/navigation: course search and saved-course shortlist entries, a smaller game promotion, no automatic game invitation. Georgia/system fonts remain; unused external Google Font request removed.

## What remains a snapshot

The latest review in the supplied archive is 2026-09-09. This is not the collection date and does not guarantee complete coverage through that date. Original comments, supplied regression coefficients, Bayesian scores and source files remain unchanged.

`prepare_courses.py` aggregates the existing generated review files. It does not collect new RMP content or refit the models. It normalizes spaces, hyphens and case only, and excludes labels with no recognizable subject/number. BIO and BIOL are separate. Broad labels such as FYS100 may mix topics and years. The game excludes FYS, CORE and courses ending in 199; other special topics can still exist. Department labels in the game describe the most common associated review department, not verified catalog assignments.

The course index contains raw means with explicit sample sizes; these are not adjusted professor rankings or confidence intervals. Very small samples stay visible when requested and are flagged.

## Data access findings

Checked the official registrar schedule page and its current Box link. The linked download redirects to a Richmond Box login. No private BannerWeb endpoint is called. The planner accepts a spreadsheet that the user legitimately obtains, using CSV export or tab-separated copy/paste. No credentials, database or server integration are needed.

RMP's published terms restrict automated collection and republication. No authorized feed was found or connected. A production refresh needs an authorized source plus validation, refreshed models where applicable, and a deploy. Do not describe these ratings as live. Do not circumvent source access controls.

Official entry points:

- https://registrar.richmond.edu/planning/schedule/class.html
- https://catalog.richmond.edu/
- https://bannerweb.richmond.edu/
- https://registrar.richmond.edu/planning/calendar/index.html
- https://www.ratemyprofessors.com/terms-of-use

## Planner limits

Input must describe one term, full-term timed classes. Prerequisites, eligibility, seat counts, instructor identity matches, separately registered lab pairing, half-term overlap, and travel time are not modeled. Combined lecture/lab meetings sharing one section or CRN are checked together. TBA or malformed rows are skipped with visible row-number warnings; conflicting repeated IDs and overlapping meetings within a section fail the import.

Search tries at most 100,000 section placements and returns up to twelve best options. Compact scoring is the sum of gap minutes plus 30 points per campus day; with compact preference off, only campus days determine score. Truncation is labeled. Time preferences and blocks are hard constraints. Imported sections and plans remain on-device.

Calendar output uses America/New_York with daylight-saving rules. The date range is entered by the user and repeats weekly, including breaks and holidays. Users must remove those dates after import. Unavailable blocks are not exported.

## Updating and verification

`npm run data` regenerates the original validated dataset, descriptive insights and course index. `npm test` validates these plus the legacy professor-game bank, planner logic and the new daily game. `npm run build` regenerates inputs and statically exports the website.

New generated artifacts:

- `public/courses-index.json`
- `src/lib/course-game.json`
- `src/lib/review-evidence.json`

If the game pool or means change after publication, freeze published matchups or version the game data/storage namespace deliberately; otherwise previous results could be reinterpreted. The current pool is frozen to this archive. The old professor game remains in source for reference but is not routed or promoted.

No hosting settings, remote repository or live deployment were changed.

## Useful next step

With permission/access to an official schedule feed, replace user imports with a validated periodic snapshot using the same section schema. Keep snapshot time visible and continue sending people to BannerWeb for seats and registration. This can be added without changing the planner or the site's static hosting model.


## Mobile improvements — October 17, 2026

Approved for publication after removing the experimental second game.

- Mobile bottom navigation, sticky header, larger search controls, compact professor cards and expandable secondary metrics. Desktop tables stay available.
- Professor search defaults to one review, including reset. Search accepts documented aliases and accent-free spellings. Home search opens an all-time search; empty searches can clear restrictive filters. Ranking thresholds remain unchanged.
- Course search also starts at one review. Extra filters collapse on mobile; opening course details scrolls/focuses the rendered panel, and closing restores focus to the course.
- The methodology starts with three short explanations. Existing detail, caveats, and the checked adjusted-score formula sit behind disclosures.
- URdle remains the only game. The experimental word game, its links, data and styles were removed before release.
- Browser source maps are explicitly disabled in production, credential files are ignored, and no accounts, analytics scripts or submission features were added.
- Local privacy findings are in output/LOCAL_PRIVACY_REVIEW.txt (ignored by Git). Website changes alone do not anonymize public repository history.

Validation: 25 automated tests pass. A production export builds 916 pages. Browser checks cover 320px and 390px layouts, one-review professor search from home, navigation, expandable methodology, and course details.
