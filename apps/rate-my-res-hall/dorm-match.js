import {evaluateHousing} from './eligibility.js';
import {housingProfiles} from './housing-profiles.js';
import {laundryHalls,summarizeHall} from './laundry-data.js';

// Verified in the live university pages on 2026-10-22 (overview states 2026–27 dates).
export const MEAL_SOURCE='https://dining.richmond.edu/meal-plans/Requirements.html';
export const MEAL_OVERVIEW='https://dining.richmond.edu/meal-plans/index.html';
export const APARTMENTS=new Set(['572061','572073']);
const YEARS=new Set(['firstyear','sophomore','junior','senior','law']);
export const priorityLabels={hosting:'Space to have people over',privacy:'My own bedroom',cooking:'A kitchen',location:'Location',laundry:'Laundry'};
export const destinations=[
 {id:'571566',label:'D-hall',detail:'Heilman Dining Center'},
 {id:'571951',label:'The gym',detail:'Weinstein Center for Recreation'},
 {id:'571523',label:'The library',detail:'Boatwright Memorial Library'},
 {id:'571521',label:'Business classes',detail:'Robins School of Business'},
 {id:'571564',label:'Science classes',detail:'Gottwald Center'},
 {id:'571569',label:'Jepson Hall',detail:'Classes in Jepson Hall'},
 {id:'571524',label:'Music classes',detail:'Booker Hall'},
 {id:'none',label:'No particular building',detail:'Leave location out of the ranking'}
];
export function distanceMeters(a,b){
 if(!a||!b||![a.lat,a.lng,b.lat,b.lng].every(Number.isFinite))return null;
 const rad=n=>n*Math.PI/180,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);
 const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function mealPlanFor(id){
 if(APARTMENTS.has(String(id)))return 'Spider 50, Unlimited, or no meal plan; confirm any individual requirements with Dining.';
 if(['572483','572484'].includes(String(id)))return 'A meal plan is required; Dining lists Spider 50 and Unlimited options for these houses.';
 return 'Spider Unlimited is required, with an optional Plus upgrade.';
}
export function validateAnswers(a={}){
 if(!YEARS.has(a.year))return 'Choose the year you’re selecting housing for.';
 if(a.program==='ssir'&&a.year!=='sophomore')return 'SSIR is a sophomore program. Check your year and program.';
 if(a.program==='endeavor'&&a.year!=='firstyear')return 'Endeavor is a first-year program. Check your year and program.';
 if(new Set(a.priorities||[]).size>2)return 'Choose at most two priorities.';
 return null;
}
export function scoreDorms(answers,places,stats){
 const error=validateAnswers(answers);
 if(error)return {error,matches:[],uncertain:[],excluded:[]};
 const target=places.find(p=>String(p.id)===answers.destination),targetLabel=destinations.find(d=>d.id===answers.destination)?.detail;
 const laundry=new Map(laundryHalls.map(h=>[h.id,summarizeHall(h)]));
 const priorities=new Set(answers.priorities||[]),matches=[],uncertain=[],excluded=[];
 for(const place of places.filter(p=>p.residential&&stats[String(p.id)])){
  const id=String(place.id),info=stats[id],apartment=APARTMENTS.has(id),gateway=id==='572073';
  let eligibility=evaluateHousing(id,{year:answers.year,program:answers.program==='other'?'none':answers.program});
  if(eligibility.status==='notmatch'){excluded.push(id);continue;}
  if(answers.program==='other')eligibility={...eligibility,status:'confirm',reason:'Your program or assignment exception may have different rules. Confirm this hall with Housing.'};
  if(apartment&&answers.group!=='four')eligibility={...eligibility,status:'confirm',reason:'Apartment selection needs four eligible juniors/seniors and all beds filled. Confirm your group before treating this as an option.'};
  const metrics=[],ratio=laundry.get(id)?.residentsPerWasher??null,meters=distanceMeters(place,target);
  const add=(key,value,reason,tradeoff)=>metrics.push({key,value,weight:priorities.has(key)?3:1,reason,tradeoff});
  if(answers.hosting==='living')add('hosting',apartment?1:0,apartment?'A separate shared living room gives you somewhere to have friends over.':null,apartment?null:'A separate living room within your unit is not established for this hall; check individual layouts.');
  if(answers.privacy==='own'){
   const singles=answers.program!=='endeavor'&&info.roomTypes?.some(t=>/single/i.test(t));
   add('privacy',gateway?1:singles?.65:0,gateway?'Gateway’s standard apartment has four single bedrooms.':singles?'Published room types include singles; you would need to secure one.':null,answers.program==='endeavor'?'Endeavor uses doubles; singles require an approved accommodation.':id==='572061'?'Typical UFAs have two shared double bedrooms, even though the living room is separate.':gateway?null:'A single-bedroom preference depends on the specific room available.');
  }
  if(answers.cooking==='regular')add('cooking',apartment?1:0,apartment?'An apartment kitchen supports cooking regularly and more meal-plan choice.':null,apartment?null:'A private apartment kitchen is not established here, and residence-hall meal rules still apply.');
  if(answers.cooking==='sometimes')add('cooking',apartment?1:.5,apartment?'You can use the kitchen and still keep an Unlimited meal plan.':null,null);
  if(target&&meters!==null)add('location',Math.max(0,1-meters/1400),`About ${Math.round(meters/10)*10} m from ${targetLabel}, straight-line.`,`${targetLabel} is about ${Math.round(meters/10)*10} m away in a straight line; the actual walking route is longer.`);
  if(answers.laundry==='important')add('laundry',ratio===null?.5:Math.max(0,Math.min(1,(40-ratio)/30)),ratio===null?null:`${ratio.toFixed(1)} residents per listed washer at full capacity.`,ratio===null?'A residents-per-washer comparison is unavailable for this hall.':`${ratio.toFixed(1)} residents per listed washer; this does not predict queues or show live availability.`);
  const denominator=metrics.reduce((sum,m)=>sum+m.weight,0);
  const score=denominator?metrics.reduce((sum,m)=>sum+m.value*m.weight,0)/denominator:0;
  const ordered=[...metrics].sort((a,b)=>b.weight*b.value-a.weight*a.value);
  const reasons=ordered.filter(m=>m.reason).slice(0,3).map(m=>m.reason);
  if(!reasons.length)reasons.push('This hall fits the published year and program rules you selected.');
  const compromise=[...metrics].filter(m=>m.tradeoff).sort((a,b)=>a.value-b.value||b.weight-a.weight)[0]?.tradeoff||'Room layouts and availability vary. Check the exact room before selecting.';
  const row={id,name:info.name||place.name,score,eligibility,reasons,compromise,metrics,meters,targetLabel,ratio,apartment,mealPlan:mealPlanFor(id),profile:housingProfiles[id]||{},sourceUrl:info.sourceUrl};
  (eligibility.status==='match'?matches:uncertain).push(row);
 }
 const rank=(a,b)=>b.score-a.score||a.name.localeCompare(b.name);
 matches.sort(rank);uncertain.sort(rank);
 return {matches,uncertain,excluded,error:null,hasPreferences:matches.concat(uncertain).some(r=>r.metrics.length>0),programDetermined:['ssir','endeavor'].includes(answers.program)};
}
export function saveHall(storage,id){
 try{
  const parsed=JSON.parse(storage.getItem('res-hall-saved')||'[]');
  const saved=new Set(Array.isArray(parsed)?parsed.filter(x=>typeof x==='string'):[]);
  saved.add(String(id));storage.setItem('res-hall-saved',JSON.stringify([...saved]));return true;
 }catch{return false;}
}
