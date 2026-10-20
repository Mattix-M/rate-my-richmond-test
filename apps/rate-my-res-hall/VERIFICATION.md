# Local build verification — October 19, 2026

## Result

Hall → floor → individual room works with the supplied collection. The local app
is served at http://127.0.0.1:4174/. No deployment or main Next.js change was made.

## Automated checks

- `npm --prefix apps/rate-my-res-hall test`: 8 passing integrity tests.
- `npm --prefix apps/rate-my-res-hall run build`: syntax, JSON and 1,629 assets valid.
- `node apps/rate-my-res-hall/scripts/check-http.mjs`: all 1,629 originals,
  floor previews and room views returned HTTP 200 with nonempty bodies.
- Pillow successfully decoded the 97 floor previews and 1,434 initial room views;
  the final two RH1 alias images were rendered and visually reviewed separately.
- Tests verify all 96 original hashes; unique room IDs; building/floor/page joins;
  source hashes; crop bounds; reviewed status; all 120 range-member parent links;
  and a layout or explicit exception for every original description record.

## Browser checks

Using the local app in the in-app browser:

- All 19 residence choices and all 97 drawing pages loaded successfully.
- Individual source crops opened successfully in every one of the 18 groups
  that has numbered room records. UFA correctly remains source-only.
- Search from North Court ground level to 0141 selected the other-wing first
  floor and the correct crop. Exact search accepts 013 for stored ID 0013.
- Lora A004 search returned one exact result; opening and reloading restored
  its room image. Group A004–A016 offered 12 individual links; A016 opened.
- RH1 0401 resolved its explicit 400A alias to page 2; a deep-link reload
  restored the same room. RH1 0202 showed the genuine source-number mismatch.
- Whole floor restored labels; Enter on room 0013 opened its crop; zoom reached
  150% and Fit restored it. Close/Escape returned to the campus view.
- At 390×844, room 013's bedroom, entry and bathroom were visible without
  horizontal document/dialog overflow. Viewport override was reset afterward.
- Temporarily withheld one generated room image: the viewer showed the specific
  image-unavailable message with Whole floor and Open original recovery controls.
  The file was restored, and reload displayed the normal room view again.
- No application console errors were observed during ordinary navigation. The
  deliberate missing-image test produced its expected failed image request.

## Evidence limits

There are 1,436 reviewed room views: 1,316 original individual records plus 120
source-confirmed members of Lora's 10 description ranges. Three original records
remain unmatched: RH1 0202, Marsh 0213 and Moore C236. UFA has generic layouts and
incomplete second-floor bedroom coverage. Archived drawings and as-built status
remain source limitations. This is not a certified current physical-room survey.

## Animation / apartment navigation pass

- Numbered blocks: 20 source markers (4 Gateway, 16 UFA) retain their exact
  official coordinates and numbered asset identities; Gateway floors match
  their building-specific source plans.
- Gateway 157: all four floor buttons return the correct apartment groups;
  floor 2 → 15720/15721 → room 15720A loaded correctly, with room search closed
  and source details collapsed afterward.
- UFA 172A opens the shared two-level template; reload retains unit context.
  UFA 164H opens the correct one-level exception. A routing mismatch discovered
  in this check was corrected and covered by an actual-source regression test.
- Verified the building selector at mobile/default width and at 1440×1000.
  Floor controls are separate, accessible 2D buttons controlling the 3D layers;
  this avoids overlapping 3D surfaces intercepting clicks.
- Added reduced-motion CSS and map/image motion guards. All generated room
  assets and existing provenance checks remain unchanged.

## Unified hall animation and North Court vector pilot — 2026-10-19

- App test suite: 15/15 pass. Build validates 1,631 local source/preview/layout assets, including the two clean SVGs.
- Browser verified at mobile panel width and 1440×1000: North Court → Ground → Phase II → room 013, original/clean switch, return to whole floor, return to selected floor picker, and refresh/live hash deep links.
- Lakeview → Second → Right verified by keyboard; unredrawn drawings correctly use the source preview and hide the clean-view switch. No console errors or warnings observed.
- All 17 non-apartment groups retain every published plan exactly once in their floor selectors. Shared-floor source documents remain grouped; missing floors are not invented.
- Floor markers remain in original page coordinates, including when clean-plan margins are cropped for display. Removed dots over the clean SVG’s persistent room numbers until hover/focus.
- Screenshots: verification-clean-room-013.png and verification-hall-selector.png. Temporary desktop viewport reset after checking.
- Scope: one clean Phase II ground-floor drawing and room 013; other drawings retain reviewed source previews. The selector is illustrative, not an exterior survey.
- An accidentally invoked repository-root test run reached unrelated tests that require an absent `typescript` package. No root application code was changed; the residence explorer's independent suite/build pass.

## Broad drawing rollout and room motion — 2026-10-19

