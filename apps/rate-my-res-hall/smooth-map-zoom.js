// Preview gestures on the compositor; reproject the vector map only at checkpoints.
export function wheelZoomDelta(event) {
  const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1);
  // Keep the requested fast response, while bounding discrete mouse-wheel ticks.
  if (!pixels) return 0;
  return -Math.sign(pixels) * Math.min(Math.abs(pixels) / 45, .65);
}
export function easeZoom(current, target, elapsed) {
  return current + (target - current) * (1 - Math.exp(-Math.min(elapsed, 64) / 48));
}
export function installSmoothMapZoom(map) {
  const container = map.getContainer(), pane = map.getPane('mapPane');
  map.scrollWheelZoom.disable();
  let gesture = null, frame = 0, internalMove = false, pinchStart = null;
  const restore = () => {
    if (!gesture) return;
    pane.style.transform = gesture.transform;
    pane.style.transformOrigin = gesture.origin;
    pane.style.willChange = gesture.willChange;
  };
  const commit = (finish = false) => {
    if (!gesture) return;
    const active = gesture;
    restore();
    gesture = null;
    internalMove = true;
    map.setZoomAround(active.anchor, active.current, { animate: false });
    internalMove = false;
    if (!finish) {
      active.base = map.getZoom();
      active.current = active.base;
      active.transform = pane.style.transform;
      gesture = active;
    }
  };
  const tick = now => {
    frame = 0;
    if (!gesture) return;
    const active = gesture;
    active.current = easeZoom(active.current, active.target, now - active.lastFrame);
    active.lastFrame = now;
    const scale = map.getZoomScale(active.current, active.base);
    const origin = map.containerPointToLayerPoint(active.anchor);
    pane.style.transformOrigin = `${origin.x}px ${origin.y}px`;
    pane.style.willChange = 'transform';
    pane.style.transform = `${active.transform} scale(${scale})`;
    if (now - active.lastWheel > 100 && Math.abs(active.current - active.target) < .003) {
      active.current = active.target;
      commit(true);
      return;
    }
    // Zooming out exposes the edge of Canvas's drawing buffer. Refresh before
    // that edge becomes visible; zooming in can safely reuse the larger image.
    if (active.current - active.base < -.22 || active.current - active.base > .8) commit();
    frame = requestAnimationFrame(tick);
  };
  const flush = () => {
    cancelAnimationFrame(frame); frame = 0;
    if (gesture) commit(true);
  };
  const isControl = event => event.target.closest?.('.leaflet-control, input, select, textarea, button');
  const begin = event => {
    const now = performance.now();
    if (!gesture) {
      map.stop();
      gesture = { base: map.getZoom(), current: map.getZoom(), target: map.getZoom(),
        anchor: map.mouseEventToContainerPoint(event), transform: pane.style.transform,
        origin: pane.style.transformOrigin, willChange: pane.style.willChange,
        lastFrame: now - 16, lastWheel: now };
    }
    return now;
  };
  const targetZoom = (target, now) => {
    gesture.target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), target));
    gesture.lastWheel = now;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const onWheel = event => {
    if (isControl(event)) return;
    event.preventDefault();
    // Safari can deliver wheel events alongside its native pinch sequence.
    if (pinchStart !== null) return;
    const now = begin(event);
    targetZoom(gesture.target + wheelZoomDelta(event), now);
  };
  const onGestureStart = event => {
    if (isControl(event)) return;
    event.preventDefault();
    flush();
    begin(event);
    pinchStart = map.getZoom();
  };
  const onGestureChange = event => {
    if (pinchStart === null) return;
    event.preventDefault();
    if (!Number.isFinite(event.scale) || event.scale <= 0) return;
    const now = begin(event);
    targetZoom(pinchStart + Math.log2(event.scale), now);
  };
  const onGestureEnd = event => {
    if (pinchStart === null) return;
    event.preventDefault();
    pinchStart = null;
    // Let the existing easing finish at the exact final zoom.
    if (gesture && !frame) frame = requestAnimationFrame(tick);
  };
  const onMove = () => { if (!internalMove) { pinchStart = null; cancelAnimationFrame(frame); frame = 0; restore(); gesture = null; } };
  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('gesturestart', onGestureStart, { passive: false });
  container.addEventListener('gesturechange', onGestureChange, { passive: false });
  container.addEventListener('gestureend', onGestureEnd, { passive: false });
  container.addEventListener('pointerdown', flush, true);
  container.addEventListener('keydown', flush, true);
  map.on('movestart', onMove);
  return () => {
    flush();
    container.removeEventListener('wheel', onWheel);
    container.removeEventListener('gesturestart', onGestureStart);
    container.removeEventListener('gesturechange', onGestureChange);
    container.removeEventListener('gestureend', onGestureEnd);
    container.removeEventListener('pointerdown', flush, true);
    container.removeEventListener('keydown', flush, true);
    map.off('movestart', onMove);
  };
}
