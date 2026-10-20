import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4174);
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.geojson':'application/geo+json', '.pdf':'application/pdf', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif'};
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if (!file.startsWith(root) || !['GET','HEAD'].includes(req.method)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port,'127.0.0.1',() => console.log(`Rate My Res Hall: http://127.0.0.1:${port}`));
