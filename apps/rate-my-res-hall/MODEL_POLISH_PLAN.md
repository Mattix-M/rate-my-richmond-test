# Recognizable building models: polish and acceptance plan

2026-10-19. Based on the current implementation, its saved UFA screenshot, existing floor drawings, the user's UFA upstairs images, and the evidence recorded in `EXTERIOR_MODEL_REFERENCE_PLAN.md`. This audit does not claim a new inspection of every linked exterior photograph.

## Target

Make each building recognizable through its shape, roof, entrance and material balance. Exact surveying is unnecessary. Keep the successful UFA floor-selection interaction while improving the architectural object that it acts on.

Recognition should come before texture: a convincing roof profile and correct arrangement of wings matter more than individual bricks. A label-hidden comparison against a reference photo is the principal visual review.

## What currently breaks the illusion

1. The UFA screenshot shows two long rectangular slices with a nearly flat roof. The roof illustration is painted on one planar surface; its ridge does not change the silhouette. Real roof slopes, eaves and end gables would make the largest difference.
2. The existing exterior renderer reuses a few boxes for unrelated buildings. Most hall shapes do not derive from their individual plan footprints. North Court, Gray, Moore and Keller especially require different massing.
3. Fixed window repetition, a single centered entrance, and the same façade color make every building look interchangeable. These details are approximate and should not be presented as verified counts.
4. Architecture and floor exploration are different objects: the exterior SVG disappears into a generic rectangular floor stack. Preserve footprint and material continuity through that transition.
5. Strong uniform outlines and overly regular bright mortar lines read as a diagram. Use subdued brick variation, recessed windows, lighter stone trim, roof overhang shadows and contact shadows. Avoid adding photoreal textures before the geometry is convincing.

## Rendering boundary

`exterior-models.js` uses a fixed projection of 3D coordinate tuples into SVG. That can produce a good architectural illustration, but the resulting SVG is a fixed view, not a freely orbitable 3D model. The UFA selector uses CSS planes in perspective; its roof artwork does not currently create a pitched roof volume.

For the immediate polish, original SVG façades plus actual CSS roof planes can improve the UFA substantially without replacing its interaction. Building-specific projected geometry can improve the hall introduction views.

If free camera rotation is introduced, move the architecture to a shared mesh/scene representation with genuine roof, façade and footprint geometry. Do not advertise rotation of a flat SVG as a 3D orbit. The same data should drive assembled building and separated floors so they retain orientation and silhouette. Keep accessible HTML controls and the readable SVG plan viewer outside the rendering engine.

## Parallel ownership and rollout

| Pass | Scope | Deliverable |
| --- | --- | --- |
| A | UFA / Gateway architecture | Townhouse roof and entrance vocabulary; taller Gateway mass with its own roof and bays; reusable materials but distinct silhouettes |
| B | Historic halls | North Court courtyard/arch mass, one Tudor pilot, then distinct Gray/Moore/Keller variants |
| C | Integration / quality | Stable hover targets, no face flicker, reversible transitions, full-size plans, responsive and reduced-motion verification |
| D | Remaining coverage | Extend validated parts to other halls, after checking each footprint and reference confidence; improve low-evidence façades as photos become available |

Start with UFA 166, North Court, Gateway and Jeter. Do not call all 19 halls polished merely because they have an illustrative icon.

## Pilot acceptance criteria

### UFA 166

- Recognizable compact brick townhouse mass with dark pitched roof, light trim and small entrance canopy vocabulary, supported at UFA-family level by the contractor reference.
- Roof has a visible ridge and end profile rather than a flat deck with a painted ridge line. Roof and walls meet coherently in the assembled state.
- Floors begin close enough to read as one building; hovering lifts only the selected level. Do not distort the entire building to provide hover feedback.
- Existing shared upstairs reconstruction shows the two bedrooms and central bathroom/landing from the user's images. Those images supersede the older research note that only the bathroom reference exists.
- 166A remains a one-level exception. Selecting its layout is not evidence that the whole 166 block has only one story.
- No assumed A–H positions or purported exact window counts. Exact block-166 exterior remains unconfirmed.
- Expanded plan fills its usable viewer area; roof and façade fade away without obscuring the plan. Fold-back returns to the same architectural pose.

### Gateway

- Four occupied floor choices and taller apartment proportions; distinct from the low townhouse UFA silhouette.
- Use the selected block's available floor footprint, with plausible roof pieces and bay/entry treatment checked against the named official gallery.
- 151/153/155/157 retain distinct identities and navigation. A common building family does not imply identical verified elevations.
- Any detailed bay, chimney or entrance placement remains approximate until its photograph is inspected.

### North Court

- Courtyard, wings, steep roofs and pale stone arch vocabulary must be apparent with its label hidden.
- Use available floor footprints to position wings; roof pieces should join rather than intersect arbitrarily.
- Tower/entrance emphasis must correspond to the photographed architectural mass. A generic tall center box is insufficient.
- Floor separation preserves courtyard void and wing arrangement instead of becoming solid rectangular slabs.
- Architect galleries supply stronger exterior evidence than the low-confidence groups, but no floor sheet alone establishes exact façade height.

