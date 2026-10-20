# Rate My Res Hall (working title)

An independent, local-only University of Richmond campus explorer. This app is isolated from the main Rate My Richmond Next.js application. Nothing here is imported by `src/`, copied into `public/`, or added to the public build. No deployment was performed.

## Run

From the repository root:

```sh
npm --prefix apps/rate-my-res-hall start
```

Or, from any directory:

```sh
cd /Users/gpatyrin/.codex/worktrees/a394/rate-my-richmond/apps/rate-my-res-hall
npm start
```

Open **http://127.0.0.1:4174**. Requires Node.js 18+; there is no install step. The server binds only to loopback. `PORT=4175 npm start` chooses a different port. Stop with Ctrl+C. A static web server serving this directory also works; do not open `index.html` as a `file:` URL because the browser must fetch local JSON.

The app is buildless. Leaflet 1.9.4, its license, map geometry and location data are checked in. No CDN, API key, tile service, user login or Internet connection is needed to explore the local map. Links to university information require the Internet. Bookmarks are stored in this browser's local storage, not sent anywhere.

## What works

- Offline vector campus map with real building footprints, roads, pedestrian paths, greenspace and Westhampton Lake.
- 68 searchable campus places, normalized from 92 official map building records.
- 19 residential groups: the official map's 17 Residence Halls category entries plus Atlantic and Pacific Houses from the official housing directory.
- Clickable residence pins; matching OSM building outlines highlighted when an official building point is geometrically inside the footprint. No nearest-building guesses.
- Residence / all campus / saved filters, former-name search aliases, keyboard search (`/`, Enter), map keyboard navigation, pan, zoom, whole-campus framing and residence labels at closer zoom.
- Place details, official housing/map links, local bookmarks and reloadable `#place=ID` links.
- Responsive desktop/mobile layout and an interior viewer for every residence: floor/layout selectors, page selection, zoom, local originals, and source links.
- 96 original plans (82 PDFs and 14 images), 97 previews and 1,329 searchable room-description records imported from the completed collection.
- 1,436 reviewed room views, cross-floor exact room search, clickable plan labels, and reloadable hall/floor/room links. Known source conflicts, archived plans and missing coverage remain visible.

The `All campus` filter covers the imported map records, including fields and landmarks, not just buildings. Apartments and fraternity rows are grouped by their official names. Underlying component locations and original map IDs remain in the data. Group pins represent complexes rather than entrances.

## Data and provenance

See `data/manifest.json` for counts, source URLs, retrieval date, coverage bounds, limitations and SHA-256 hashes. Snapshots were retrieved October 19, 2026.

- Official map: https://maps.richmond.edu/?id=1949
- Official housing directory: https://residencelife.richmond.edu/housing/
- Current official printable map: https://www.richmond.edu/about/visit/maps/print/campusmap.pdf
- OSM data and license: https://www.openstreetmap.org/copyright

`data/sources/official-buildings.json` and `official-residences.json` preserve public Concept3D category responses for the university's map 1949 (categories 56622 and 55369). Public endpoint paths: `https://api.concept3d.com/categories/56622?map=1949&children` and `https://api.concept3d.com/categories/55369?map=1949&children`. Retrieval used the official client application's public API access mechanism; no credentials are stored in this app.

The OSM snapshot was retrieved from `https://www.openstreetmap.org/api/0.6/map?bbox=-77.548,37.568,-77.531,37.583` and is archived as `data/sources/osm-campus.xml.gz`. Generated geometry contains 2,320 features including 572 building footprints in the surrounding bounding box. These are community-mapped OSM features, not 572 university buildings. Complete multipolygon relations are assembled from their actual nodes; incomplete relations are omitted. Some ways extend outside the query box. Basemap attribution is always visible.

The university's previous `/visit/maps/print/campusmap.pdf` path now redirects to its visit page. The archived current PDF uses the `/about/visit/` path found in the live official map configuration. The much older law-school-hosted PDF was not used as the basemap.

### Limits

This is a dated snapshot, not a live feed or a claim of complete campus/residence coverage. Official map pins are not verified entrances or accessibility guidance. OSM footprints are not official architectural plans. Walking directions are delegated to the university map; this app does not invent routes or walking times. Housing pages can change; no current-year assignment or eligibility is inferred from directory sections.

Floor plans and published room-description records are integrated from a read-only copy of the separate collection. Room labels are clickable where uniquely matched; room-boundary geometry and comparison are not implemented. Classification, dimensions, bathroom and suite descriptions appear only as recorded in the source text; no adjacency or room geometry is inferred. Room lists are scoped to the published floor section, which can span multiple drawings or wings. The original collection worktree was not edited. The working name and university text are editable in `index.html`; this is an independent project, not an official university product.

