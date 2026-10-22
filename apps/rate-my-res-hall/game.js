import {scoreDorms,saveHall,destinations,priorityLabels,MEAL_SOURCE,MEAL_OVERVIEW} from './dorm-match.js';
import {tourForHall} from './housing-tours.js';
export function tourActions(id){
 if(!tourForHall(id))return [];
 const hall=encodeURIComponent(String(id));
 return [{href:`tours.html?hall=${hall}`,label:'Look inside ↗'},{href:`beta.html?hall=${hall}`,label:'Try a layout →'}];
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(value,label,detail='')=>({value,label,detail});
function questions(a){
 const programs=[option('none','None / not sure')];
 if(a.year==='firstyear')programs.unshift(option('endeavor','Richmond Endeavor','The program places students in LoRo.'));
 if(a.year==='sophomore')programs.unshift(option('ssir','SSIR','The program places students in South Court.'));
 programs.push(option('other','Another program or assignment arrangement','Keep results separate until Housing confirms the rules.'));
 const activePriorities=Object.entries(priorityLabels).filter(([k])=>k==='hosting'?a.hosting==='living':k==='privacy'?a.privacy==='own':k==='cooking'?['regular','sometimes'].includes(a.cooking):k==='location'?a.destination!=='none':a.laundry==='important');
 return [
 {id:'year',title:'What year are you choosing housing for?',hint:'Your upcoming year, not the one you’re in right now.',options:[option('firstyear','First year'),option('sophomore','Sophomore'),option('junior','Junior'),option('senior','Senior'),option('law','Law student')]},
 {id:'program',title:'Does a program decide where you live?',options:programs},
 ...(['junior','senior'].includes(a.year)?[{id:'group',title:'What’s the roommate situation?',hint:'Apartment selection requires four eligible juniors or seniors, with every bed filled.',options:[option('four','We have a group of four','Everyone in the group will be a junior or senior.'),option('forming','Still assembling the group'),option('smaller','It’s just me / a smaller group')]}]:[]),
 {id:'hosting',title:'Your friends are coming over. Where are they sitting?',options:[option('living','Ideally, a living room','I want somewhere to hang out that isn’t my bedroom.'),option('bedroom','My bedroom is fine','Show me the actual room sizes afterward.'),option('elsewhere','We usually meet somewhere else')]},
 {id:'privacy',title:'At the end of the day, do you want your own bedroom?',hint:'This is about bedroom sharing. We can’t predict how quiet your neighbors will be.',options:[option('own','Yes. A door I can close.'),option('share','I’m happy sharing with a roommate'),option('either','Either works')]},
 {id:'cooking',title:'Be honest. Are you actually cooking?',options:[option('regular','Yes. I want a kitchen.'),option('sometimes','Sometimes. I still want dining.'),option('dining','I’m going to D-hall.')]},
 {id:'destination',title:'Which walk would you most like to shorten?',hint:'Choose one place you expect to visit often.',options:destinations.map(d=>option(d.id,d.label,d.detail))},
 {id:'laundry',title:'How much does laundry influence the decision?',hint:'We can compare people per washer. We don’t have live queues or reliable room-to-laundry walking distances.',options:[option('important','I want fewer people sharing each washer.'),option('neutral','I’ll work around it.')]},
 {id:'priorities',title:'What matters most?',hint:activePriorities.length?'Pick up to two of the preferences you just chose. These get extra weight.':'You haven’t picked a preference that separates the halls. We’ll show the eligible options without naming a winner.',multi:true,options:activePriorities.map(([value,label])=>option(value,label))}
 ];
}
async function startQuiz(){
 const root=document.querySelector('#quiz');let answers={program:'none',priorities:[]},step=0,places,stats;
 const load=async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Data unavailable');return r.json();};
 try{[places,stats]=await Promise.all([load('data/places.json'),load('data/housing/residence-stats.json')]);}catch{root.innerHTML='<h2>Housing details didn’t load.</h2><p>Try again in a moment.</p><button class="next">Try again</button>';root.querySelector('button').onclick=startQuiz;return;}
 const focusHeading=()=>root.querySelector('h2')?.focus({preventScroll:true});
 function render(){
  const qs=questions(answers),q=qs[step];
  root.innerHTML=`<div class="round-meta"><span>Question ${step+1} of ${qs.length}</span><button class="text-button" data-restart>Start over</button></div><div class="progress" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${step}"><span style="width:${step/qs.length*100}%"></span></div><h2 tabindex="-1">${esc(q.title)}</h2>${q.hint?`<p class="question-hint">${esc(q.hint)}</p>`:''}<div class="answers${q.options.length>6?' answers-many':''}" role="group" aria-label="${esc(q.title)}">${q.options.map(o=>`<button class="answer" data-value="${esc(o.value)}" aria-pressed="${q.multi?(answers.priorities||[]).includes(o.value):answers[q.id]===o.value}"><span>${esc(o.label)}</span>${o.detail?`<small>${esc(o.detail)}</small>`:''}</button>`).join('')}</div><p class="choice-status" role="status" aria-live="polite">${q.multi?`${answers.priorities.length} of 2 priorities selected`:''}</p><div class="quiz-actions"><button class="back" ${step===0?'hidden':''}>← Back</button><button class="next" ${!q.multi&&!answers[q.id]?'disabled':''}>${step===qs.length-1?'Find my options →':'Continue →'}</button></div>`;
  root.querySelectorAll('[data-value]').forEach(btn=>btn.onclick=()=>{
   if(q.multi){const selected=new Set(answers.priorities);if(selected.has(btn.dataset.value))selected.delete(btn.dataset.value);else if(selected.size<2)selected.add(btn.dataset.value);else {root.querySelector('.choice-status').textContent='Unselect a priority before adding another.';return;}answers.priorities=[...selected];}
   else {if(q.id==='year'&&answers.year!==btn.dataset.value){answers.program='none';delete answers.group;}answers[q.id]=btn.dataset.value;answers.priorities=answers.priorities.filter(p=>questions(answers).at(-1).options.some(o=>o.value===p));}
   root.querySelectorAll('[data-value]').forEach(b=>b.setAttribute('aria-pressed',String(q.multi?answers.priorities.includes(b.dataset.value):answers[q.id]===b.dataset.value)));
   root.querySelector('.next').disabled=false;
   root.querySelector('.choice-status').textContent=q.multi?`${answers.priorities.length} of 2 priorities selected`:'';
  });
  root.querySelector('.back').onclick=()=>{step--;render();};
  root.querySelector('.next').onclick=()=>{if(step===qs.length-1)finish();else {step++;render();}};
  root.querySelector('[data-restart]').onclick=restart;focusHeading();
 }
 function restart(){answers={program:'none',priorities:[]};step=0;render();}
 function card(r,index,uncertain=false){
  const label=uncertain?'Confirm eligibility':index===0?'Start here':'Another option';
  return `<article class="match-card ${index===0&&!uncertain?'primary-match':''}"><div class="match-label">${label}</div><h3>${esc(r.name)}</h3><ul class="match-reasons">${r.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul><p class="compromise"><strong>${uncertain?'Check first':'The trade-off'}</strong> ${esc(uncertain?r.eligibility.reason:r.compromise)}</p><div class="match-actions"><a class="explore-link" href="./#place=${esc(r.id)}">Explore hall →</a>${tourActions(r.id).map(action=>`<a href="${esc(action.href)}">${esc(action.label)}</a>`).join('')}<button data-save="${esc(r.id)}">Save to shortlist</button></div><details class="match-details"><summary>Rules &amp; details</summary><p>${esc(r.eligibility.reason)}</p><p>${esc(r.mealPlan)}</p>${r.meters!==null?`<p>${Math.round(r.meters/10)*10} m to ${esc(r.targetLabel)} in a straight line. This is not a walking route.</p>`:''}${r.ratio!==null?`<p>${r.ratio.toFixed(1)} residents per listed washer at full capacity.</p>`:''}${r.profile.bathrooms?`<p>${esc(r.profile.bathrooms)}</p>`:''}${r.id==='572061'?'<p>UFA’s washer ratio covers the whole community; laundry is in separate buildings. It does not tell you the distance from a specific apartment.</p>':''}${r.apartment?'<p>A matching layout does not mean an apartment will be available at your selection slot. Keep backups.</p>':''}<div class="source-links"><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Hall source ↗</a><a href="${esc(r.eligibility.sourceUrl)}" target="_blank" rel="noopener">Housing rules ↗</a><a href="${MEAL_SOURCE}" target="_blank" rel="noopener">Dining rules ↗</a>${r.apartment?`<a href="${MEAL_OVERVIEW}" target="_blank" rel="noopener">Apartment meal-plan exemption ↗</a>`:''}</div></details></article>`;
 }
 function finish(){
  const result=scoreDorms(answers,places,stats);
  if(result.error){root.innerHTML=`<h2 tabindex="-1">Check your answers</h2><p>${esc(result.error)}</p><button class="back">Edit answers</button>`;root.querySelector('button').onclick=()=>{step=0;render();};focusHeading();return;}
  const title=result.programDetermined?'Your program points to one hall.':!result.matches.length?'A few things to confirm first.':result.hasPreferences?'Here’s where I’d start.':'Your eligible options.';
  const notice=result.programDetermined?'Your program’s housing rule determines the match. Your preferences still help you decide what to look for in the room.':answers.year==='firstyear'?'First-year housing is assigned by the university. These options help you understand the fit; they aren’t a promise that you can choose the hall.':'These fit the published rules and your preferences. Housing confirms the actual options at selection.';
  const tied=result.matches.length>1&&Math.abs(result.matches[0].score-result.matches[1].score)<.0001;
  root.innerHTML=`<div class="round-meta"><span>Your housing shortlist</span><button class="text-button" data-restart>Start over</button></div><h2 tabindex="-1">${title}</h2><p class="question-hint">${notice}</p>${tied?'<p class="tie-note">Your answers don’t separate the leading options. They’re shown alphabetically where they tie.</p>':''}${answers.hosting==='bedroom'?'<p class="tie-note">For bedroom hangouts, compare the actual rooms next. A hall name won’t tell you how much space you get.</p>':''}<div class="match-list">${result.matches.slice(0,3).map((r,i)=>card(r,i)).join('')}</div>${result.uncertain.length?`<details class="uncertain-options" ${!result.matches.length?'open':''}><summary>Check with Housing (${result.uncertain.length})</summary><p>These are separate because the published rules don’t confirm your situation.</p>${result.uncertain.slice(0,3).map((r,i)=>card(r,i,true)).join('')}</details>`:''}<div class="quiz-actions"><button class="back" data-edit>← Edit answers</button><a href="room-compare.html">Compare room sizes ↗</a></div><p class="save-status" role="status" aria-live="polite"></p>`;
  root.querySelector('[data-restart]').onclick=restart;
  root.querySelector('[data-edit]').onclick=()=>{step=0;render();};
  root.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{let ok=false;try{ok=saveHall(localStorage,b.dataset.save);}catch{}root.querySelector('.save-status').textContent=ok?'Saved to your shortlist on this device.':'Couldn’t save in this browser. You can still explore the hall.';if(ok){b.textContent='Saved ✓';b.disabled=true;}});
  focusHeading();
 }
 render();
}
if(typeof document!=='undefined')startQuiz();
