// Shared entrance for flat SVG hall/Gateway models. UFA keeps its CSS-3D
// implementation so opacity never flattens its preserve-3d geometry.
const arrivals=new WeakMap();
export function cancelResidenceArrival(dialog){arrivals.get(dialog)?.();}
export function animateResidenceArrival(dialog,origin){
 cancelResidenceArrival(dialog);
 dialog.classList.remove('residence-arrival-finished');
 if(!origin||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const model=dialog.querySelector('.interactive-building');
 if(!model)return;
 const rect=model.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 dialog.classList.add('residence-spatial-arrival');
 // The SVG has thousands of paths. Promote the whole model rather than
 // re-rasterizing independent SVG scale/translate properties each frame.
 const previousWillChange=model.style.willChange;
 model.style.willChange='transform';
 const animation=model.animate([
  {transform:`translate3d(${origin.x-rect.left-rect.width/2}px, ${origin.y-rect.top-rect.height/2}px, 0) scale(.035)`},
  {transform:'translate3d(0, 0, 0) scale(1)'}
 ],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});
 let finished=false;
 const clean=()=>{if(finished)return;finished=true;animation.cancel();model.style.willChange=previousWillChange;dialog.classList.add('residence-arrival-finished');dialog.classList.remove('residence-spatial-arrival');dialog.removeEventListener('close',onClose);dialog.removeEventListener('cancel',clean);arrivals.delete(dialog);};
 const onClose=()=>{if(!dialog.open)clean();};
 arrivals.set(dialog,clean);dialog.addEventListener('close',onClose);dialog.addEventListener('cancel',clean);
 animation.finished.then(clean,clean);
}