## Floor-plan integration

`data/housing/index.json` joins the imported collection to stable campus place IDs. Gateway's four source building groups join to the one campus complex. The collection is copied under `data/housing/`, preserving source manifests, original bytes, source pages, extracted text and validation reports. Their original `data/housing/...` paths now resolve from this app directory.

The viewer renders lossless WebP previews generated by Poppler/Pillow. All 96 source files retain their SHA-256 hashes; the extensionless Atlantic second-floor PDF also has a `.pdf` alias for correct browser serving. `sourceUrl` points to the university, `originalUrl` to a local original, and each preview has its source page number. The housing sidecar remains authoritative and separate from the campus layer; rerunning campus preparation merges availability/reference metadata without deleting the housing data.

Known source exceptions are shown in the viewer: North Court revision differences; Lora Robins C221 → C211 correction; RH3's legacy second-floor fragment; limited published Keller/Lakeview levels; Gateway aliases; faint RH2 drawings; and UFA renovation/bathroom-only drawings. UFA's missing full second-floor bedroom layout is not filled in. Multi-floor source labels are preserved, and the two-page RH1 file has a page selector.

To re-import a verified collection (requires Python with Pillow/pypdf and `pdftoppm`):

```sh
python3 apps/rate-my-res-hall/scripts/import_housing.py /path/to/collection-repository/data/housing
python3 apps/rate-my-res-hall/scripts/prepare_data.py
```

The import reads the source collection without editing it and makes no network requests. Room views use reviewed original-source crops. Selection rectangles are click targets, not surveyed room boundaries. Room comparison remains future work.

## Hall → floor → room

Click a residence to open its published floor drawings. Click a room label or
search a room number (013 and 0013 match) to open the original room area. Search
spans all floors; selecting a result switches the floor and page automatically.
Whole floor restores the drawing. A selected room survives reloading its URL.
Shared bathrooms, room groups and adjacent context are identified in the viewer.

## Coverage completed October 19, 2026

- 19 residence groups, 96 byte-preserved originals, 97 preview pages.
- 1,329 original room-description records preserved unchanged.
- 1,316 original records have reviewed room-area views.
- 10 Lora group descriptions link to 120 individually verified bedroom labels;
  these additional records retain the parent description and provenance. Number
  12 is circulation on those drawings, so ranges are not expanded blindly.
- 1,436 total reviewed views, including all 176 Gateway bedroom records.
- RH1 0401/0402 use the explicit official aliases 400A/400B on PDF page 2.
- Three individual description records have unresolved drawing conflicts:
  RH1 0202, Marsh 0213 and Moore C236. They open their source floor and explain
  the mismatch without assigning an unsupported room image.
- UFA supplies generic apartment/renovation/bathroom drawings, not individual
  numbered bedroom records. All supplied documents remain accessible; the
  missing complete second-floor bedroom plan and as-built uncertainty are shown.

These counts describe the supplied snapshot, not a certified inventory of all
physical rooms or current housing assignments. Published revisions, archived
pages, unavailable source URLs and incomplete coverage remain in source notes.

## Data pipeline

The import reads the original collection without changing it. Source originals
and descriptions remain separate from reviewed navigation data:

- `data/housing/annotations/*.json`: authoritative reviewed crop bounds, source
  hashes, room IDs, page numbers, label positions, rotation and context notes.
  Coordinates are normalized top-left against the displayed source page.
- `source-room-records.json`: visually confirmed Lora range members with their
  parent record IDs. Original `room-descriptions.json` stays unchanged.
- `room-source-exceptions.json`: explicit source conflicts and range membership.
- `room-layouts.json` / `room-layouts/`: generated source crops and their index.
- `room-layout-coverage.json`: every source page, original-record coverage and
  separately counted additional source-room views.
- `room-labels.json`: 494 original PDF text matches across seven halls. Reviewed
  annotations provide additional clickable labels without modifying that file.

Regenerate published crops with Python containing Pillow and pypdf and with
`pdftoppm` on PATH:

```sh
python3 apps/rate-my-res-hall/scripts/render_room_layouts.py
npm --prefix apps/rate-my-res-hall run build
npm --prefix apps/rate-my-res-hall test
```

The renderer checks source SHA-256, room/floor/page identity and bounds, renders
PDF crops at 900 DPI, crops raster originals directly, and reuses unchanged
outputs. It never redraws rooms. Edit annotations and regenerate, rather than
editing generated images. All files required to regenerate published views are
included locally.