- 20 app tests pass; build validates 2,994 local assets. Generated-asset checks cover exact source/page hashes, reviewed room joins/bounds/orientations, native finite SVG content, manual source joins, and complete generated-or-documented-fallback accounting.
- 75 PDF-vector floors / 1,068 rooms and 18 raster-traced floors / 196 rooms are available. Four floors and 172 rooms retain originals. 132 coarse raster room traces are opt-in; their originals display by default.
- Eight North Court Phase II ground-floor room records now use seven manually simplified SVGs. Shared rooms 007/009 preserve their shared bathroom and common drawing.
- All 1,143 generated native-vector SVGs rendered successfully in batch validation. Font sizes recover source scaling; vector paths preserve paint order and white masking. Raster traces retain thresholded source pixels exactly, without claiming recovered detail.
- Browser checked: North Court 001,003,007/009,015,017, source toggling and live deep links; Lakeview floor and low-resolution room fallback; Gateway157 floor2 →15720A→15720B; Westhampton colored-plan fallback and canceling an in-progress entry using Map. No browser errors/warnings observed.
- Previous/Next navigation preserves drawing identity. Hall changes synchronize the campus selection. Selected room details occupy a separate desktop column so they cannot obscure wide shared layouts.
- Room entry animates from its actual source bounds, including rotated crops. Hall/apartment entry shares a cancellable selected-floor transition. Reduced-motion branches skip animation and timers.
- Proof: verification-north-shared-007-009.png. Desktop and mobile layouts checked; temporary viewport overrides reset.

## Completed source-backed redraw rollout — 2026-10-19

- Enabled coverage: 1,436/1,436 simplified room views (1,433 distinct SVGs) and 97/97 reviewed floor/layout sheets across 19 housing groups. No supplied mapped view remains original-only.
- All 21 app tests pass. Static build validates 4,516 source, preview, and layout assets. Checks retain source hashes, page identity, hotspot coordinates, finite SVGs, crop orientation and focus bounds. Hand-traced floor metadata is explicitly supported alongside source vectors and scan overviews.
- Browser smoke-tested all 19 residence selectors; the final seven Dennis/Thomas sheets each load their enabled manual SVG. No browser console errors observed.
- Representative desktop/mobile flows checked: North first floor → 0102 → next 0105; Gateway block 157 → third floor → 15732C; Thomas ground → 0019B → original drawing; Lora C005A selection; South fourth-floor two-room focus. Original toggles and return navigation remain available.
- Visually reviewed the final seven Dennis/Thomas overview renders, plus the integrated North, Gray/Jeter, Lakeview and Atlantic/Pacific floor batches. Gateway fit bounds checked against all 24 source sheets.
- Saved final desktop proof: verification-complete-dennis.jpg. Temporary viewport override reset afterward.
- Floor sheets include reviewed native vectors, manually traced architecture, and explicitly identified cleaned scan overviews. Three source numbering conflicts and unknown UFA letter-unit placement remain documented; no unsupported room location or exterior geometry is invented.

## UFA 166 spatial prototype

- Block 166 uses a persistent scene: whole slice hover/focus, direct slice selection, perspective rotation/expansion into the same drawing surface, and reverse fold-back. Map camera approach is retained. Other buildings retain their existing viewer.
- Explicit layout switch preserves the official 166A one-level exception. Shared living renovation drawing and incomplete upper bathroom detail are labeled as such.
- Browser checked desktop and narrow-screen layout, living/bath selection, keyboard activation, fold-back, and one-level selection. Increased vertical separation after browser testing found the upper surface could intercept a lower-surface click; desktop lower-surface click then resolved the correct living source.
- Reduced-motion CSS disables scene animations. Escape folds an expanded plan before closing the building. No console errors observed. Existing 21 data/navigation tests and static build pass.
- Exterior reference research is recorded in UFA_EXTERIOR_REFERENCES.md. No block-specific surveyed façade is claimed.

## Exterior models, stable spatial transitions and gestures

- Two parallel agents delivered illustrative exterior family models and a consolidated UFA spatial viewer. Parent integrated model previews into hall/apartment selectors. All19 groups have profiles; low-evidence buildings remain provisional family silhouettes, not detailed replicas.
- Removed the inherited hover brightness filter on UFA buttons: CSS filters flattened3D descendants and hid walls. Hover now lifts a pointer-transparent shell inside a stationary hit plane.
- Added general floor-viewer drag pan and cursor-anchored pinch zoom. Automated tests cover drag-click suppression and anchor preservation/zoom limits. Native trackpad hardware gestures were not directly simulated in browser QA.
- Browser verified Gray Court200% drag changed scroll by170px/120px without selecting a room; model→First→Explore rooms returned a loaded floor SVG. UFA lower-slice click,1.3x zoom, drag(-110,-50), Fit, fold and166A source selection passed. No console errors observed.
-23 tests and build validation pass. Final desktop screenshot:verification-ufa-model-integrated.jpg; narrow viewport also reviewed and desktop override reset.
