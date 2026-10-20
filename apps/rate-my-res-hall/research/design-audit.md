# Residence UI consistency audit

Scope: map, building selector, floor/room viewer, statistics, shared navigation.
Baseline: retain the approved rounded UI, sans-serif brand, royal-blue interactions, white surfaces and physical red-brick/slate models. This audit does **not** recommend a red navigation bar or wholesale editorial redesign.

Evidence: current source and cascade inspection. Browser access is unavailable to this agent (no enabled browser surfaces), so findings below are code-confirmed or explicitly marked for visual validation. Earlier screenshots are not evidence of the latest implementation.

## Fix first

1. **Hall facts are smaller than their declared design size.** `hall-explorer.css` selects `.building-dialog:not(.ufa-immersive) .building-intro p` at specificity 0,3,1 and sets `font-size:12px;color:#686879`. The later `richmond-theme.css` `.building-intro .hall-fact p` (0,2,1) cannot override it with 14px. Set the fact paragraph override at matching specificity, or narrow the introductory-copy selector to direct paragraphs. This also explains why facts can look different between UFA and other halls.
2. **Stats still use blue for noninteractive text.** In `stats.css`, `.big-number`, `.comparison-result`, and `h1 em` use the same blue as links. The user's latest feedback specifically objects to factual text resembling links. Use neutral ink for results and capacity values; keep bars blue as chart encoding and links visibly underlined. The changed `.hall-stat-line` already correctly uses neutral `#575b70` and actual fact links inherit blue.
3. **Comparison controls can overflow narrow screens.** `.selectors label` lacks `min-width:0`; both selects remain horizontal at phone widths. `.comparison-grid` remains two equal columns and cards also lack `min-width:0`. Long community names can determine intrinsic widths. Add `min-width:0`, and stack selects/cards at a phone breakpoint. Code-derived risk: verify 320px and 390px with University Forest Apartments selected.
4. **Stats hero can collide with its illustration at tablet widths.** `.hero-art` is absolute, 43% wide; the text has no reserved width. Illustration is hidden only below 800px. At 801–1000px a long serif title can cross into the artwork. Use actual grid columns or remove the unused artwork. Code-derived risk; not visually confirmed on current build.

## Shared navigation

- New `.masthead-brand` restores the approved sans-serif brand and icon; preserve it.
- The old `stats.css` mobile `nav a:last-child{display:none}` still exists but is now defeated by `.site-masthead .site-tabs a{display:flex}`. Remove the obsolete hide rule eventually rather than relying on a repair override.
- `site-navigation.css` still defines unused serif `.site-wordmark` rules and its opening comment describes an editorial header. These are maintenance leftovers, not current visible bugs.
- About the data exists on the map navigation but not stats. If intentional, keep this contextual distinction; otherwise use the same navigation items and an appropriate methodology destination on stats.
- Navigation uses uppercase 13px desktop/11px mobile while the previous UI used sentence-case controls. This is an aesthetic variation, not a correctness bug. Do not change it without checking current user preference.

## Floor and room viewers

- `style.css` sets `--viewer-paper:#faf9f7` and applies it to plan header/toolbar/caption/source notes; `richmond-theme.css` makes dialog body white. Result: warm ivory toolbar strips within otherwise cool white/blue UI. Unify viewer-paper to white or a deliberate cool near-white.
- In `style.css`, `.floor-rail button` still has sage `#d0d6c9` borders, whereas UFA callouts use `#d0d9e6`. Theme only overrides hovered/selected rails. Set idle rail borders to the same blue-gray token.
- Non-UFA intro copy is 12px, UFA intro copy also 12px; source labels fall to 9px on mobile, UFA callout subtitles to 10px. These are too small for useful instructions/source context. Raise essential instructions to 13–14px and reserve smaller text for truly secondary attribution.
- Floor rail labels become 11px mobile even though targets remain 44px tall. Consider 12–13px without reducing hit targets.
- `richmond-theme.css` keeps heading/back-button text at older deep navy `#000066`, while most current actions use `#294987`. Neutral headings are appropriate; consolidate action blue so identical actions do not alternate between deep navy and royal blue.
- Legacy slab colors in `hall-explorer.css` remain red/green, but current SVG architectural floors do not use those `.slab-top/.slab-side` surfaces. Do not recolor dormant rules as though they were confirmed visual bugs. Verify any fallback renderer that still uses them.

