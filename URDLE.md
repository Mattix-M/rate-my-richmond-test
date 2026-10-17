# URdle: daily course matchups

The active game at `/games/` is five higher/lower matchups: choose which course students reported as harder. It replaces the professor-from-review pilot, which required too much faculty-specific knowledge. Homepage promotion is a quiet card; the first-visit popup is removed.

## Rules and evidence

Five pairs per Richmond calendar date (`America/New_York`). Each answer uses the higher all-time mean reported difficulty in the supplied review archive. Each course has at least 20 reviews; pairs differ by at least 0.40 points and use ten distinct labels. FYS/CORE and 199 labels are excluded. Reviews still mix instructors, years and sometimes topics. These are student reports, not objective rigor or professor-quality judgments.

The first version uses a deterministic hash and stable sorted pool. Department labels describe where most associated reviews were filed. Both means, counts and latest review years are shown after choosing. There is no letter-count leak and no need to know an individual professor. Four correct choices keeps a daily streak going. Unlimited practice does not affect daily history.

## Files

- `scripts/prepare_courses.py`: validated course aggregates and game pool.
- `src/lib/course-game.json`: the frozen archive-derived pool.
- `src/lib/daily-matchups.ts`: date, pairing, answer and saved-pick validation.
- `src/components/course-matchups.tsx`: the active game, share result, local persistence and homepage card.
- `scripts/daily-matchups.test.mjs`: a full year of deterministic pair coverage, thresholds, no duplicates, midnight/DST and scoring.

Local history uses `urdle:course-matchups-v2-titles`; earlier professor-game history is separate. Refresh restores answered rounds. No runtime AI output, invented data, accounts or network feed.

## Updating

Regenerate with `npm run data`. Freeze already-published pairs or version the pool/history when changing the source dataset; do not silently reinterpret saved answers. Run `npm test`, `npm run typecheck` and `npm run build`, and check the daily and practice flows on phone and desktop.

Legacy files (`src/lib/urdle.ts`, `src/lib/urdle/`, `src/components/urdle.tsx`, `scripts/prepare_urdle.py`) remain for historical reference and source-integrity checks. They do not control the current `/games/` route.

## Verified course titles

Full titles appear beneath course codes before guessing, and in the recap. The 57-course pool uses exact catalog-code matches checked on October 16, 2026. `src/lib/course-titles.json` stores titles, source URLs, verification dates and unmatched checks. The archived review index retains unmatched shorthand/historical labels; the game excludes them. Catalog titles describe the current catalog and may differ from names used when older reviews were written. Title links appear beneath each matchup.

The smaller verified pool is a new game/history version, so prior saved results are not regraded against different matchups. Build-time generation reads the local verified title file; it makes no network requests.
