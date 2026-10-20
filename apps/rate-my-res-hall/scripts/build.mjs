await import('./restore-assets.mjs');
await import('./check.mjs');
import {readdir, mkdir, cp, rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const out=new URL('dist/',root);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const name of await readdir(root)){
  if(/\.(html|css|js|svg|png|ico)$/.test(name)) await cp(new URL(name,root),new URL(name,out));
}
for(const name of ['data','vendor']) await cp(new URL(name,root),new URL(name,out),{recursive:true});
console.log('Production site written to dist; research working files and scripts excluded.');
