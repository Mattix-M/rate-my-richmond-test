# Complete local residence explorer

The supported flow is campus → residence → floor/drawing → a specific room's
original layout → back to floor/campus. All published source files must remain
available. The app must distinguish reviewed individual layouts, shared-room
context, located labels, and genuinely unavailable/ambiguous layouts.

## Execution order

1. Inventory all 96 originals / 97 preview pages and 1,329 description records.
   Preserve source revisions, legacy fragments, room ranges and missing plans.
2. Finish room mapping across North Court, then all remaining residential groups.
   Combine PDF text and local OCR to locate labels. Extract candidate crop bounds
   from walls; visually review before publishing individual-room crops. Shared
   bathrooms/suites stay explicitly labeled. Do not invent geometry or room IDs.
3. Reconcile each source record with a verified room view or a specific explanation
   of missing/ambiguous evidence. Inspect source-only room labels too, especially
   Lora's room ranges; distinguish source labels from description records.
4. Make all halls/floors usable: searchable room navigation, click targets, source
   links, room details, back navigation, mobile layout and clear missing states.
   A room opened from a list must select the correct source drawing and page.
5. Validate source hashes, identity joins, crop bounds, room counts, every asset,
   all residential selectors, representative room views, keyboard/mobile navigation,
   loading/error states and stale asynchronous image loads.
6. Deliver the running local app, a reproducible data pipeline, and an honest
   coverage report. Keep source gaps visible; do not label incomplete source
   material as complete room coverage.

## Completed

All six implementation stages are complete for the supplied source collection.
The viewer includes 1,436 reviewed views, including 120 individually confirmed
Lora range members and explicit RH1 room-number aliases. Every original record
has a layout, a group-to-individual path, or a documented source conflict.
All 19 residence groups and all 97 drawing pages passed browser checks.
Eight integrity tests, static validation and all 1,629 HTTP asset checks pass.

## Remaining source limitations

Three records cannot be matched confidently from these files: RH1 0202,
Marsh 0213 and Moore C236. UFA lacks individual numbered bedroom records and
complete second-floor bedroom coverage. Archived plans and revision/as-built
uncertainty remain clearly labeled. These require better university evidence,
not additional invented geometry. See README.md and room-source-exceptions.json.
