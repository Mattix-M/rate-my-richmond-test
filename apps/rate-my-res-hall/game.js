export function shuffled(values, random = Math.random) {
 const copy = [...values];
 for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
 return copy;
}
export function questionBank(stats, research) {
 const fact = id => { const item = research.questions.find(q => q.id === id); if (!item) throw new Error('Missing verified quiz fact'); return item; };
 const hall = id => { if (!Number.isFinite(stats[id]?.capacity)) throw new Error('Missing published capacity'); return stats[id]; };
 const atlantic = hall('572483'), gray = hall('571565'), lora = hall('571574');
 const twins = fact('twins-capacity'), apartment = fact('apartment-comparison'), north = fact('new-old-north');
 const historical = (id,question,correct,options) => { const source=fact(id); return {id,question,correct,options,explanation:source.answer,caveat:source.caveat,sources:source.sources}; };
 const bank = [
  {id:'atlantic',question:'How many residents does Atlantic House list?',correct:`${atlantic.capacity} residents`,options:[12,17,83,98].map(n=>`${n} residents`),explanation:`${atlantic.name} lists ${atlantic.capacity} residents. Small enough that “I’ve never seen them before” is a little suspicious.`,sources:[atlantic.metricSources?.capacity||atlantic.sourceUrl]},
  {id:'gray-lora',question:'Which has the larger published capacity?',correct:gray.capacity>lora.capacity?gray.name:lora.name,options:[gray.name,lora.name,'Exactly the same','Neither publishes a capacity'],explanation:`${gray.name}: ${gray.capacity}. ${lora.name}: ${lora.capacity}. A difference of ${Math.abs(gray.capacity-lora.capacity)} residents. The margin is not enormous.`,sources:[gray.metricSources?.capacity||gray.sourceUrl,lora.metricSources?.capacity||lora.sourceUrl]},
  {id:'bedrooms',question:'Four residents. Which typical apartment gives each one a single bedroom?',correct:'Gateway Village',options:['Gateway Village','University Forest Apartments','Both','Neither'],explanation:apartment.answer,caveat:apartment.caveat,sources:apartment.sources},
  {id:'twins',question:'Which numbered halls list the same resident capacity?',correct:'No. 2 and No. 3',options:['No. 2 and No. 3','No. 1 and No. 2','No. 1 and No. 3','All three'],explanation:twins.answer,sources:twins.sources},
  historical('infirmary','Which hall originally included a 16-bed infirmary?','Robins Hall',['Robins Hall','Wood Hall','Dennis Hall','Marsh Hall']),
  historical('former-lodges','Which two houses started as fraternity lodges?','Atlantic and Pacific',['Atlantic and Pacific','North and South Court','Gray and Lora Robins Court','Lakeview and Westhampton']),
  historical('early-pair','Which numbered halls were completed in 1913, before campus opened?','No. 1 and No. 2',['No. 1 and No. 2','No. 2 and No. 3','No. 1 and No. 3','All three']),
  historical('ufa-exceptions','How many UFA apartments does the university list as one-level exceptions?','Four',['Four','None','Two','All of them']),
  historical('modern-pair','Which pair dates to 2014?','Gateway Village and Westhampton Hall',['Gateway Village and Westhampton Hall','Wood and Robins Hall','North and South Court','Atlantic and Pacific House']),
  {id:'north',question:'Which hall gained 63 beds when its former academic wing became housing in 2024?',correct:'North Court',options:['North Court','South Court','Gray Court','Lakeview Hall'],explanation:north.answer,sources:north.sources}
 ];
 return bank;
}
export function makeQuiz(stats, research, random = Math.random) {
 return shuffled(questionBank(stats,research),random).slice(0,5).map(q=>({...q,options:shuffled(q.options,random)}));
}
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function startQuiz() {
 const root=document.querySelector('#quiz');let rounds=[],index=0,score=0,answered=false;
 const load = async url => { const response=await fetch(url);if(!response.ok)throw new Error('Could not load quiz');return response.json(); };
 try {
  const [stats,research]=await Promise.all([load('data/housing/residence-stats.json'),load('data/housing/residence-stat-questions.json')]);
  function begin(){rounds=makeQuiz(stats,research);index=0;score=0;render();}
  function render(){answered=false;const q=rounds[index];root.innerHTML=`<div class="round-meta"><span>Question ${index+1} of ${rounds.length}</span><span data-score>${score} correct</span></div><div class="progress" aria-hidden="true"><span style="width:${index/rounds.length*100}%"></span></div><h2 tabindex="-1">${esc(q.question)}</h2><div class="answers">${q.options.map((answer,i)=>`<button class="answer" data-answer="${i}">${esc(answer)}</button>`).join('')}</div><div id="feedback" class="feedback" role="status" aria-live="polite" hidden></div><button class="next" hidden>${index===rounds.length-1?'See the damage →':'Next question →'}</button>`;root.querySelector('h2').focus({preventScroll:true});root.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>answer(Number(button.dataset.answer)));root.querySelector('.next').onclick=()=>{index++;if(index===rounds.length)finish();else render();};}
  function answer(choice){if(answered)return;answered=true;const q=rounds[index],right=q.options[choice]===q.correct;if(right)score++;root.querySelector('[data-score]').textContent=`${score} correct`;root.querySelectorAll('[data-answer]').forEach((button,i)=>{button.disabled=true;const correct=q.options[i]===q.correct;button.classList.toggle('is-correct',correct);button.classList.toggle('is-chosen',i===choice);if(correct||i===choice)button.insertAdjacentHTML('beforeend',`<small>${correct?'Correct answer':'Your answer'}</small>`);});const feedback=root.querySelector('#feedback');feedback.hidden=false;feedback.innerHTML=`<h3>${right?'Correct.':'Not quite.'}</h3><p>${esc(q.explanation)}</p>${q.caveat?`<p class="caveat">${esc(q.caveat)}</p>`:''}<div class="sources">${q.sources.map((url,i)=>`<a href="${esc(url)}" target="_blank" rel="noopener">University source${q.sources.length>1?` ${i+1}`:''} ↗</a>`).join('')}</div>`;const next=root.querySelector('.next');next.hidden=false;next.focus({preventScroll:true});}
  function finish(){const comment=score===5?'You know an unreasonable amount about campus housing.':score>=3?'Respectable. Nobody was taking attendance.':'The buildings will forgive you.';root.innerHTML=`<span class="eyebrow">THAT’S ALL FIVE</span><h2 tabindex="-1">The results are in.</h2><p class="score">${score} <small>/ ${rounds.length}</small></p><p>${comment}</p><button class="retry">Play again ↻</button>`;root.querySelector('h2').focus({preventScroll:true});root.querySelector('.retry').onclick=begin;}
  begin();
 } catch {root.innerHTML='<h2>Questions temporarily unavailable.</h2><p>We couldn’t load the verified data. Refresh to try again.</p><button class="retry">Try again</button>';root.querySelector('.retry').onclick=startQuiz;}
}
if (typeof document !== 'undefined') startQuiz();
