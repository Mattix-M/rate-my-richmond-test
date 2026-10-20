# Gateway and Lora Robins footprint audit

## Findings

- Gateway's four numbered buildings previously all used one generic paired-wing profile. The renderer caller supplied only the complex name, discarding the selected block number. The campus dataset already contains four individually named, materially different footprints. This was an identity/geometry issue, not evidence that all four buildings share a shape.
- Lora Robins used seven rectangular roof pieces inferred from the ground-floor sheet. Inspection of the official ground-floor preview (`data/housing/previews/20d69e4d6249b405-1.webp`) confirms three connected residential sections and a substantial central shared area; the old simplification narrowed/changed those connecting masses. The complete named map outline is a stronger exterior source than that schematic reconstruction.
- The renderer computes its viewBox from every emitted projected point. No static viewBox truncation was found in this code path; changing camera scale alone would enlarge the same incomplete shape.

## Correction

`complex-footprints.js` retains every exterior vertex from `data/campus.geojson`:

| Building | OSM way | Exterior vertices |
|---|---:|---:|
| Lora Robins Court | 264250580 | 24 |
| Gateway 151 | 264336158 | 21 |
| Gateway 153 | 264336159 | 24 |
| Gateway 155 | 264336160 | 18 |
| Gateway 157 | 264336161 | 42 |

Coordinates use a local equirectangular projection with longitude corrected by cos(latitude), then rotation to the longest edge and uniform scaling. All relative edge lengths, bays, recesses, and wing proportions are retained. Polygon winding is consistent with the existing face renderer. Gateway passes the chosen block number into shape resolution.

`footprintRoof: true` requests a perimeter-following roof cap from the renderer instead of drawing invented rectangular roofs across concavities. Roof pitch, elevation, window rhythm, and materials remain illustrative. These are complete mapped *individual buildings*, not a claim that one selected Gateway building depicts all four buildings in the complex. Published apartment drawings still describe apartments, not entire building footprints or every floor's full interior.

## Evidence and limitations

- Local map evidence: `data/campus.geojson`, originating in `data/sources/osm-campus.xml.gz`; map attribution remains available.
- Official housing identity and available plans: https://residencelife.richmond.edu/housing/upperclass/ufa-gateway.html and https://residencelife.richmond.edu/housing/first%20years/lora-robins.html . Live fetches currently redirect to university consent; existing saved official sources/previews were used for visual comparison.
- The official Lora ground-floor sheet supports the connected multi-section arrangement, but is not an exterior elevation survey. Map outlines may include minor entrance projections without proving their full height.

## Verification

`complex-footprints.test.mjs` compares every generated edge's relative length with the actual source polygon (rotation/winding independent), checks all vertex counts and camera-facing winding, and confirms all four Gateway blocks resolve to different outlines. Existing floor interaction/geometry tests also pass. This source-fidelity check guards against accidentally replacing whole buildings with generic blocks again.
