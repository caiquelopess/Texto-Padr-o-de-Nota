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
// Modelos embutidos (src/modelos/*.json): vêm no próprio site, funcionam sem servidor e
// passam pelo teste automático do motor no build — modelo com erro impede a publicação.
const { mdTestarModelo } = await import('../src/nucleo/modelos.mjs');
const embutidos = [];
for (const f of (await readdir(join(raiz, 'src/modelos'))).filter((f) => f.endsWith('.json')).sort()) {
  const m = JSON.parse(await ler(`src/modelos/${f}`));
  const teste = mdTestarModelo(m);
  if (!teste.ok) throw new Error(`Modelo embutido ${f} reprovado: ${teste.erros.join('; ')}`);
  embutidos.push(m);
}
const ui = [`  // ---- modelos embutidos (src/modelos) ----\n  var MODELOS_EMBUTIDOS = ${JSON.stringify(embutidos)};\n`];
for (const f of (await readdir(join(raiz, 'src/ui'))).filter((f) => f.endsWith('.js')).sort()) ui.push(await ler(`src/ui/${f}`));

const montar = async (teste) => {
  const css = await ler('src/estilos.css');
  let js = `  // ---- núcleo (src/nucleo) ----\n${nucleo.replace(/^/gm, '  ').replace(/^ +$/gm, '')}\n${ui.join('')}`;
  if (teste) js = js.replace('  var AMBIENTE_TESTE = false;', '  var AMBIENTE_TESTE = true;');
  if (teste && !js.includes('var AMBIENTE_TESTE = true;')) throw new Error('marcador AMBIENTE_TESTE não encontrado');
  return (await ler('src/pagina.html')).replace('/*@ESTILOS@*/\n', () => css).replace('//@SCRIPT@\n', () => js);
};

// Lista dos serviços embutidos (id + nome), usada pelo painel para categorias e scripts.
const servicosHtml = [...(await ler('src/pagina.html')).matchAll(/class="sub-btn" data-click="trocarAba\('([^']+)', this\)">([^<]+)</g)].map((m) => ({
  id: m[1],
  nome: m[2].trim(),
}));
const servicos = [...servicosHtml, ...embutidos.map((m) => ({ id: m.sf || `sf-md-${m.id}`, nome: m.nome }))].sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR'),
);
const listaServicos = `// Gerado por scripts/build.mjs a partir de src/pagina.html — não editar à mão.\nexport const SERVICOS_EMBUTIDOS = ${JSON.stringify(servicos, null, 2)};\n`;

const saidas = { 'index.html': await montar(false), 'teste/index.html': await montar(true), 'functions/_lib/servicos-embutidos.js': listaServicos };
if (process.argv.includes('--check')) {
  const desatualizados = [];
  for (const [arq, conteudo] of Object.entries(saidas)) if ((await ler(arq)) !== conteudo) desatualizados.push(arq);
  if (desatualizados.length) {
    console.error('Rode "npm run build": desatualizado(s) ->', desatualizados.join(', '));
    process.exit(1);
  }
  console.log('index.html, teste/index.html e a lista de serviços em dia com src/');
} else {
  for (const [arq, conteudo] of Object.entries(saidas)) await writeFile(join(raiz, arq), conteudo);
  console.log('gerado: index.html, teste/index.html, functions/_lib/servicos-embutidos.js');
}
