#!/usr/bin/env node
/* Local preview that mirrors Cloudflare's routing: /solutions serves
   public/solutions.html, and unknown paths serve public/404.html.

     node serve.js            then open http://localhost:4321

   Replaces serve.py: on this machine /usr/bin/python3 is an Apple-shimmed
   binary that refuses to run until the Xcode licence is accepted. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.argv[2]) || 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const full = path.join(ROOT, path.normalize(clean).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(ROOT)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    const index = path.join(full, 'index.html');
    return fs.existsSync(index) ? index : null;
  }
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  if (fs.existsSync(full + '.html')) return full + '.html';
  return null;
}

http.createServer((req, res) => {
  const file = resolve(req.url);
  if (file) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
    return;
  }
  const nf = path.join(ROOT, '404.html');
  if (fs.existsSync(nf)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(nf).pipe(res);
  } else {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`ABX Intelligence -> http://localhost:${PORT}`));