## Statistics typography and chart integrity

- Source/meta text uses several near-identical colors: `#647087`, `#68738a`, `#6d7687`, while map uses `#626c7d` and facts now `#575b70`. Consolidate normal secondary copy to one readable token.
- Main stats h1 max90px and 465px minimum hero consume a full initial viewport. This is not a rendering bug, but pushes the actual questions below the fold. Reduce hero height/type scale while retaining rounded cards and the user's preferred tone.
- Decorative houses labeled 12/?/292 are not proportional to capacity. Numbers make the illustration appear quantitative. Remove the numbers or use an honest chart, not arbitrary heights.
- Ranking labels look like ordinary dark text and have no underline until hover. Make residence navigation evident without coloring unrelated numbers blue.
- Story grouping currently includes bedroom/capacity questions under “Buildings with a past.” Rename the group or split history from statistical questions.
- Story summaries use 26px Georgia, while question cards use 31px and section headings 38px. This hierarchy is reasonable; keep it rather than flattening every title to one size.
- Keyboard focus is red on stats but blue throughout the viewer. Choose one clearly visible focus token for both pages.

## Copy direction

Use short, dry, casual commentary around professional charts. Current phrases “A campus full of characters,” “Numbers with receipts,” “The campus lore department,” and “Every building has a story” feel like generic promotional copy. Prefer direct questions and brief answers. Occasional humor can follow the finding; it should not replace the finding. Do not reuse the explicitly rejected “The allegations survived regression analysis.”

## Verification checklist for implementer

- Desktop and 390px mobile: map/stats navigation, visible active tab, no horizontal overflow.
- Hall with long name and fact: ensure 14px fact copy and neutral non-link dates.
- UFA and regular hall: compare identical control roles and idle/hover/focus colors.
- Floor and room views: check toolbar surfaces, readable labels and room selection contrast.
- Stats: choose UFA/Gateway in both comparison selectors; check long names, source links, 320px layout.
- Keyboard tab through nav, selects, story disclosures, source links; ensure clear consistent focus.
- Recheck reduced-motion support and keep model material colors separate from UI action colors.

## Independent screenshot scoring — second pass

Reviewed actual captures supplied by parent: `/tmp/audit-stats-desktop.png`, `/tmp/audit-stats-phone.png`, `/tmp/audit-quiz-phone.png`, `/tmp/audit-quiz-result.png`, `/tmp/models-review-0.png`, `/tmp/models-review-1.png`. This is visual evidence for the shown states only; not a motion or complete route audit. Current user-requested serif logo is accepted. The model contact sheets are reduced resolution, so fine texture defects cannot be judged reliably.

| Criterion | Score | Evidence |
| --- | --- | --- |
| Visual polish | 7/10 | Stats and quiz have clean edges, legible titles and restrained surfaces. Model roofs still show jagged ridge silhouettes and stray pale strokes, especially Marsh, Lakeview and Moore. |
| Voice | 8/10 | “Some of this is actually useful” and “The buildings will forgive you” fit the brief. Quiz repeats the same no-consequences joke in eyebrow, intro and results disclaimer. |
| Usability | 7/10 | Quiz answers are large and clear. Stats mobile forces a long scroll through three navigation cards before useful data; the second card is still incomplete at the bottom of an 844px capture. |
| Cross-page consistency | 8/10 | Serif logo, navy text, white surfaces, blue controls and rounded cards now feel related. Desktop question-card action links sit at inconsistent vertical positions. |
| Interest | 7/10 | Robins hook is specific and promising. First two nav cards both sell a hall-size comparison; users see little evidence or a surprising result above the fold. Five-round quiz/replay variety will improve this but is not verified in these captures. |

### Highest-value remaining fixes

