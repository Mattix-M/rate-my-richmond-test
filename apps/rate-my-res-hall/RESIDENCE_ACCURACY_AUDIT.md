# Full residence geometry audit — 20 October 2026

## Evidence and limits

Audited all 19 housing groups against the checked-in official plan previews and named campus GeoJSON polygons. `verification-residence-source-audit.jpg` places each group's first available official floor drawing beside its named OpenStreetMap footprint. This is a source comparison, not a finished-render acceptance screenshot. The official plans have original URLs and retrieval hashes in `data/housing/index.json`; OSM provenance and collection boundaries are in `data/manifest.json`. Exact mapped outline vertices are now retained in `residence-footprints.js` and `complex-footprints.js`.

Fresh web retrieval of the [official apartment page](https://residencelife.richmond.edu/housing/upperclass/ufa-gateway.html) reached the university consent gate; the [official print map](https://www.richmond.edu/visit/maps/print/campusmap.pdf) and [university architecture archive](https://urbancampus.richmond.edu/exhibits/show/urpostwarcampus/dormitories-on-campus) failed to fetch. These failures are not confirmation of new photography. Previously researched named photographic sources remain recorded in EXTERIOR_MODEL_REFERENCE_PLAN.md. Local downloaded official floor sheets were visually inspected during this pass.

Map footprints establish horizontal exterior coverage, not every floor plate, roof pitch, window count or facade. They are OSM geometry, not measured university building surveys. Current floor-stack renderer repeats its outline across published level choices, so attic reductions, unrepresented nonresidential stories and grade changes remain approximate. Do not call the models surveyed or fully photo-matched.

## All 19 groups

| Group | Observed issue / source comparison | Correction or remaining boundary |
|---|---|---|
| Atlantic House | Former compact rectangle plus narrow rear did not preserve stepped side footprint in plan/map. | Full six-vertex mapped outline retained. Upper floors remain schematic; domestic exterior not photo-verified. |
| Dennis Hall | T silhouette broadly correct, small end/core projections simplified. | Full 11-vertex outline; main long return retained. Repeated heights/windows illustrative. |
| Gateway Village | One paired-wing template used for four different blocks; some published sheets are only half a block. | Separate full mapped 151/153/155/157 outlines, integrated by complex agent. Do not join individual apartment sheets by guessed offsets. Fourth-level reduced mass remains unresolved. |
| Gray Court | Existing stepped W-like arrangement broadly correct. | All 17 mapped exterior vertices retained; attic/roof detail remains illustrative. |
| Keller Hall | Simplified straight bar did not capture mapped offset mass; housing sheets only start on floor 3 and include polygonal end. | Full 12-vertex mapped outline. OSM and floor-plan polygonal-end detail disagree in simplification; lower nonresidential volume and exact polygonal roof require further evidence. |
| Lakeview Hall | Bent profile broadly correct, but terminal/core projections simplified. Source plans are split left/right sheets. | Full 24-vertex map outline covers both wings; retain both plan choices. Lowest shown plan is floor 2, not proof that entire building begins there. |
| Lora Robins Court | Ground-floor-derived three-pod simplification omits fuller upper-level/whole-building envelope. | Full mapped 24-vertex outline integrated by complex agent. Ground-level subset must not define whole facade. |
| Marsh Hall | Angled range/terminal return broadly present, facade projections simplified. | Full 31-vertex outline; preserve bent terminal wing. Grade/attic variation unresolved. |
| Moore Hall | Cross silhouette broadly right, end/core projections simplified; fourth floor is smaller than lower floors. | Full 24-vertex map outline. Reduced fourth-floor geometry remains unresolved rather than inferred from whole footprint. |
| North Court | Old U-shaped surrogate omitted long range extending beyond court and over-simplified near-enclosed courtyard/core. Official plan sheets split Phase II and other wing. | Full 46-vertex mapped outline retains long range and courtyard indentation. Fourth-floor source exists only for other wing: do not infer full-height court from selector count. |
| Pacific House | Plain rectangle omitted entry-side projection visible in map; plan includes curved external steps. | Full eight-vertex outline; external stairs and exact roof remain schematic. |
| Residence Hall 1 / Jeter | Generic courtyard profile conflicted with long main bar and differentiated end/core masses in official plan/map. | Full 35-vertex mapped outline replaces surrogate. Combined third/fourth plan is not a measured single story. |
| Residence Hall 2 / Thomas | Bent range retained basic identity but lost core/end projections. | Full 40-vertex mapped outline. Combined third/fourth/fifth sheet and archived second floor require honest coverage labels. |
| Residence Hall 3 / Mitchell-Freeman | Bent range broadly right, core/stair extensions omitted. | Full 28-vertex outline; legacy second-floor fragment remains separate from current full sheet. |
| Robins Hall | Existing T broadly right; small projection rhythm simplified. | Full 15-vertex outline. Exact timber/dormer positions not verified here. |
| South Court | Existing source-informed range broadly right, smaller projections simplified. | Full 17-vertex outline; fourth-floor reduction not verified. |
| University Forest Apartments | Viewer deliberately shows one representative townhouse even when selected map object is an entire numbered row/block. It is not a clipped full block. | Preserve compact model: user previously rejected repeated whole-row visualization. Clearly maintain representative-unit wording. Do not invent letter positions or uniform block counts. Full block geometry should be an additional explicitly distinguished context view if requested. |
| Westhampton Hall | Bent mass broadly right but central/terminal projections simplified. | Full 30-vertex outline. Keep floor-specific coverage separate from complete exterior envelope. |
| Wood Hall | Offset long bar broadly right; roof/end/projection details simplified. | Full 18-vertex outline. Blue dormer vocabulary supported by prior architecture reference; exact count unverified. |

## UFA clarification

The user photographs support two bedrooms, central bathroom/landing and staircase upstairs, with approximate proportions. They do not locate a unit within block 166. The address crosswalk establishes 166 A–H but not spatial ordering. Official housing identifies one-level exceptions 160F, 164H, 166A and 486A; the existing selector preserves them. A full row cannot be reconstructed by multiplying the single townhouse by an assumed count. The current compact model is a deliberate unit-level abstraction, not evidence of a full-block exterior.

The source renovation drawings mix original/proposed layouts. Prior research reports official renovation dates 2014–2017; user's preference to hide proposed diagrams must not become a claim that retained original diagrams are verified present-day layouts.

## Validation

All 16 newly mapped noncomplex hall outlines resolve through `buildingShape`, contain finite points and have positive winding for the renderer. Their complete source-vertex counts were checked. Gateway/Lora are separately owned by the complex audit. Final rendered appearance and interaction QA is the integrating agent's responsibility after the shared footprint roof renderer is installed. This audit does not claim per-level geometric accuracy or complete exterior photograph validation.

## Roof follow-up from user aerials

The user subsequently supplied identified Dennis and Gateway aerial screenshots. Dennis visibly has a joined hipped T roof, a small rear hip projection and repeated dormers. Gateway has distinct connected wings with pitched/hipped roof ranges and dormers rather than a single broad flat cap. `footprint-roof.js` now creates a continuous low-pitched illustrative hipped surface constrained to each complete concave footprint, preserving courtyard/open-wing voids. Small dormers are enabled for Dennis and Gateway based on those references; counts and dimensions remain approximate. This replaces the temporary flat roof cap but is not a surveyed roof reconstruction. Its distance-to-boundary field, including slight ridge triangulation, is a general roof approximation; other halls still need their specific dormer/roof vocabularies refined from identified references.

Roof mesh tests cover all 21 individual complete building footprints (17 halls plus four Gateway blocks): equal covered area, triangle centroids within the source polygon, finite geometry, and real pitched rise. UFA keeps its separate pitched-roof unit model.

### Further user aerial references

Inspected identified Gray Court (`2fc038bc…`), Keller (`4f2a7da5…`), Lakeview (`8021aad7…`) and Lora Robins Court (`1faed11c…`) screenshots supplied in this chat. Gray shows joined hipped ranges with small gabled dormers. Keller shows larger gabled dormers and a distinct light flat-roof attachment. Lakeview shows broad rectangular rooflights along its bent roof ranges as well as projecting gables. Lora has three substantial pods with steep perimeter roofs surrounding flat service-roof centers, not ordinary fully pitched pyramids.

Implemented Gray/Keller gabled dormer vocabulary, Lakeview rectangular rooflights, and Lora truncated-hip/mansard-style perimeter slopes with lighter flat central roof surfaces. Exact counts/positions remain illustrative. Keller's light flat attachment cannot yet be located confidently within the current mapped Z-shaped footprint from the cropped oblique image alone; it has not been arbitrarily painted onto one end. Lakeview's larger projecting gables and Lora's HVAC equipment also remain to be modeled. These explicit gaps prevent claiming complete photo-matched roof geometry.

### Marsh, Moore and North aerials

Inspected user screenshots Marsh `6a0702b3…`, Moore `243ee8c6…`, and North `cb3e55f7…`. Marsh clearly shows connected hip roofs following its bent/returning ranges, repeated small gabled dormers, and larger cross-roof projections. Moore shows the complete cross-shaped mass with joined hips, repeated dormers and larger intermediate projecting roof masses. North shows its long southwest range and courtyard complex with pitched ranges, repeated dormers, light flat-roof/tower sections and differing building heights.

Enabled gabled dormers for all three named full-footprint models; full connected roof coverage was already retained by the footprint-conforming mesh. Larger cross-gables, North's light flat towers and differing wing heights are not established by the generic roof field and remain explicit modeling gaps. Do not mistake this material/detail pass for exact reconstruction of every photographed roof feature. Atlantic/Pacific matching exterior-family direction is handled separately by the integrating agent.

### Final Robins, South, Westhampton and Wood aerials

Inspected identified screenshots Robins `159621e9…`, South `91af979e…`, Westhampton `eacf208f…`, and Wood `557df3a6…`. Robins shows the T-shaped joined pitched ranges and small gabled dormers. Wood shows its long offset range with small dormers and larger cross projections. South shows repeated dormers on its articulated roof and a distinct lower flat attachment. Westhampton has conspicuous light flat central roof strips bordered by pitched slopes, plus rectangular rooflights; a uniformly peaked hip misses this identifier.

Added Robins/Wood/South dormer treatments. Westhampton now uses a truncated pitched surface with light flat centers and rectangular rooflights, constrained to the full mapped footprint. Exact strip endpoints/widths and cross-gables remain approximate; no unsupported outer footprint extension was introduced. South's small lower flat attachment remains unresolved in height/location and was not arbitrarily flattened. Seven roof tests pass, including Westhampton plateau coverage and final dormer enablement.
