import {findTours,tourForHall} from './housing-tours.js';
const input=document.querySelector('#tour-search'),grid=document.querySelector('#tour-grid'),count=document.querySelector('#tour-count');
const requestedHall=tourForHall(new URLSearchParams(location.search).get('hall'));if(requestedHall)input.value=requestedHall.name;
function render(){
 const tours=findTours(input.value);count.textContent=`${tours.length} ${tours.length===1?'tour':'tours'} · Example rooms and apartments`;grid.replaceChildren();
 for(const tour of tours){
  const card=document.createElement('article');card.className='tour-card';
  const type=document.createElement('span');type.className='tour-type';type.textContent=tour.sampleLabel;card.append(type);
  const heading=document.createElement('h2');heading.textContent=tour.name;card.append(heading);
  const links=document.createElement('div');links.className='tour-actions';
  const decorate=document.createElement('a');decorate.href=`beta.html?hall=${tour.placeId}`;decorate.className='tour-open';decorate.textContent='Decorate the example →';links.append(decorate);
  const open=document.createElement('a');open.href=tour.url;open.target='_blank';open.rel='noopener';open.textContent='Original 3D tour ↗';open.setAttribute('aria-label',`Explore ${tour.name} 3D example tour`);links.append(open);
  const hall=document.createElement('a');hall.href=`./#place=${tour.placeId}`;hall.textContent='Hall & floor plans';links.append(hall);card.append(links);
  grid.append(card);
 }
 if(!tours.length){const empty=document.createElement('p');empty.textContent='No matching tours. Try a hall name or “apartment”.';grid.append(empty);}
}
input.addEventListener('input',render);render();
