const RETURNING='https://residencelife.richmond.edu/housing/upperclass/';
const FIRST_YEAR='https://residencelife.richmond.edu/housing/first%20years/';
const LAW='https://residencelife.richmond.edu/housing/law-housing/';
const PROGRAMS='https://livinglearning.richmond.edu/about/communities/residential.html';
const FIRST_YEARS=new Set(['571561','571574','571575','571759','571861']);
const RETURNERS=new Set(['571565','571571','571573','571760','571570','571872','571562','571866','571973']);
const APARTMENTS=new Set(['572061','572073']);
const LAW_HOUSES=new Set(['572483','572484']);
const WOOD='571975', SOUTH='571866', LORO='571574';
const YEARS=['firstyear','sophomore','junior','senior','law'];
const PROGRAM_VALUES=['none','ssir','endeavor'];
const LABELS={firstyear:'First year',sophomore:'Sophomore',junior:'Junior',senior:'Senior',law:'Law student'};
const STORAGE_KEY='res-hall-housing-fit';
const mounts=new WeakMap();
let nextId=0;
function normalizedState(value={}){
 const year=String(value.year||'').toLowerCase().replace(/[ -]/g,'');
 const program=String(value.program||'none').toLowerCase();
 return {year:YEARS.includes(year)?year:'',program:PROGRAM_VALUES.includes(program)?program:'none'};
}

/** Published population rules only. A match never indicates current availability. */
export function evaluateHousing(placeId,choices={}){
 const id=String(placeId),{year,program}=normalizedState(choices);
 const known=FIRST_YEARS.has(id)||RETURNERS.has(id)||APARTMENTS.has(id)||LAW_HOUSES.has(id)||id===WOOD;
 const result=(status,reason,sourceUrl)=>({status,reason,sourceUrl});
 if(!year||!known)return result(null,'Choose a year to highlight halls using published housing rules.',RETURNING);
 if((program==='endeavor'&&year!=='firstyear')||(program==='ssir'&&year!=='sophomore')){
  return result('confirm',program==='endeavor'?'Endeavor is a first-year program. Check the year and program you chose.':'SSIR is a sophomore program. Check the year and program you chose.',PROGRAMS);
 }
 if(program==='endeavor')return id===LORO
  ?result('match','Endeavor students live together in LoRo.',PROGRAMS)
  :result('notmatch','Endeavor housing is in LoRo.',PROGRAMS);
 if(program==='ssir')return id===SOUTH
  ?result('match','South Court houses the SSIR cohort.',PROGRAMS)
  :result('notmatch','The SSIR cohort is housed in South Court.',PROGRAMS);
 if(LAW_HOUSES.has(id))return year==='law'
  ?result('match','Law-student housing; assignments depend on available space.',LAW)
  :result('notmatch','This house is designated for law students.',LAW);
 if(year==='law')return result('notmatch','Published law-student housing options are Atlantic and Pacific.',LAW);
 if(APARTMENTS.has(id))return ['junior','senior'].includes(year)
  ?result('match','Juniors and seniors may select apartments in groups of four; all beds must be filled.',RETURNING)
  :result('notmatch','Apartment selection is for juniors and seniors, in groups of four.',RETURNING);
 if(FIRST_YEARS.has(id))return year==='firstyear'
  ?result('match',id===LORO?'First-year housing, including Endeavor and other first-year students.':'Listed as first-year housing.',FIRST_YEAR)
  :result('notmatch','Listed as first-year housing.',FIRST_YEAR);
 if(id===WOOD)return result('match','Wood houses both first-year and returning undergraduate students.','https://residencelife.richmond.edu/housing/first%20years/wood-hall.html');
 if(year==='firstyear')return result('notmatch','Listed as returning-student housing.',RETURNING);
 if(id===SOUTH)return result('confirm','South is described as almost exclusively SSIR. Confirm access through your program or Housing.',PROGRAMS);
 return result('match','Listed as returning undergraduate housing.',RETURNING);
}

/** Mounts an optional, locally saved guide. It highlights results; it does not filter them. */
export function mountEligibility(container,onChange=()=>{}){
 mounts.get(container)?.destroy();
 let state=normalizedState();
 try{state=normalizedState(JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY)||'{}'));}catch{}
 const id=`housing-fit-${++nextId}`;
 container.innerHTML=`<details class="housing-fit"><summary><span>Choosing housing for</span><small class="housing-fit-summary">Optional guide</small></summary><div class="housing-fit-body"><label for="${id}-year">Year you’re choosing housing for</label><select id="${id}-year" name="housing-year"><option value="">Choose a year</option><option value="firstyear">First year</option><option value="sophomore">Sophomore</option><option value="junior">Junior</option><option value="senior">Senior</option><option value="law">Law student</option></select><label for="${id}-program">Living-learning program</label><select id="${id}-program" name="housing-program"><option value="none">None / not sure</option><option value="ssir">Sophomore Scholars in Residence (SSIR)</option><option value="endeavor">Richmond Endeavor</option></select><p class="housing-fit-note" aria-live="polite"></p><details class="data-disclosure housing-fit-explanation"><summary>How the guide works</summary><p class="housing-fit-disclaimer">Matches follow published rules. Housing confirms availability in StarRez. Choices stay on this device.</p></details></div></details>`;
 const year=container.querySelector('[name="housing-year"]'),program=container.querySelector('[name="housing-program"]');
 const note=container.querySelector('.housing-fit-note'),summary=container.querySelector('.housing-fit-summary');
 const render=()=>{
  year.value=state.year;program.value=state.program;
  summary.textContent=state.year?[LABELS[state.year],state.program==='ssir'?'SSIR':state.program==='endeavor'?'Endeavor':''].filter(Boolean).join(' · '):'Optional guide';
  const conflict=(state.program==='endeavor'&&state.year&&state.year!=='firstyear')||(state.program==='ssir'&&state.year&&state.year!=='sophomore');
  note.textContent=conflict?(state.program==='endeavor'?'Endeavor is a first-year program. Check your choices.':'SSIR is a sophomore program. Check your choices.'):(state.year?'Look for the housing-fit labels beside each hall.':'Choose a year to highlight halls that match published housing rules.');
 };
 const change=()=>{
  state=normalizedState({year:year.value,program:program.value});
  try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
  render();onChange({...state});
 };
 year.addEventListener('change',change);program.addEventListener('change',change);render();
 const handle={get state(){return {...state};},getState:()=>({...state}),destroy(){year.removeEventListener('change',change);program.removeEventListener('change',change);mounts.delete(container);}};
 mounts.set(container,handle);return handle;
}
