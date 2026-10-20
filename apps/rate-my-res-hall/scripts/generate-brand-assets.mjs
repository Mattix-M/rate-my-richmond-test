// Rebuild the raster exports from the original vector artwork.
// Supply SHARP_MODULE if Sharp is installed outside this project's module tree.
import {readFile,writeFile} from 'node:fs/promises';
const sharp=(await import(process.env.SHARP_MODULE||'sharp')).default;
const root=new URL('../',import.meta.url);
const icon=await readFile(new URL('icon.svg',root));
for(const [name,size] of [['apple-touch-icon.png',180],['favicon-32.png',32],['favicon-192.png',192]]){
  await sharp(icon).resize(size,size).png().toFile(new URL(name,root).pathname);
}
const icoPng=await sharp(icon).resize(48,48).png().toBuffer();
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=48;ico[7]=48;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(icoPng.length,14);ico.writeUInt32LE(22,18);
await writeFile(new URL('favicon.ico',root),Buffer.concat([ico,icoPng]));
let windows='';
for(let floor=0;floor<3;floor++)for(let column=0;column<7;column++){
  const x=732+column*52,y=353+floor*57;
  windows+=`<rect x="${x}" y="${y}" width="20" height="31" fill="#d7e3ec" stroke="#f5f2ed" stroke-width="3"/><path d="M${x} ${y+15}h20" stroke="#59677b" stroke-width="2"/>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><pattern id="brick" width="30" height="16" patternUnits="userSpaceOnUse"><rect width="30" height="16" fill="#a34f42"/><path d="M0 0h30M0 8h30M15 0v8M0 8v8M30 8v8" stroke="#c28372" stroke-width=".8"/></pattern><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="14"/></filter></defs>
<rect width="1200" height="630" fill="#faf9f7"/>
<path d="M840-20 720 155 1100 175 1210 270M590 610 710 500 1180 560M1020-20 940 100 1210 120" fill="none" stroke="#e8ebf0" stroke-width="24"/>
<path d="M840-20 720 155 1100 175 1210 270M590 610 710 500 1180 560M1020-20 940 100 1210 120" fill="none" stroke="#fff" stroke-width="15"/>
<svg x="62" y="54" width="64" height="64" viewBox="0 0 64 64" fill="none">${icon.toString().replace(/<svg[^>]*>|<\/svg>/g,'')}</svg>
<text x="148" y="91" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="bold" fill="#10143d">Rate My Richmond<tspan fill="#990000">.</tspan></text>
<text x="150" y="122" font-family="Arial, sans-serif" font-size="17" font-weight="bold" letter-spacing="4" fill="#990000">RES LIFE</text>
<text x="65" y="227" font-family="Arial, sans-serif" font-size="16" font-weight="bold" letter-spacing="3" fill="#61667a">UNIVERSITY OF RICHMOND</text>
<text x="60" y="310" font-family="Georgia, 'Times New Roman', serif" font-size="73" font-weight="bold" fill="#10143d">Find your place.</text>
<text x="65" y="365" font-family="Arial, sans-serif" font-size="25" fill="#545a70">A closer look at Richmond housing.</text>
<path d="M65 409h66" stroke="#990000" stroke-width="4"/>
<text x="65" y="457" font-family="Arial, sans-serif" font-size="23" fill="#252b49">Floor plans, room sizes and hall details</text>
<text x="65" y="492" font-family="Arial, sans-serif" font-size="23" fill="#252b49">to help you make your housing list.</text>
<ellipse cx="915" cy="548" rx="228" ry="18" fill="#1e294d" opacity=".13" filter="url(#shadow)"/>
<path d="m700 341 54-40v201l-54 31Z" fill="#7e3e36"/>
<path d="M700 341h400v192H700Z" fill="url(#brick)" stroke="#793e35" stroke-width="2"/>
<path d="m675 344 69-79h329l48 79Z" fill="#2d466e" stroke="#243858" stroke-width="2"/>
<path d="m675 344 69-79 20 0-44 79Z" fill="#405a7e"/>
<path d="M679 344h437M700 399h400M700 456h400M700 519h400" stroke="#f1eee8" stroke-width="7"/>
<path d="M700 403h400M700 460h400" stroke="#6f6870" stroke-width="1"/>
${windows}
<path d="M877 533v-42h30v42" fill="#263c5a" stroke="#f3eee7" stroke-width="4"/>
<path d="m862 493 30-22 30 22Z" fill="#30486a" stroke="#f3eee7" stroke-width="3"/>
<path d="M866 493v40m52-40v40" stroke="#737887" stroke-width="4"/>
<path d="m809 312 14-19 15 19v25h-29Z" fill="#f0ede6" stroke="#d1cbc2" stroke-width="2"/><path d="m956 312 14-19 15 19v25h-29Z" fill="#f0ede6" stroke="#d1cbc2" stroke-width="2"/><path d="M819 317h9v15h-9Zm147 0h9v15h-9Z" fill="#526b86"/>
<text x="65" y="585" font-family="Arial, sans-serif" font-size="17" fill="#737788">An independent student project</text>
</svg>`;
await writeFile(new URL('social-preview.svg',root),svg);
await sharp(Buffer.from(svg)).png().toFile(new URL('social-preview.png',root).pathname);
console.log('Exported social preview, favicon sizes, Apple touch icon and ICO.');