### Tudor pilot: Jeter, then Thomas / Wood / Robins

- Brick lower walls, selective pale infill/dark timber, pitched roofs and dormer vocabulary.
- Put timber accents on photographed gables or upper portions rather than a universal decorative stripe.
- Give each building its own footprint, roof breaks and entrance placement. Do not clone Jeter and change only its title.
- Use blue dormer accents for Wood/Robins only to the extent supported by the recorded architectural reference.
- Thomas needs its own photo comparison before claiming a fully building-specific elevation.

## Evidence and unknowns

- Stronger building-specific exterior evidence: North Court and Jeter.
- Useful family or architectural evidence, with photo inspection still incomplete in the earlier research: UFA, Gateway, Thomas, Wood, Robins, Moore, Marsh, Gray, Westhampton and Keller.
- Named photos exist but detailed appearance was not established in the earlier pass: Lakeview.
- Exterior appearance remains weakly supported: Dennis, Mitchell-Freeman, South Court, Lora, Atlantic and Pacific. Use plan-supported massing and restrained provisional details until resolved.
- UFA user photos now support approximate upstairs spatial relationships. They do not establish measured dimensions or exterior elevations.
- The user's choice to exclude proposed UFA drawings is a display requirement. The retained older source is not independently verified as today's exact renovation state.

Reference links and identification caveats remain in `EXTERIOR_MODEL_REFERENCE_PLAN.md` and `UFA_EXTERIOR_REFERENCES.md`.

## Integration gate

- Compare each pilot against its named reference at both desktop size and a narrow viewport.
- Exercise hover at slice edges repeatedly; moving geometry must not repeatedly enter/leave its own hit target.
- Check assembled, hovering, expanding, fully expanded and folding states for missing walls, roof clipping, depth conflicts and sudden scale changes.
- Clicks still select; drags pan/rotate without accidental selection; pinch zoom is cursor-centered in plans. Fit restores the initial readable frame.
- Verify keyboard focus, Escape/back navigation, touch selection and reduced motion.
- Preserve source access and plan-specific semantics. Do not replace missing evidence with invented precise unit placement.
- Report the implemented pilots separately from approximate coverage models.

## First polish pass delivered

Three agents handled apartment architecture, historic-hall architecture, and visual audit. Integrated UFA townhouse façade from an inspected contractor photo, two raised CSS roof planes, and a Gateway-specific exterior from an inspected university gallery photo. North, Jeter, Wood and Robins now use distinct architectural illustrations; those hall details remain more interpretive because direct photo retrieval was incomplete. Remaining groups retain the prior approximate family models.

Verified UFA lower/upper selection and preserved focused plans; Gateway model renders in its selector. Added residence-dispatch regression coverage to prevent apartment overrides from replacing halls. Hall models remain fixed-view SVG illustrations; UFA roof/slices are CSS3D geometry. The next pass should carry individually verified hall footprints into floor separation, then refine the remaining hall identities. The 166A title now explicitly identifies a one-level unit, not an entire one-story block.

## 2026-10-20 integrated polish audit

All 17 hall/house viewers and Gateway now use architectural floor groups with face-based pointer targets, stationary green hover, compact floor spacing, framed glazing, trim, entrances and roofs. All UFAs retain the immersive townhouse viewer and their four published single-level exceptions. Floor groups preserve the supplied source labels, including shared multi-floor drawings; the illustrations are not surveyed elevations.

Selection isolates a level. Multiple wing/apartment options remain explicit; single-current-plan levels enter directly. Back to building restores the full model; Escape cancels pending entry or folds selection before closing. The selected level expands and turns into plan entry, with reduced-motion alternatives and uninterrupted dialog focus. Plans retain drag/pinch navigation and room selection.

Browser audit rendered every hall/house at desktop scale. Exercised North first-floor wing selection and room0102 on mobile, Gray second-floor entry and restored selection, and Gateway157 floor2 apartment selection/reset. All published hall floor groups have regression coverage for reachability; named roof masses have coverage against courtyard bridging.

Exterior evidence confidence remains separate from interaction completeness. `interactive-building-profiles.js` records the source basis and confidence of every building. Low-confidence facades are intentionally schematic. Do not describe them as measured replicas or infer exact unit letters/window counts.

Final reference pass replaced provisional rectangular masses with inspected source-plan outlines for Dennis, South, Lora, Westhampton, Lakeview, Thomas, Freeman, Marsh, Atlantic and Pacific; corrected Robins to a T and Wood to a near-straight offset range. Angled roof pieces support rotation and intentional elbow overlap. All 19 profile identities now have explicit source metadata; exterior material/detail remains illustrative. Final verification:37 tests pass;4516assets validate; all17 hall/house viewers visually inspected in a contact sheet, plus Gateway selection/reset and existing UFA flow. Westhampton's four angled levels each expose visible wall hit targets. No deployment performed.