For extending the collection, `map_room_labels.py` matches unique PDF text labels.
`recognize_plan_text.swift` provides optional local Apple Vision OCR.
`propose_room_layouts.py` accepts a working directory containing rendered page
metadata, labels and optional OCR jobs/results; OpenCV/Pillow produce candidate
crops and review sheets. Candidates remain pending until visually reviewed.
The tests validate provenance and bounds, not architectural interpretation.

`npm run data` regenerates the campus map data from checked-in snapshots; it does
not regenerate housing annotations. `build` checks this independent static app
and all 1,629 source/preview/room assets. No compilation is required.

## Verification

Eight data/integrity tests and the static build check pass. All 1,629 assets
returned HTTP 200 with nonempty content. All floor/room WebP files decode.
Browser verification exercised all 19 residence selectors and all 97 drawing
pages, individual room navigation in all 18 groups with numbered room records,
UFA's source-only state, exact search, cross-floor search, page-2 aliases, deep-link
reload, shared context, whole-floor return, zoom/fit, mobile room 013 and overflow.
No application console errors were observed. See `VERIFICATION.md` for the final
check record. The main Next.js app was not changed or deployed.

## Animated building navigation

Apartment groups now expand into numbered map pins using the original numbered
Concept3D marker assets and their exact coordinates (`apartment-buildings.json`).
Gateway has 151/153/155/157; UFA preserves all 16 supplied block markers, including
164 and 172. Searching a block number or a number plus letter finds its group.
Individual UFA letter positions/entrances are not present in these source files.

Selecting a block animates the map to it, then opens an illustrated CSS 3D floor
selector. This is a navigation illustration, not an architectural exterior model.
Gateway floor buttons expose only that building's actual apartment drawings;
room search remains scoped to the selected building. Building, plan, unit and
room context survive URL reloads. The Building button returns to the cutaway.

UFA accepts a typed apartment such as 172A and opens its shared template. The
published one-level exceptions (160F, 164H, 166A, 486A) open the one-level source;
other entries use the two-level template. Entering a unit is not validation that
that unit exists, and does not claim to map its individual entrance. The supplied
upper-level file remains explicitly labeled bathroom detail only.

The default plan view hides the room directory and lengthy descriptions. Find
room opens search; room details expand on demand; room numbers appear on hover,
keyboard focus or with the # control. Mobile retains touch controls. Map movement,
cutaway entry, floor selection and image/zoom transitions respect reduced motion.

### Hall motion and clean drawings

All 17 non-apartment residence groups open an illustrated floor selector using published floors and wings. Gateway and UFA retain their real block identities. Floor selection rotates the chosen level into the plan; Map/Close/Escape can cancel the transition. Arrow keys move through floor controls. Room opening animates from its actual floor position; Previous/Next browse rooms on the same drawing. Reduced-motion preferences skip motion.

The enabled reviewed library currently includes 1,436 of 1,436 simplified room views and 97 of 97 reviewed floor/layout sheets. All supplied floor/layout sheets are integrated. The inventory distinguishes reviewed room redraws, reviewed native floor drawings, simplified scan overviews and unreviewed generated conversions.

Room redraws use the North Court palette and readable labels while preserving source-specific walls, openings, closets, fixtures and crop boundaries. Where a source crop includes extensive neighboring context, the clean view frames the selected room; the original toggle restores the complete source crop.

“Original drawing” compares the clean view with its unchanged preview, and Source opens the original. Details occupy their own area instead of covering wide layouts. Clean assets carry source hashes and page/room joins; malformed or unavailable manifests fall back to original views. Lakeview and Moore floor overviews retain cleaned scan contours and are identified as simplified scans, separately from semantic room redraws.

See [PLAN_ROLLOUT.md](PLAN_ROLLOUT.md) for the completed redraw batches and source limitations and `data/housing/drawing-inventory.json` for every page’s status. Bulk source restyling is distinct from individually simplified room redraws. The building selector remains illustrative, not an exterior survey; UFA letter-unit positions remain unknown.

## Production release

Run `npm run build` and then `npm test` in this directory. The build first restores the checksum-verified asset archive, including on a fresh clone. The standalone static output is `dist/`; no Next.js server or external runtime dependency is needed. Vercel settings are in `vercel.json`. Use a separate Vercel project with Root Directory `apps/rate-my-res-hall`, so the professor-review application remains independent.

The final release audit prompt, results, and publishing status are recorded in `research/ULTIMATE-AUDIT.md`.
