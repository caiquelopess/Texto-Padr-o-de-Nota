import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_TEXTO, validarSugestao } from '../../functions/_lib/sugestoes.js';

test('sugestão: valida tipo e tamanho do texto', () => {
  assert.deepEqual(validarSugestao({ tipo: 'Sugestão', texto: '  incluir serviço X  ' }), { tipo: 'Sugestão', texto: 'incluir serviço X' });
  assert.equal(validarSugestao({ tipo: 'Outro', texto: 'texto válido' }).erro, 'Escolha o tipo.');
  assert.match(validarSugestao({ tipo: 'Problema', texto: 'oi' }).erro, /mínimo 5/);
  assert.match(validarSugestao({ tipo: 'Problema', texto: 'x'.repeat(MAX_TEXTO + 1) }).erro, /no máximo/);
  assert.equal(validarSugestao(null).erro, 'Escolha o tipo.');
});
