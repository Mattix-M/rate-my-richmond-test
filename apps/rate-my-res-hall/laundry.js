import { rankedHalls } from './laundry-data.js';
const halls = rankedHalls();
const list = document.getElementById('laundry-list');
const search = document.getElementById('hall-search');
const count = document.getElementById('result-count');
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function metric(value, label, className = '') {
  return `<span class="hall-metric ${className}"><span aria-label="${escapeHTML(label)}: ${value ?? 'Unknown'}">${value ?? '—'}</span><span class="metric-label" aria-hidden="true">${label}</span></span>`;
}
function render() {
  const query = search.value.trim().toLowerCase();
  const shown = halls.filter(hall => `${hall.name} ${hall.name.startsWith('University Forest') ? 'UFA' : ''} ${hall.name.startsWith('Lora') ? 'Loro' : ''} ${hall.name.startsWith('Westhampton') ? 'Westy' : ''}`.toLowerCase().includes(query));
  count.textContent = `${shown.length} ${shown.length === 1 ? 'hall or community' : 'halls and communities'} · Lowest residents per washer first`;
  list.innerHTML = shown.map(hall => `<details class="laundry-hall"><summary class="hall-summary"><span class="hall-name">${escapeHTML(hall.name)}</span>${metric(hall.capacity, 'Capacity')}${metric(hall.washers, 'Washers')}${metric(hall.dryers === null ? null : `${hall.dryers}${hall.name === 'Marsh Hall' ? '*' : ''}`, 'Dryers')}${metric(hall.residentsPerWasher?.toFixed(1) ?? null, 'People / washer', 'ratio')}</summary><div class="hall-body">
  ${hall.residentsPerWasher === null ? `<p>${hall.washers === null ? 'Not listed separately in the app. Washer and dryer counts are unknown.' : 'Machine counts are available, but capacity is unverified. This hall is not ranked.'}</p>` : `<p>${hall.capacity} residents ÷ ${hall.washers} listed washers = <strong>${hall.residentsPerWasher.toFixed(1)} residents per washer</strong> at full capacity.</p>`}
  ${hall.note ? `<p class="hall-note">${escapeHTML(hall.note)}</p>` : ''}
  <ul class="room-list">${hall.rooms.map(room => `<li><strong>${escapeHTML(room.location)}</strong>${room.washers} ${room.washers === 1 ? 'washer' : 'washers'} · ${room.dryers} ${room.dryers === 1 ? 'dryer entry' : 'dryer entries'}<span class="machine-labels">Washer labels: ${escapeHTML(room.labels)}<br>Dryer labels: ${escapeHTML(room.dryerLabels)}</span>${room.notes ? `<p class="hall-note">${escapeHTML(room.notes)}</p>` : ''}</li>`).join('')}</ul>
  <div class="hall-links"><a href="./#place=${encodeURIComponent(hall.id)}">Explore ${escapeHTML(hall.name)} ↗</a>${hall.capacity !== null ? `<a href="${escapeHTML(hall.capacitySource)}" target="_blank" rel="noopener noreferrer">University capacity source ↗</a>` : ''}</div></div></details>`).join('') || '<p>No halls match that search.</p>';
}
search.addEventListener('input', render);
render();
