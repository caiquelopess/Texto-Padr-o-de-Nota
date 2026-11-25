import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diferencaLinhas, resumoCampos } from '../../functions/_lib/diferenca.js';

test('diferença linha a linha', () => {
  assert.deepEqual(diferencaLinhas('a\nb\nc', 'a\nx\nc\nd'), [
    { tipo: 'igual', texto: 'a' },
    { tipo: 'removida', texto: 'b' },
    { tipo: 'incluida', texto: 'x' },
    { tipo: 'igual', texto: 'c' },
    { tipo: 'incluida', texto: 'd' },
  ]);
  assert.deepEqual(diferencaLinhas('a\nb', 'a'), [
    { tipo: 'igual', texto: 'a' },
    { tipo: 'removida', texto: 'b' },
  ]);
  assert.deepEqual(diferencaLinhas('x\na', 'a'), [
    { tipo: 'removida', texto: 'x' },
    { tipo: 'igual', texto: 'a' },
  ]);
  assert.deepEqual(diferencaLinhas('a', 'y\na'), [
    { tipo: 'incluida', texto: 'y' },
    { tipo: 'igual', texto: 'a' },
  ]);
  assert.deepEqual(diferencaLinhas(null, undefined), [{ tipo: 'igual', texto: '' }]);
});

test('resumo dos campos', () => {
  assert.equal(
    resumoCampos({
      campos: [
        { id: 'm', rotulo: 'Motivo', tipo: 'opcao', obrigatorio: true, opcoes: ['A', 'B'] },
        { id: 'p', rotulo: 'PNs', tipo: 'texto', mostrarSe: { campo: 'm', igual: ['B', 'C'] } },
      ],
    }),
    'Motivo (m, opcao) — obrigatório; opções: A | B\nPNs (p, texto) — mostrar se m = B ou C',
  );
  assert.equal(resumoCampos(null), '');
});
