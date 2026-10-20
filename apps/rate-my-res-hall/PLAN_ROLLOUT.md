# Residence explorer rollout

## Goal

Use one clear journey everywhere: campus → real hall or apartment block → published floor → room. Keep the building selector light, animate changes of scale, and reveal details on selection. Every drawing retains its original source link and identity.

## Baseline and coverage accounting

The local collection contains 19 housing groups, 96 source files, 97 drawing pages, and 1,436 reviewed room views. These are source-backed views, not a certified count of physical bedrooms: some views include a suite, bathroom, or neighboring context. There are 1,329 original description records and 120 additional Lora Robins room records derived from explicit labels. Ten original Lora records describe ranges rather than individual rooms. Three description/drawing conflicts remain unresolved.

`data/housing/drawing-inventory.json` is the page-by-page work list. Match assets by place, plan ID, page, and source SHA256. Count these stages separately:

1. **Available original:** source and preview exist.
2. **Mapped room view:** reviewed source crop and selection target exist.
3. **Restyled source vector:** extracted source geometry has consistent presentation. This is not a manually simplified architectural redraw.
4. **Raster contour trace:** original dark-pixel boundaries converted to SVG contours and restyled. This preserves the scan’s geometry and imperfections; it is not a semantic redraw.
5. **Simplified room redraw:** each wall, opening, fixture, and label has been checked against its source, as with the North Court reference and the individually reviewed room batches below.

A vector-capable PDF is a candidate, not evidence that an attractive or accurate clean asset has passed review. PDFs containing scanned images need the same tracing work as GIFs. Selection rectangles are clickable areas, not room wall boundaries.

## Work in this build

- Extend the shared animation and navigation system across halls, respecting actual published levels and wings.
- Extract usable PDF paths into a common SVG presentation, maintaining exact source coordinates and provenance. The audit found 75 vector PDF pages, 14 image pages, and eight scanned/raster-containing PDF pages.
- Convert eligible raster pages to source-aligned SVG contours with retention checks. Keep vector extraction, raster contour conversion, and manually simplified drawings visibly distinct in metadata.
- Keep the North Court Phase II ground-floor / 013 pilot as the design reference. Its eight manually simplified room views define the format used for subsequent individually reviewed batches. Rooms 007 and 009 deliberately share one drawing showing both rooms and their shared bathroom.
- Publish the inventory and use it to expose honest coverage rather than presenting all originals as fully redrawn.

## Mapping and redraw batches

| Batch | Scope | Work and acceptance |
| --- | --- | --- |
| 1 | North Court | Apply the same palette and labels to the remaining eight sheets; inspect both wings separately. Carry the source-defined room selection into the SVG. The Phase II ground-floor set now includes 001, 003, 007, 009, 013, 015, 017, and 019. Continue to other floors only after checking each source. |
| 2 | Gateway 151, 153, 155, 157 | Preserve all 24 apartment drawing pages and 176 mapped views. Floor selection must retain block identity and offer all published apartment groups for that floor. Reuse design components, never infer equal room geometry from apartment numbering. |
| 3 | Vector-capable hall pages | Batch source-preserving conversion, then inspect Atlantic, Pacific, Gray, Keller, Marsh, Robins, South, Westhampton, Wood, Residence Halls 1 and 3, and any usable pages from mixed-format halls. The inventory determines eligibility per page, rather than per hall. |
| 4 | Scans and image plans | Convert source-pixel contours for Lakeview and image/scanned pages in Dennis, Moore, Residence Hall 2, Residence Hall 3, and Westhampton. Review the retained drawing against the original. Follow with manual architectural simplification one floor at a time; contour conversion alone does not remove scan noise or establish semantic walls. |
| 5 | Lora Robins | Retain the 120 explicitly labeled bedrooms and range-description relationships. Trace different wings/floors separately; label 12 is circulation in these source ranges, not a bedroom. |
| 6 | University Forest | Give the three published generic layouts the same style. Keep the 16 mapped blocks selectable and preserve typed unit labels such as 172A. The supplied collection does not establish individual letter-unit positions within each block; do not invent these positions. |
| 7 | Simplified individual rooms | Progress through all mapped views, prioritizing common layouts but verifying every association. Reuse a geometry template only when the source establishes the match; preserve rotations, doors, baths, and variations. |

