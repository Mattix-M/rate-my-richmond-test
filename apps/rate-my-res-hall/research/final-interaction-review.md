# Final interaction review

Reviewed 2026-10-20 against `ULTIMATE-AUDIT.md`. Scope: interaction implementation, interruption lifecycle, keyboard controls, gesture handling, and automated regressions. No shared `app.js` or deployment changes.

## Findings fixed

### P2 — A queued close could cancel a newly opened animation
- Reproduction: close and reopen a shared dialog before its queued native `close` event is delivered. A new arrival/flight installs its close listener; the old close event then cancels the new animation despite the dialog now being open.
- Affected: `residence-arrival.js`, `spatial-transition.js`, `building-explorer.js`.
- Fix: close cleanup checks that the dialog is actually closed. Explicit cancellation, Escape, and replacement still clean up immediately.
- Verification: regressions dispatch a previous close while the destination is open, then a real close. The new animation survives the former and cleans up on the latter.

### P2 — Changing the floor during a flight left the old decorative floor in motion
- Reproduction: enter a plan, then use the floor/page selection or another toolbar action before its arrival flight completes. The live image changes but the old architectural snapshot continues over it.
- Affected: `spatial-transition.js`.
- Fix: toolbar click/change cancels the decorative transition in capture phase. The destination stays open and the normal control continues working. Cleanup removes overlays, animation objects, hidden-stage state, and listeners.
- Verification: a simulated toolbar change while a flight is active removes its layer without closing the plan.

## Regressions covered

- Building closes after opening its destination without cancelling that destination's successful flight.
- Destination close removes flight layers and cancels animations.
- Reduced-motion arrival produces no decorative overlay.
- Return resumes focus at the selected architectural floor with `preventScroll`.
- Replacement residence arrivals clean up the previous animation once.
- Prior gesture tests cover Safari native pinch, duplicate wheel suppression, bounded zoom, cursor anchoring, and cancelled drag click suppression.
- Quiz tests cover ten sourced questions, five unique rounds, shuffled options, and missing-data failure.

## Validation

`npm test`: **72 passed, 0 failed** after these changes. Eight focused arrival/transition tests passed independently. Test doubles validate lifecycle ordering and state; they are not rendered visual evidence.

## Assessment and limits

- Interaction implementation: **8/10 provisional**. Primary interruption and handoff cases now have regressions, native buttons support keyboard input, and return restores floor focus. Physical trackpad feel and actual browser event timing still require parent/browser confirmation.
- Accessibility implementation: **7/10 provisional**. Native dialog/button controls and keyboard floor navigation are present. No screen-reader session or full tab-order traversal was performed in this subtask.
- Visual polish, visual consistency, voice, and interest: **not independently scored here**. Those require the parent rendered review and copy/design audits; passing state tests is insufficient evidence.

Not tested here: actual Safari hardware pinch, iOS touch, screen-reader announcements, desktop/mobile rendered states across every residence, CSS transitions under real dropped frames, or the deployed URL. Parent is conducting browser/release verification separately. This review does not certify precise building geometry or all device/browser combinations.

## Subsequent smoothness regression investigation

Source inspection found overlapping expensive effects: a detailed SVG scale/translate, full-dialog background/border/shadow keyframes, and continuously changing backdrop blur over the moving Leaflet map. The floor-flight snapshot also carried a large drop-shadow filter.

Changed shared motion without removing the map-origin zoom: hall/Gateway arrivals use one `translate3d + scale` animation with temporary layer promotion; cleanup restores the prior `will-change`. Hall and UFA backdrop entrances now fade a static scrim rather than animating blur. Whole-dialog paint-property materialization is disabled. UFA's preserve-3d model transformations remain untouched. Flight snapshot filter was removed; the live plan stage is promoted only while its transition is active. Duration remains 850ms and the existing underlying map fly remains unchanged.

Validation after this patch: **73 tests passed**, including arrival coordinate endpoints, layer-hint restoration, interruption cleanup, and reduced motion. These changes remove identified paint work; no claim of measured FPS or hardware smoothness is made. Parent must review the rendered movement in the user's browser before declaring the complaint resolved.
