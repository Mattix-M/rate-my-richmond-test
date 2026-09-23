# Rate My Richmond

A local, static Next.js / TypeScript website exploring the supplied University of Richmond Rate My Professors dataset. No database, authentication, scraping, backend, or API keys.

## Run locally

Requires Node.js 20.9+ and Python 3 (standard library only).

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

`npm test` checks generated data against all source outputs and original comments. The build regenerates JSON and exports all pages to `out/`. To preview the production export:

```sh
python3 -m http.server 3001 --directory out
```

`next start` is not used with static exports.

## Deploy to Vercel

Push this folder to a Git repository, import it into Vercel, and select the Next.js framework preset. Use `npm run build`, with output directory `out`. No environment variables or database setup are needed. Commit `data/`, `scripts/`, source files, and the lockfile. Python 3 must be available for the prebuild step; alternatively generate and commit the JSON locally, and override Vercel's build command with `npx next build`.

A static export can also be hosted by any static web host. Nothing has been published from this local task.

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
- New course comparisons require at least 15 reviews per course. Earlier/recent changes use nonoverlapping 2002–2021 and 2022–2026 windows with at least 15 reviews in each. These are descriptive comparisons, not causal estimates.
- Department standouts are clearly labeled subsets of eligible supplied / documented recent scores, distinct from the official campus-wide awards.
- No building mapping, Unhinged taxonomy, accounts, submissions, or live scraping.
- Fonts use Google Fonts with system fallbacks. All data and review files are local.

## Implementation

`src/components/` contains the shared layout, scatterplot and ranking controls, professor reviews, department pages, and notebook visualizations. Chart colors follow Richmond navy `#000066` and red `#990000`; shared typography tokens live in `src/app/globals.css`. Recharts supplies the interactive charts; the regression intervals use labeled SVG, and rankings use accessible links / tables.

An optional, feature-detected WebMCP `filter_professors` action shares the explorer's visible controls. Unsupported browsers use the normal interface. Adding more curated review types can extend the review JSON schema and key-based ingestion without changing source comments.

## Sharing and privacy

Compare up to three professors, filter by shared course, and copy the comparison URL. On phones, choose which pair to display. Public attribution and personal social links have been removed; this does not anonymize Git commit history or hosting account ownership. Local presentation/output folders are ignored by Git.