Batches overlap where independent source work can run in parallel. A hall is complete only when every published page has either a reviewed clean asset or an explicitly identified original-only fallback; a fully redrawn collection additionally requires all desired individual room traces.

## Reviewed coverage — October 19

The enabled, visually checked batches contain **1,436 of 1,436 simplified room views** and **97 of 97 reviewed floor/layout sheets**. Counts are refreshed after stable batches in `data/housing/drawing-inventory.json`. Generated source extraction and raster contours are separate intermediate stages and are not counted as completed semantic room redraws.

| Housing | Simplified room views | Remaining |
| --- | ---: | ---: |
| North Court | 153 | 0 |
| Atlantic / Pacific | 29 | 0 |
| Keller | 19 | 0 |
| Lakeview | 65 | 0 |
| Gateway, all four blocks | 176 | 0 |
| Wood / Robins | 101 | 0 |
| Gray | 146 | 0 |
| Lora Robins | 148 | 0 |
| Marsh / South | 193 | 0 |
| Dennis / Thomas | 104 | 0 |
| Jeter | 58 | 0 |
| Mitchell-Freeman | 54 | 0 |
| Moore | 80 | 0 |
| Westhampton | 110 | 0 |

All mapped room redraws are complete. All 97 supplied floor/layout sheets are integrated. Gateway framing and the small occupied South/Jeter fourth-floor areas have dedicated reviewed fit bounds. Source hashes, room target coordinates and original previews remain unchanged.

Reviewed floor assets include exact native architectural vectors with simplified labels, manually authored layouts, and explicitly identified scan overviews. Lakeview's six and Moore's four overviews retain cleaned scan contours; the viewer calls these “Simplified scan drawing.” They are not presented as fully semantic wall traces. Individual room redraws are tracked separately.

All original sources remain available. Shared drawings remain shared where the source shows that relationship. Source conflicts and unknown UFA letter-unit positions are preserved rather than guessed. The three UFA generic layouts are standardized; no full upper-bedroom plan is invented.

Rebuild the inventory with `python3 scripts/build_drawing_inventory.py` after each stable batch. The registry in `clean-plan-assets.js` is shared by runtime loading and build validation. Tests check source joins, matching crop/canvas aspect, safe finite SVG geometry, focus bounds and preservation of shared drawings.

## Common visual format

Use warm off-white backgrounds, charcoal structural lines, a restrained green selected-room fill, and one readable type system. Preserve the source orientation and proportions. Keep dimensions only when explicitly supported; decorative furniture must not be mistaken for documented furnishings. Distinguish structural walls from selection outlines. Place labels only where they are legible, with room numbers available on focus and selection as well as hover.

Animate campus zoom, hall opening, level emphasis, floor reveal, and selected-room framing as one consistent sequence. The stacked building is an illustrative navigation model, not a surveyed exterior. Floor counts and names come from the published plan groups. Reduced-motion users receive immediate state changes; touch and keyboard users retain every action.

## Review before enabling an asset

- Check the file hash, plan ID, page number, source dimensions, and coordinate orientation.
- Compare full-page original and clean render at equal scale. Inspect walls, door gaps/swings, windows, stairs, fixtures, and irregular geometry; ensure trimming did not remove a wing.
- Check room target alignment after crop, rotation, zoom, and resize. Never turn a crop rectangle into a fabricated room polygon.
- Inspect every changed source page. Bulk automated geometry extraction does not replace this review.
- Check representative small, large, shared, and unusual rooms plus every manually simplified room. Confirm no original labels have been reassigned.
- Exercise hall → floor → room → back, alternate plan pages, source toggle, source link, direct URL, search, keyboard focus, touch viewport, and reduced motion.
- Run app data tests and build checks. Fail closed to the source view when an asset hash or identity mismatches.

## Known evidence gaps

The three unresolved description conflicts are Residence Hall 1 room 0202 versus drawing 200, Marsh 0213 absent where the drawing repeats 218, and Moore C236 versus restroom C236R. Keep the explanation instead of assigning a speculative room layout. UFA letter-unit positions and accurate exterior forms need additional evidence before location-specific or photorealistic models can be claimed.

No additional user input is needed for the existing-file batches. New source evidence would be needed to resolve those specific gaps. Continue improving source-backed views while keeping the originals accessible.
