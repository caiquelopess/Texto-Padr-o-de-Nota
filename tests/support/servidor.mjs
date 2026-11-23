// Servidor estático mínimo para os testes (sem dependências).

import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const raiz = normalize(join(import.meta.dirname, '..', '..'));
const porta = Number(process.env.PORTA || 4173);
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  try {
    let caminho = normalize(join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!caminho.startsWith(raiz)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(caminho)).isDirectory()) caminho = join(caminho, 'index.html');
    res.writeHead(200, { 'content-type': tipos[extname(caminho)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(caminho));
  } catch {
    res.writeHead(404).end('404');
  }
}).listen(porta, () => console.log(`servindo em http://localhost:${porta}`));
