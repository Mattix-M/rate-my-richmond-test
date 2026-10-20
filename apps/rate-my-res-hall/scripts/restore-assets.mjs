import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),packed=new URL('assets-packed/',root);
const manifest=JSON.parse(await readFile(new URL('manifest.json',packed),'utf8'));
const bytes=Buffer.concat(await Promise.all(manifest.parts.map(name=>readFile(new URL(name,packed)))));
if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Runtime asset archive checksum mismatch');
const archive=new URL('.runtime-assets.tar.gz',root);
await writeFile(archive,bytes);
try{execFileSync('tar',['-xzf',archive.pathname,'-C',root.pathname]);}finally{await rm(archive,{force:true});}
console.log('Verified and restored runtime assets.');
