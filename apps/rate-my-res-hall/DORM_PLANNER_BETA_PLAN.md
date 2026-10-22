# 3D dorm planner beta

## Outcome
A working Beta tab with a small, honest proof of the idea: pick a supported Richmond room, orbit its 3D cutaway, add and move recognizable furniture, rotate and resize pieces, and keep a layout on this device. The first release favors a few source-reviewed rooms over fabricated coverage.

## Work streams
1. **Source geometry:** inspect existing drawings and dimension records; curate room outlines, doors and windows; retain provenance. Published dimensions provide approximate scale, not a survey. Wall height and furniture sizes are editable or explicitly illustrative.
2. **3D scene:** render a real perspective scene with a floor, cutaway walls and recognizable furniture. Orbit, zoom, top view, selection and drag work with mouse and touch. Render on changes, not continuously. Handle missing WebGL gracefully.
3. **Interface:** add Beta to navigation; use existing typography and colors. Keep the scene primary, tools compact, and methods collapsed. Provide furniture buttons, selected-piece controls, rotation, removal, undo, reset and saved-state feedback. Mobile controls must not obscure the scene or bottom navigation.
4. **Placement:** keep pieces inside the room; show overlap feedback; support numeric placement for keyboard users. Never imply approximate furniture is the university's supplied inventory. Preserve per-room layouts locally and guard corrupt saved data.
5. **Verification:** test geometry and storage boundaries; exercise changing rooms, dragging, orbiting, rotating, adding/removing, undo, reset and reload. Review desktop and phone screenshots. Check existing tests and production build.
6. **Independent review and repair:** ask an agent to critique the integrated feature, prioritize broken interactions and misleading scale over cosmetic extras, fix findings and repeat relevant checks.

## Release boundary
This beta is a room-arrangement sandbox, not an architectural measurement or an accurate inventory of supplied furniture. No account, collaboration backend, checkout, or exhaustive room coverage is needed for the proof. Source drawings and limitations stay available in closed details. Add more rooms only after their actual outlines are reviewed.

## Next iteration after feedback
More source-verified rooms; furniture catalog based on measured campus inventory; door-swing clearance; room-specific links from the explorer; downloadable layouts; roommate sharing; richer materials and lighting. Do not substitute crop bounding boxes for actual room boundaries.
