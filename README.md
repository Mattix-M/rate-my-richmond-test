# Rate My Richmond

A Next.js / TypeScript website exploring the supplied University of Richmond Rate My Professors dataset. Ratings pages are prerendered. A small server endpoint saves private website votes and feedback in Vercel Blob. No accounts or live scraping.

## Run locally

Use Node.js 24 and Python 3 (standard library only).

```sh
npm install
npm run data
npm run dev
```

Open http://localhost:3000. The review period persists for the browser tab. The app includes the homepage highlight and scatterplot, professor explorer, 877 professor detail pages with original reviews, 27 department detail pages, academic group comparisons, professor comparisons, review distributions, course summaries, descriptive statistics, and About / methodology.

## Validate and build

```sh
npm test
npm run typecheck
npm run build
```

`npm test` checks generated data against all source outputs and original comments, plus game logic and feedback validation. The build regenerates JSON and prerenders the ratings pages. To preview the production build:

```sh
npm start
```

Open http://127.0.0.1:3001. A static file server cannot run the feedback endpoint.

## Deploy to Vercel

Use the Next.js framework preset and its default output directory (clear any old `out` override). Use `npm run build`. Commit `data/`, `scripts/`, source files, and the lockfile. Python 3 must be available for the prebuild step; alternatively generate and commit the JSON locally, and override Vercel's build command with `npx next build`.

Connect a **private** Vercel Blob store and provide the server-only `BLOB_READ_WRITE_TOKEN` for each intended environment. Copy `.env.example` to `.env.local` for local feedback testing. Without the credential, the rest of the site works and feedback reports that it is unavailable. Never commit `.env.local` or use a `NEXT_PUBLIC_` token.

## Private feedback

Votes rate the website overall. A signed random browser cookie keeps one current vote per browser; changing the vote replaces the earlier one. This is not proof of one vote per person. No name, email, or IP address is added to stored feedback records. Hosting logs are separate.

Messages are private, capped at 1,500 characters, one per minute, and ten per browser record. Votes have a three-second cooldown. Cross-origin posts and oversized or malformed bodies are rejected. Concurrent changes use conditional writes. Clearing cookies can bypass browser-based limits; these are basic spam controls.

Read submissions in the private Blob store through the hosting dashboard. No public endpoint lists submissions or totals. Keep any downloads private.

Vercel Hobby Blob has a free allowance and pauses on quota exhaustion; check the current plan limits before launch. This local UI revision has not been published.

## Data integrity

The original files in `data/` are never edited. `scripts/prepare_data.py` produces `src/lib/data.json`, a JSON review file per professor in `public/reviews/`, and `data-validation.json` containing source hashes and coverage details. Professor review files are fetched on detail and comparison pages. `scripts/prepare_insights.py` generates descriptive statistics in `src/lib/insights.json`; it leaves the original adjusted scores unchanged.

- 12,239 reviews, 3,741 in 2022–2026; original comments preserved byte-for-byte as Unicode strings.
- 877 professor name groups after 14 explicit alias joins. All 219 supplied eligible professor counts and raw means match the joined reviews.
- All 9 official award scores, including all 3 recent scores, validated to numerical tolerance 1e-10.
- All-time Bayesian and shrunk Alpha scores are copied from the supplied professor output.
- Recent Bayesian scores use the documented minimum of 15 recent reviews and prior weight 10 toward the recent Richmond-wide mean. The 3 official recent awards reproduce exactly. Below-threshold adjusted scores are missing, not ranked.
- All 27 department rows, 6 academic group rows per period, course-level rows, yearly trends, and 4 comparison regression rows are copied from the supplied outputs.
- Department headlines are explicitly all-time. Academic groups support both periods. Economics stays separate from Robins.
- Raw professor data can be explored below the ranking thresholds by lowering the minimum-review filter. Unknown groups are labeled Unmapped rather than inferred.
- Original review text is preserved. The interface does not label individual reviews as funny.

## Known gaps and deliberate limits

- No recent Alpha, recent department summaries, full difficulty–quality regression table, or within-professor time-trend regression was supplied. Corresponding unavailable statistics are labeled. The unverified approximately −0.41 coefficient is not displayed.
- The 27 department summaries cover only part of the review corpus. Their supplied professor counts can differ from alias-merged explorer counts. Academic mappings are only used where supplied.
- Statistics-page course comparisons require at least 15 reviews per course. The course explorer shows raw means with explicit sample-size labels and a configurable review minimum. Earlier/recent changes use nonoverlapping 2002–2021 and 2022–2026 windows with at least 15 reviews in each. These are descriptive comparisons, not causal estimates.
- Department standouts are clearly labeled subsets of eligible supplied / documented recent scores, distinct from the official campus-wide awards.
- No building mapping, Unhinged taxonomy, accounts, new professor-review submissions, or live scraping.
- Fonts use Georgia and system sans-serif. All data and review files are local.

## Implementation

`src/components/` contains the shared layout, scatterplot and ranking controls, professor reviews, department pages, and notebook visualizations. Chart colors follow Richmond navy `#000066` and red `#990000`; shared typography tokens live in `src/app/globals.css`. Recharts supplies the interactive charts; the regression intervals use labeled SVG, and rankings use accessible links / tables.

An optional, feature-detected WebMCP `filter_professors` action shares the explorer's visible controls. Unsupported browsers use the normal interface. Adding more curated review types can extend the review JSON schema and key-based ingestion without changing source comments.

## Sharing and privacy

Compare up to three professors, filter by shared course, and copy the comparison URL. On phones, choose which pair to display. Public attribution and personal social links have been removed; this does not anonymize Git commit history or hosting account ownership. Local presentation/output folders are ignored by Git.

## Course search, schedule lab and URdle

See [UPGRADE_NOTES.md](UPGRADE_NOTES.md) for the October 16 feature plan, implementation and data-access findings. New routes are `/courses/`, `/planner/`, `/games/` and `/data/`. URdle now uses five daily reported-difficulty matchups; see [URDLE.md](URDLE.md).

`prepare_courses.py` builds the course index and review-date metadata from the existing archive. The planner runs locally in the browser with CSV/TSV imports or entered sections; it needs no private Richmond integration. There is no live RMP or official schedule feed. Dates, evidence counts and import limitations are visible in the interface.

Course search accepts names, partial words, codes, and mixed queries. `catalog-titles.json` stores exact-code names extracted from Richmond's public 2026 catalog PDF; `course-titles.json` supplies the separately verified game names. The 583 name-matched archived codes cover 7,076 of 10,193 indexed reviews. Unmatched historical labels remain searchable by code. No subject aliases or course availability are inferred. `import_catalog_titles.py` is a manual owner tool requiring the public PDF, public CSV export, and the bundled Python with pdfplumber; it is not part of builds. The URdle pool is unchanged.
