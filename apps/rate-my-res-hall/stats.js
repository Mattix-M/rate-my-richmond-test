const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=s=>`<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">University source ↗</a>`;
try{
 const [stats,facts,questions]=await Promise.all(['data/housing/residence-stats.json','data/residence-facts.json','data/housing/residence-stat-questions.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json();}));
 const entries=Object.entries(stats),communities=new Set(['572061','572073']);
 function ranking(){const all=document.querySelector('input[name=scope]:checked').value==='all';const rows=entries.filter(([id,s])=>Number.isFinite(s.capacity)&&(all||!communities.has(id))).sort((a,b)=>b[1].capacity-a[1].capacity);const max=rows[0]?.[1].capacity||1;
 document.querySelector('#ranking').innerHTML=rows.map(([id,s])=>`<div class="rank-row"><a href="./#place=${id}">${esc(s.name)}</a><div class="track"><div class="bar" style="--width:${s.capacity/max*100}%"></div></div><strong>${s.capacity}</strong></div>`).join('');
 document.querySelector('#capacity-sources').innerHTML=rows.map(([,s])=>`<li><a href="${esc(s.metricSources?.capacity||s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a></li>`).join('');
 document.querySelector('#capacity-note').textContent=`${rows.length} published figures shown. Robins and Wood are omitted until a verified capacity is available. ${all?'UFA and Gateway figures cover whole communities.':'UFA and Gateway are excluded from this individual-building comparison.'}`;
 }
 document.querySelectorAll('[name=scope]').forEach(el=>el.onchange=ranking);ranking();
 for(const id of ['hall-a','hall-b'])document.getElementById(id).innerHTML=entries.map(([key,s])=>`<option value="${key}">${esc(s.name)}</option>`).join('');
 document.getElementById('hall-a').value='571565';document.getElementById('hall-b').value='572483';
 function compare(){const ids=['hall-a','hall-b'].map(id=>document.getElementById(id).value),[a,b]=ids.map(id=>stats[id]);
 const card=(s,id)=>`<article class="stat-side"><h3>${esc(s.name)}</h3><div class="big-number">${s.capacity??'—'}</div><small>${s.capacity==null?'Capacity not yet verified':communities.has(id)?'published capacity · whole community':'published resident capacity'}</small><p>${esc(s.roomTypes.join(' · '))}</p>${s.openedYear?`<p>Built / opened <strong>${s.openedYear}</strong></p>`:''}${source(s)} · <a href="./#place=${id}">Explore residence ↗</a></article>`;
 const result=Number.isFinite(a.capacity)&&Number.isFinite(b.capacity)?ids[0]===ids[1]?'Same hall. Same story.':a.capacity===b.capacity?'Same capacity. Different buildings.':`${a.capacity>b.capacity?a.name:b.name} has space for ${Math.abs(a.capacity-b.capacity).toLocaleString()} more residents than ${a.capacity>b.capacity?b.name:a.name}.${ids.some(id=>communities.has(id))?' Apartment figures cover the whole community.':''}`:'We need both published capacities before making a comparison.';
 document.querySelector('#comparison').innerHTML=`<div class="comparison-grid">${card(a,ids[0])}${card(b,ids[1])}</div><p class="comparison-result">${esc(result)}</p>`;
 }
 document.querySelectorAll('.selectors select').forEach(el=>el.onchange=compare);compare();
 document.querySelector('#story-grid').innerHTML=questions.questions.map(q=>`<details><summary><small>${q.placeIds.map(id=>esc(stats[id]?.name||'Richmond')).join(' / ')}</small>${esc(q.question)}</summary><p>${esc(q.answer)}</p>${q.caveat?`<p class="footnote">${esc(q.caveat)}</p>`:''}${q.sources.map((url,i)=>`<a href="${esc(url)}" target="_blank" rel="noopener">Source ${i+1} ↗</a>`).join('')}<a href="./#place=${q.placeIds[0]}">Explore residence ↗</a></details>`).join('');
 document.querySelector('#verified').textContent='Research snapshot: October 20, 2026. Sources and calculated comparisons are kept separate.';
 const workbook=await fetch('research/richmond-hall-statistics.xlsx',{method:'HEAD'});if(workbook.ok)document.querySelector('#workbook-link').hidden=false;
}catch(error){document.querySelector('#load-error').hidden=false;document.querySelector('#ranking').textContent='Statistics unavailable.';console.error(error);}
