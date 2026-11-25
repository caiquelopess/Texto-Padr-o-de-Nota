import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { FORMATO, validarConteudo } from '../../functions/_lib/backups.js';

const sha = (t) => createHash('sha256').update(t).digest('hex');
const versao = (modelo_id, v, conteudo) => ({ modelo_id, versao: v, conteudo, checksum: sha(conteudo) });
const base = () => ({
  formato: FORMATO,
  modelos: [{ id: 'irrigante', versao_publicada: 1, rascunho: '{"id":"irrigante"}' }],
  modelo_versoes: [versao('irrigante', 1, '{"id":"irrigante","nota":"x"}')],
  atendimento: [{ id: 1 }],
  atendimento_versoes: [{ versao: 1, conteudo: '{"categorias":[]}', checksum: sha('{"categorias":[]}') }],
  perfis: { 'ana.lima': { perfil: 'atendente', ativo: true } },
});

test('backup íntegro passa; checksum do arquivo é conferido', async () => {
  const t = JSON.stringify(base());
  assert.deepEqual(await validarConteudo(t, sha(t)), []);
  assert.deepEqual(await validarConteudo(t, sha(`${t} `)), ['O arquivo do backup foi alterado ou corrompido (checksum diferente).']);
  assert.deepEqual(await validarConteudo('{', null), ['O backup não é um JSON válido.']);
});

test('backup com problemas internos é recusado', async () => {
  const d = base();
  d.modelo_versoes[0].conteudo = '{"adulterado":true}';
  d.modelos.push({ id: 'orfao', versao_publicada: 3, rascunho: '{' });
  const p = await validarConteudo(JSON.stringify(d));
  assert.ok(p.includes('Versão corrompida dentro do backup: irrigante v1.'));
  assert.ok(p.includes('O modelo orfao aponta para a versão 3, que não está no backup.'));
  assert.ok(p.includes('Rascunho ilegível no modelo orfao.'));
  d.atendimento_versoes[0].checksum = 'x';
  assert.ok((await validarConteudo(JSON.stringify(d))).includes('Versão corrompida dentro do backup: atendimento v1.'));
  assert.deepEqual(await validarConteudo(JSON.stringify({ formato: 99 })), [
    'Formato de backup desconhecido.',
    'Falta a tabela modelos.',
    'Falta a tabela modelo_versoes.',
    'Falta a tabela atendimento.',
    'Falta a tabela atendimento_versoes.',
  ]);
  // backup sem senhas: só perfil e situação
  assert.deepEqual(Object.keys(base().perfis['ana.lima']), ['perfil', 'ativo']);
});

// Banco D1 de mentira, só com o necessário para a leitura dos modelos publicados.
const bancoFalso = (linhas, geral = 7) => ({
  prepare: (sql) => ({
    bind: () => ({ first: async () => null }),
    first: async () => (sql.includes('publicacao') ? geral : null),
    all: async () => ({ results: linhas }),
  }),
});

test('recuperação automática: versão publicada corrompida cai para a anterior íntegra', async () => {
  const { modelosPublicados } = await import('../../functions/_lib/banco.js');
  const v1 = '{"id":"irrigante","nota":"v1"}';
  const v2 = '{"id":"irrigante","nota":"v2"}';
  const outro = '{"id":"outro","nota":"ok"}';
  const r = await modelosPublicados(
    bancoFalso([
      { id: 'irrigante', versao: 2, conteudo: v2, checksum: 'adulterado' },
      { id: 'irrigante', versao: 1, conteudo: v1, checksum: sha(v1) },
      { id: 'outro', versao: 1, conteudo: outro, checksum: sha(outro) },
    ]),
  );
  assert.deepEqual(r, { geral: 7, modelos: [JSON.parse(v1), JSON.parse(outro)] });
  // sem nenhuma versão íntegra, o modelo simplesmente não é servido
  const nada = await modelosPublicados(bancoFalso([{ id: 'x', versao: 1, conteudo: '{}', checksum: 'y' }], null));
  assert.deepEqual(nada, { geral: 0, modelos: [] });
});
