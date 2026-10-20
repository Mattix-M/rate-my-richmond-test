# Final audit and release plan

## Review prompt
Act as a demanding product designer and first-time student using Rate My Res Hall. Do not assume passing tests means the experience is polished. Inspect actual rendered states where possible and distinguish observed defects from suspected ones. Preserve the rounded white interface, serif hall headings and wordmark, neutral body text, restrained blue actions, and Richmond red brand accents. Do not recreate Rate My Richmond's red navigation bar.

Review Explore, every residence overview, floor selection and return, apartment selection, room plans, search, filters, saved halls, Hall Stats, comparisons, sources, workbook download, and the complete quiz/replay flow. Check desktop and narrow phone layouts, empty results, deep links, repeated opening/closing, keyboard navigation, focus restoration, reduced motion, and interrupted animation. Test map-to-building zoom/fade and building-to-floor transitions consistently across UFA, Gateway, and individual halls. Check that hit areas match visible floors and controls remain usable during transitions.

Inspect typography by role, computed text colors, link versus non-link treatment, contrast, borders, whitespace, alignment, responsive wrapping, clipping, scroll traps, overlapping layers, loading states, and motion continuity. Inspect complete building silhouettes, roof closure, wall/roof intersections, dormers, porch supports, brick/roof palette, and scale/centering. Do not claim architectural precision from illustrative models.

Read all visible copy aloud. Prefer short, clear, dry, slightly irreverent student language. Keep facts and numbers precise; avoid forced jokes, corporate language, repeated disclaimers, unsupported rankings, and claims of official university affiliation. Unknown capacities must remain unknown, community totals must not be compared as single buildings without explanation, and partial sums must not be presented as campus totals. Verify sources and downloads remain available.

Return concrete findings with severity, reproduction steps, affected files/state, proposed fix, and verification. Rank visual polish, consistency, usability, voice, and interest out of ten, with reasons. Identify what was not tested. Fix owned issues, then rerun the affected flow. Do not inflate scores or hide remaining limitations.

## Execution
1. Finish and test the shared arrival/return animations, including interrupted transitions.
2. Run independent design, interaction/accessibility, and copy/data release audits. Parent reviews browser evidence and integrates fixes.
3. Run the complete automated suite and asset validation; inspect desktop/mobile screenshots and critical journeys.
4. Package only runtime assets into a standalone static build. Exclude research working files and development tooling from the public output; retain the intended workbook download.
5. Commit the Res Hall app on a dedicated branch and push to the existing GitHub repository.
6. Create a separate Vercel project rooted at this app, deploy the verified commit to production, and check the public site and assets.
7. Record actual results, unresolved limitations, commit and production URL. Recheck after any corrective deployment.

## Release gates
No broken primary navigation, inaccessible core controls, missing referenced assets, accidental deployment of the original professor-review site, exposed local configuration, false capacity claims, or canceled floor transition on handoff. Physical trackpad feel cannot be certified by synthetic events and must be reported honestly.

## Executed review results
- Independent design, interaction, and copy/data reviews completed; detailed reports are in `final-design-review.md`, `final-interaction-review.md`, and `final-copy-review.md`.
- Fixed stale dialog-close events cancelling new arrivals, and stale floor flights after toolbar changes. Added regression coverage.
- Fixed instruction typography specificity, ranking link affordance, phone heading tracking, source-list splitting, and stale/promotional copy.
- Browser checked Dennis floor-to-building return and final hall layout; mobile statistics has no horizontal overflow at 390px. Broader building and game checks are recorded in the earlier audit.
- Separate production build copies runtime files and the intended workbook to `dist/`; excludes development scripts and research working documents.
- Created separate Vercel project `rate-my-res-hall` (`prj_Xe5RVacAdVu5dmHEi5MDgQfpFsIA`), account `team_JrXuTWAVhTE6TcJFauGMErsY`. No deployment has been created yet.
- Publishing blocked: configured Git remote `Mattix-M/rate-my-richmond-1` returns 404 through the GitHub connector; local Git has no HTTPS authentication. Connected account lists `Mattix-M/rate-my-richmond-test`, but destination must be resolved before publishing into a different repository.
- Hardware trackpad feel, screen-reader output, and university source pages returning consent/errors remain explicitly unverified.
