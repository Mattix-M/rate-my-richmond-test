// Enhance native selects without changing their values or existing change handlers.
// Search stays inside the popup so long room lists do not add permanent clutter.
const controls=new WeakMap();
let sequence=0,opened=null;
export function matchingOptions(options,query){
 const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return options.filter(option=>!option.disabled&&terms.every(term=>option.text.toLocaleLowerCase().includes(term)));
}
export function trackSelectAssignments(select,onChange){
 for(const key of ['value','selectedIndex']){
  let prototype=Object.getPrototypeOf(select),descriptor;
  while(prototype&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(prototype,key);prototype=Object.getPrototypeOf(prototype);}
  if(!descriptor?.get||!descriptor?.set)continue;
  Object.defineProperty(select,key,{configurable:true,enumerable:descriptor.enumerable,get(){return descriptor.get.call(this);},set(next){descriptor.set.call(this,next);onChange();}});
 }
}
function enhance(select){
 if(controls.has(select)||select.multiple||select.size>1)return;
 const id=`site-choice-${++sequence}`;
 const originalLabel=select.getAttribute('aria-label')||[...select.labels||[]].map(label=>[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()).filter(Boolean).join(' ')||'Choose an option';
 const wrapper=document.createElement('span');wrapper.className='site-select';select.before(wrapper);wrapper.append(select);
 const trigger=document.createElement('button');trigger.type='button';trigger.id=id;trigger.className='site-select-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',`${id}-options`);
 const value=document.createElement('span');value.className='site-select-value';trigger.append(value);wrapper.append(trigger);
 for(const label of select.labels||[])if(label.htmlFor===select.id)label.htmlFor=id;
 select.classList.add('site-select-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 const panel=document.createElement('div');panel.dataset.triggerId=id;panel.className='site-select-popover';panel.hidden=true;
 const search=document.createElement('input');search.type='search';search.className='site-select-search';search.placeholder='Search…';search.setAttribute('aria-label',`Search ${originalLabel.toLowerCase()}`);search.autocomplete='off';search.spellcheck=false;search.setAttribute('role','combobox');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-controls',`${id}-options`);search.setAttribute('aria-expanded','false');
 const list=document.createElement('div');list.className='site-select-options';list.id=`${id}-options`;list.setAttribute('role','listbox');list.setAttribute('aria-label',originalLabel);
 const empty=document.createElement('p');empty.className='site-select-empty';empty.textContent='No matches. Try a room number or floor.';empty.setAttribute('role','status');empty.hidden=true;
 panel.append(search,list,empty);(select.closest('dialog')||document.body).append(panel);
 const popover=typeof panel.showPopover==='function';if(popover)panel.setAttribute('popover','auto');
 let filtered=[],active=-1,isOpen=false;
 function position(){const rect=trigger.getBoundingClientRect(),availableBelow=innerHeight-rect.bottom-12,above=availableBelow<220&&rect.top>availableBelow;
  const height=Math.max(100,Math.min(360,above?rect.top-16:availableBelow));
  panel.style.width=`${Math.min(Math.max(rect.width,220),innerWidth-24)}px`;
  panel.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-parseFloat(panel.style.width)-12))}px`;
  panel.style.top=above?'auto':`${rect.bottom+6}px`;panel.style.bottom=above?`${innerHeight-rect.top+6}px`:'auto';panel.style.maxHeight=`${height}px`;
 }
 function setActive(index){
  active=Math.max(0,Math.min(index,filtered.length-1));
  for(const [i,el]of [...list.children].entries())el.classList.toggle('is-active',i===active);
  const el=list.children[active];
  for(const control of [trigger,search])if(el)control.setAttribute('aria-activedescendant',el.id);else control.removeAttribute('aria-activedescendant');
  el?.scrollIntoView({block:'nearest'});
 }
 function draw(){
  filtered=matchingOptions([...select.options],search.value);list.replaceChildren();
  for(const [i,option]of filtered.entries()){
   const el=document.createElement('div');el.id=`${id}-option-${i}`;el.className='site-select-option';el.setAttribute('role','option');el.setAttribute('aria-selected',String(option.selected));el.textContent=option.text;
   el.addEventListener('pointermove',()=>setActive(i));el.addEventListener('click',()=>choose(i));list.append(el);
  }
  empty.hidden=filtered.length>0;setActive(Math.max(0,filtered.findIndex(o=>o.selected)));
 }
 function close(restore=false){
  if(!isOpen)return;isOpen=false;if(popover&&panel.matches(':popover-open'))panel.hidePopover();panel.hidden=true;trigger.setAttribute('aria-expanded','false');search.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');search.removeAttribute('aria-activedescendant');if(opened===api)opened=null;if(restore)trigger.focus({preventScroll:true});
 }
 function open(){
  if(select.disabled||isOpen)return;opened?.close();opened=api;isOpen=true;search.value='';search.hidden=select.options.length<12;draw();panel.hidden=false;position();if(popover)panel.showPopover();trigger.setAttribute('aria-expanded','true');search.setAttribute('aria-expanded','true');setActive(active);if(!search.hidden)search.focus({preventScroll:true});
 }
 function choose(index){const option=filtered[index];if(!option)return;select.value=option.value;sync();close(true);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
 function sync(){value.textContent=select.selectedOptions[0]?.text||'Choose an option';trigger.disabled=select.disabled;trigger.setAttribute('aria-label',`${originalLabel}: ${value.textContent}`);if(isOpen)draw();}
 function key(event){
  if(['ArrowDown','ArrowUp','Home','End','Enter','Escape','Tab'].includes(event.key)){
   if(event.key==='Tab'){close(true);return;}
   if(event.key==='Escape'){if(isOpen){event.preventDefault();event.stopPropagation();close(true);}return;}
   if((event.key==='Home'||event.key==='End')&&event.target===search)return;
   event.preventDefault();if(!isOpen){open();return;}
   if(event.key==='Enter'){choose(active);return;}
   if(event.key==='ArrowDown')setActive(active+1);if(event.key==='ArrowUp')setActive(active-1);if(event.key==='Home')setActive(0);if(event.key==='End')setActive(filtered.length-1);
  }else if(event.key===' '&&event.target===trigger){event.preventDefault();if(isOpen)choose(active);else open();}
  else if(event.key.length===1&&event.target===trigger&&!event.ctrlKey&&!event.metaKey){open();if(!search.hidden){search.value=event.key;draw();}else setActive(filtered.findIndex(o=>o.text.toLowerCase().startsWith(event.key.toLowerCase())));event.preventDefault();}
 }
 const api={close,sync,panel,trigger,select};controls.set(select,api);
 trigger.addEventListener('click',()=>isOpen?close():open());trigger.addEventListener('keydown',key);search.addEventListener('keydown',key);search.addEventListener('input',draw);
 // Keep popup clicks inside wrapping labels from activating their associated field.
 panel.addEventListener('click',event=>event.stopPropagation());
 panel.addEventListener('toggle',()=>{if(popover&&!panel.matches(':popover-open'))close();});
 select.addEventListener('change',sync);trackSelectAssignments(select,sync);sync();
}
if(typeof document!=='undefined'){
 const scan=node=>{if(node.nodeType!==1||node.namespaceURI!=='http://www.w3.org/1999/xhtml')return;if(node.matches('select'))enhance(node);for(const select of node.querySelectorAll('select'))enhance(select);};
 scan(document.documentElement);
 new MutationObserver(records=>{
  const dirty=new Set();
  for(const record of records){
   const select=record.target.nodeType===1?record.target.closest('select'):record.target.parentElement?.closest('select');
   if(select)dirty.add(select);
   for(const node of record.addedNodes)scan(node);
  }
  for(const select of dirty)controls.get(select)?.sync();
  if(opened&&!opened.select.isConnected)opened.close();
  for(const panel of document.querySelectorAll('.site-select-popover'))if(!document.getElementById(panel.dataset.triggerId))panel.remove();
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.panel.contains(event.target)&&!opened.trigger.contains(event.target))opened.close();},true);
 document.addEventListener('cancel',()=>opened?.close(),true);
 document.addEventListener('scroll',event=>{if(opened&&!opened.panel.contains(event.target))opened.close();},true);
 addEventListener('resize',()=>opened?.close());
}