1. **Model roof cleanup still necessary.** Marsh ridge visibly steps and buckles; Lakeview roof has a bulky irregular hump and isolated pale strokes; Moore junction shows visible diagonal seams. Replace small triangulation undulations with simpler clean roof sections for those cases. Do not increase detail until silhouettes are coherent. Dennis/Gray appear substantially cleaner at this scale. Lora's three capped blocks read as buildings, though the rear roof has a tiny uneven peak that could be simplified.
2. **Model captions touch or clip the modal bottom.** “Illustrated selector · available floor plans” sits on the bottom edge in multiple panels, including Dennis, Gray, Keller, Lakeview, Moore and North. Reserve a real footer row/padding; avoid absolute bottom positioning. Caption must remain inside modal at these heights.
3. **Compact stats navigation on phones.** Turn the three large navigation cards into short rows or reduce their padding/title margins. Users should reach the ranking without scrolling through ~600px of navigation cards. Keep generous tap targets, not generous empty space.
4. **Align desktop question-card CTAs.** The third card's link is ~35px lower than the first two due to its three-line title. Use flex-column with the link pushed to a shared bottom edge.
5. **Make the first two cards distinct.** “How big is your hall?” versus “Your hall vs. their hall” are nearly the same promise. Label the first action “See the capacity ranking” and the second “Compare two halls,” so their purposes are apparent.
6. **Reduce repeated quiz disclaimers.** Keep either “Five questions. No housing priority.” or the intro's room-assignment joke, not both. Result “No leaderboard. No permanent record…” is a third reassurance nobody asked for. One dry line is funnier than three.
7. **Quiz question can be shorter.** “Which has the larger published capacity?” is technically precise but bureaucratic. “Which hall fits more people?” works with the explicit capacity note already below. Preserve the distinction in the answer explanation/source, rather than every headline.
8. **Do not score architecture as complete yet.** North's fact mentions a tower/cloisters while the shown model emphasizes repeated identical windows and stacked strips; no recognizable tower is apparent in this view. This is an artistic recognizability gap, not necessarily a geometry bug. Prioritize its distinctive feature after roof stability.

No horizontal overflow is apparent in the supplied phone captures. This does not verify 320px layouts, open selectors, focus behavior or animations. Westhampton was not in these sheets and is explicitly excluded from this assessment.

## Final screenshot re-review

Evidence: `/tmp/polished-hall-stats.png`, `/tmp/polished-stats-phone.png`, `/tmp/polished-hall-quiz.png`, `/tmp/audit-marsh-fixed.png`, `/tmp/audit-westy-fixed.png`.

Scores: **polish 7.5/10; voice 8/10; usability 8/10; consistency 8/10; interest 8/10.** These are independent visual judgments, not functional-test scores.

Confirmed improvements:
- Mobile question navigation is now compact; ranking appears within the supplied view.
- Desktop card links align to a shared baseline.
- Quiz has one restrained joke, readable question/answers, coherent spacing and clear active navigation.
- Marsh caption is now fully within the modal, and pale rear-eave zigzags no longer cross its roof.
- Westhampton has coherent large roof sections; the earlier missing/jagged pale void is substantially repaired.

Remaining issues:
1. **Westhampton caption is still clipped** in the supplied final screenshot. Its text baseline meets the modal's bottom border at about y732. This remains a concrete visible defect; the Marsh-specific result cannot establish that all captions fit. Put caption in normal layout flow or reserve a shared footer region independent of stage height.
2. **Marsh roof ridge remains visibly undulating.** Removing rear-eave lines fixes one artifact, but the silhouette still has several small peaks and dips along a nominally straight wing. It reads as procedural geometry rather than a finished architectural roof. This is a polish gap, not a usability blocker.
3. **Ranking screenshots appear to capture the bar entrance animation.** Gray's bar is roughly one-quarter of its track on desktop and roughly three-quarters on phone, despite being the largest displayed capacity. Verify settled state uses the intended maximum and capture that state for final proof; these images alone cannot certify quantitative proportions.
4. Fine model texture, animation smoothness, Lakeview/Moore latest roof corrections and all-building consistency cannot be judged from these selected stills. Do not claim those independently passed based on this review.

Parent reports separate functional coverage: 64 tests/build passed; mobile320/390 no horizontal overflow; search/save/empty state/About; quiz five rounds plus replay; Gateway floor/room flow. These are parent-reported verification, not checks performed by this reviewer.

### Corrected final evidence: Westhampton caption

Reviewed newer `/tmp/polished-westy.png` after parent identified that the prior roof capture predated the caption patch. **Caption clipping is resolved in this newer capture:** the text sits around y707, with roughly26px clear space before the lower modal boundary. Withdraw item1 above as a remaining defect; it described stale evidence. No blocking visual defect remains in the latest supplied Westhampton view. The Marsh ridge-shape polish limitation and unverified animation/settled-chart caveats remain unchanged.
