// Monta o index.html único (produção) e teste/index.html a partir de src/.
//   node scripts/build.mjs          -> grava os dois arquivos
//   node scripts/build.mjs --check  -> falha se os arquivos gravados estiverem desatualizados
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const raiz = join(import.meta.dirname, '..');
const ler = (p) => readFile(join(raiz, p), 'utf8');

const nucleo = (
  await build({
    entryPoints: [join(raiz, 'src/nucleo/globais.mjs')],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    write: false,
    charset: 'utf8',
    legalComments: 'none',
  })
).outputFiles[0].text;
const ui = [];
for (const f of (await readdir(join(raiz, 'src/ui'))).filter((f) => f.endsWith('.js')).sort()) ui.push(await ler(`src/ui/${f}`));

const montar = async (teste) => {
  const css = await ler('src/estilos.css');
  let js = `  // ---- núcleo (src/nucleo) ----\n${nucleo.replace(/^/gm, '  ').replace(/^ +$/gm, '')}\n${ui.join('')}`;
  if (teste) js = js.replace('  var AMBIENTE_TESTE = false;', '  var AMBIENTE_TESTE = true;');
  if (teste && !js.includes('var AMBIENTE_TESTE = true;')) throw new Error('marcador AMBIENTE_TESTE não encontrado');
  return (await ler('src/pagina.html')).replace('/*@ESTILOS@*/\n', () => css).replace('//@SCRIPT@\n', () => js);
};

const saidas = { 'index.html': await montar(false), 'teste/index.html': await montar(true) };
if (process.argv.includes('--check')) {
  const desatualizados = [];
  for (const [arq, conteudo] of Object.entries(saidas)) if ((await ler(arq)) !== conteudo) desatualizados.push(arq);
  if (desatualizados.length) {
    console.error('Rode "npm run build": desatualizado(s) ->', desatualizados.join(', '));
    process.exit(1);
  }
  console.log('index.html e teste/index.html em dia com src/');
} else {
  for (const [arq, conteudo] of Object.entries(saidas)) await writeFile(join(raiz, arq), conteudo);
  console.log('gerado: index.html, teste/index.html');
}
