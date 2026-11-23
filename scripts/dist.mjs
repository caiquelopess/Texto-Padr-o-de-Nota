// Copia para dist/ só o que o site publica (o Cloudflare Pages serve essa pasta;
// a portaria de login fica em functions/). Sem dependências: roda no build do Cloudflare.
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const dist = join(raiz, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'teste'), { recursive: true });
for (const arq of ['index.html', 'versao.json', '404.html', 'teste/index.html', 'teste/versao.json']) await cp(join(raiz, arq), join(dist, arq));
console.log('dist/ pronto para o Cloudflare Pages');
