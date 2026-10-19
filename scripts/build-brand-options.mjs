// Local design studies only. Does not replace the active share card or favicons.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'output/brand-options');
await fs.mkdir(out, {recursive: true});
const model = JSON.parse(await fs.readFile(path.join(root, 'src/lib/data.json'), 'utf8'));
const navy = '#000066', red = '#990000', ink = '#171733', muted = '#606074', line = '#dedee7';
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size, {color = navy, font = 'Arial', weight = 400, anchor = 'start', spacing = 0} = {}) => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" letter-spacing="${spacing}">${escape(value)}</text>`;
const svg = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
const rect = (x, y, w, h, fill, radius = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
const rule = (x1, y1, x2, y2, color = line, width = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const icon1 = rect(0, 0, 180, 180, navy, 14) + text(90, 143, 'R', 151, {color: '#fff', font: 'Georgia', anchor: 'middle'}) + rect(0, 170, 180, 10, red);
const icon2 = rect(0, 0, 180, 180, navy, 14) + rect(0, 0, 180, 36, red) + text(90, 25, 'RATE MY', 20, {color: '#fff', weight: 700, anchor: 'middle', spacing: 2}) + text(90, 157, 'R', 137, {color: '#fff', weight: 700, anchor: 'middle'});
const icon3 = rect(0, 0, 180, 180, navy, 14) + '<path d="M24 24H156V130H96L62 157V130H24Z" fill="#fff"/>' + text(90, 115, 'R', 108, {font: 'Georgia', anchor: 'middle'}) + rect(24, 122, 132, 8, red);
const icons = [{id: 'icon-1-serif', name: 'Serif R', content: icon1}, {id: 'icon-2-banner', name: 'Banner R', content: icon2}, {id: 'icon-3-review', name: 'Review R', content: icon3}];
for (const icon of icons) {
  const source = svg(180, 180, icon.content);
  await fs.writeFile(path.join(out, `${icon.id}.svg`), source);
  for (const size of [512, 180, 64, 32, 16]) await sharp(Buffer.from(source)).resize(size, size).png().toFile(path.join(out, `${icon.id}-${size}.png`));
}

const footer = (dark = false) => rule(64, 544, 1136, 544, dark ? '#48488d' : line) + text(64, 586, 'ratemyrichmond.com', 22, {color: dark ? '#fff' : navy, weight: 700}) + text(1136, 586, 'Unofficial. Student reviews.', 20, {color: dark ? '#d4d4e9' : muted, anchor: 'end'});
const count = model.meta.reviews.toLocaleString('en-US');
const x = d => 746 + (d - 1) / 4 * 374;
const y = q => 454 - (q - 1) / 4 * 276;
const points = model.penalty.map(p => `${x(p.difficulty)},${y(p.quality)}`).join(' ');
let chart = text(720, 111, 'QUALITY vs. DIFFICULTY', 18, {color: red, weight: 700}) + text(720, 143, 'Average student ratings', 22, {color: muted});
for (const v of [1, 2, 3, 4, 5]) chart += rule(746, y(v), 1120, y(v)) + text(725, y(v) + 6, v, 18, {color: muted, anchor: 'end'}) + text(x(v), 486, v, 18, {color: muted, anchor: 'middle'});
chart += `<polyline points="${points}" fill="none" stroke="${navy}" stroke-width="4"/>`;
for (const p of model.penalty) chart += `<circle cx="${x(p.difficulty)}" cy="${y(p.quality)}" r="8" fill="${red}"/>`;
chart += text(746, 169, 'Quality', 18, {color: muted}) + text(934, 521, 'Difficulty', 20, {color: muted, anchor: 'middle'});
const a = rect(0, 0, 1200, 630, '#fff') + rect(0, 0, 1200, 8, red)
  + text(64, 70, 'UNOFFICIAL PROFESSOR REVIEWS', 18, {color: red, weight: 700})
  + text(60, 184, 'Rate My', 86, {font: 'Georgia'}) + text(60, 280, 'Richmond.', 86, {font: 'Georgia'})
  + text(64, 370, 'Find professors.', 37, {color: ink}) + text(64, 421, 'Read course reviews.', 37, {color: ink})
  + text(64, 491, `${count} anonymous and probably biased reviews.`, 23, {color: muted}) + chart + footer();
const b = rect(0, 0, 1200, 630, navy) + rect(0, 0, 1200, 9, red)
  + text(64, 105, 'Rate My Richmond.', 49, {font: 'Georgia', color: '#fff'})
  + text(64, 234, 'Find professors.', 64, {font: 'Georgia', color: '#fff'})
  + text(64, 316, 'Read course reviews.', 64, {font: 'Georgia', color: '#fff'})
  + text(64, 427, `${count} student reviews.`, 32, {color: '#fff'})
  + text(64, 477, 'Anonymous and probably biased.', 29, {color: '#d4d4e9'})
  + `<g transform="translate(918 174) scale(1.05)">${icon2}</g>` + footer(true);
let features = '';
for (const [i, title, subtitle] of [[0, 'Professors', 'Ratings + reviews'], [1, 'Courses', 'Search by name or code'], [2, 'URdle', 'Five daily matchups']]) {
  const left = 64 + i * 366;
  features += rule(left, 340, left + 325, 340, navy, 3) + text(left, 394, title, 37, {font: 'Georgia'}) + text(left, 437, subtitle, 24, {color: muted});
}
const c = rect(0, 0, 1200, 630, '#fff') + rect(0, 0, 1200, 8, red)
  + `<g transform="translate(64 46) scale(.34)">${icon3}</g>` + text(146, 90, 'Rate My Richmond.', 38, {font: 'Georgia'})
  + text(64, 214, 'Find your professor.', 74, {font: 'Georgia'})
  + text(64, 278, 'Read what students said.', 38, {color: muted}) + features
  + text(64, 511, `${count} anonymous and probably biased reviews.`, 25, {color: ink}) + footer();
const cards = [{id: 'share-a-simple-chart', name: 'A · Simpler chart', content: a}, {id: 'share-b-navy', name: 'B · Navy + monogram', content: b}, {id: 'share-c-features', name: 'C · What the site does', content: c}];
for (const card of cards) {
  const source = svg(1200, 630, card.content);
  await fs.writeFile(path.join(out, `${card.id}.svg`), source);
  await sharp(Buffer.from(source)).png().toFile(path.join(out, `${card.id}.png`));
}
// A is a true five-point aggregate chart from the supplied review averages, not invented professor dots.
await fs.writeFile(path.join(out, 'sources.json'), JSON.stringify({chartA: {source: 'src/lib/data.json: penalty', measure: 'Raw mean quality by reported difficulty, all archived reviews', points: model.penalty}, count: model.meta.reviews, colors: {navy, red}}, null, 2));
let board = rect(0, 0, 1800, 1120, '#f4f4f7');
const placements = [[60, 88], [930, 88], [60, 620]];
const layers = [];
for (const [i, card] of cards.entries()) {
  const [left, top] = placements[i];
  board += text(left, top - 25, card.name, 29, {color: ink, weight: 700});
  layers.push({input: await sharp(path.join(out, `${card.id}.png`)).resize(810, 425).toBuffer(), left, top});
}
board += text(930, 595, 'Icon options · 1 / 2 / 3', 29, {color: ink, weight: 700}) + rect(930, 620, 810, 425, '#fff');
for (const [i, icon] of icons.entries()) {
  const left = 980 + i * 254;
  board += text(left + 80, 872, `${i + 1} · ${icon.name}`, 23, {color: ink, anchor: 'middle'})
    + text(left + 80, 975, '64 / 32 / 16 px', 17, {color: muted, anchor: 'middle'});
  layers.push({input: await sharp(path.join(out, `${icon.id}-180.png`)).resize(160, 160).toBuffer(), left, top: 663});
  for (const [j, size] of [64, 32, 16].entries()) layers.push({input: path.join(out, `${icon.id}-${size}.png`), left: left + [0, 87, 137][j], top: 898 + (64 - size) / 2});
}
await sharp(Buffer.from(svg(1800, 1120, board))).composite(layers).png().toFile(path.join(out, 'brand-options-board.png'));
console.log('Created 3 share cards, 3 icon studies in five sizes, SVG sources and a contact sheet in output/brand-options. Active site assets unchanged.');
