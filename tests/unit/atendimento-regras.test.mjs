import assert from 'node:assert/strict';
import { test } from 'node:test';
import { atendimentoDoFormulario, documentoPadrao, LIMITES, resumoAtendimento, validarAtendimento } from '../../functions/_lib/atendimento-regras.js';

test('documento padrão é válido', () => {
  const d = documentoPadrao();
  assert.equal(d.categorias.length, 7);
  assert.deepEqual(validarAtendimento(d), []);
});

test('validação aponta cada problema', () => {
  const erros = validarAtendimento({
    categorias: [{ nome: 'A' }, { nome: 'a' }, { nome: '' }, { nome: 'x'.repeat(61) }],
    servicos: { 'sf-relig': { categoria: 'Z' }, 'sf-inexistente': {}, 'sf-md-cadastro-irrigante': { oculto: true } },
    scripts: { 'sf-relig': { falas: Array(21).fill('oi'), checklist: ['y'.repeat(301)] }, nada: {} },
  });
  for (const e of [
    'Categoria "a" repetida.',
    'Há uma categoria sem nome.',
    'Categoria "xxxxxxxxxxxxxxxxxxxx…": nome muito longo.',
    'Serviço sf-relig: a categoria "Z" não existe.',
    'Serviço desconhecido: sf-inexistente.',
    `Script de sf-relig: no máximo ${LIMITES.itens} itens em falas.`,
    `Script de sf-relig: cada item de checklist pode ter até ${LIMITES.textoItem} caracteres.`,
    'Script de serviço desconhecido: nada.',
  ])
    assert.ok(erros.includes(e), e);
  assert.ok(!erros.some((e) => e.includes('sf-md-cadastro-irrigante')));
  assert.deepEqual(validarAtendimento({}), ['Informe pelo menos uma categoria.']);
  assert.ok(validarAtendimento({ categorias: Array.from({ length: 21 }, (_, i) => ({ nome: `C${i}` })) }).includes('No máximo 20 categorias.'));
});

test('formulário da tela vira o documento', () => {
  const f = new FormData();
  f.append('categorias', ' Ligação \n\nCobrança\n');
  f.append('cat:sf-relig', 'Cobrança');
  f.append('vis:sf-relig', 'visivel');
  f.append('cat:sf-afericao', '');
  f.append('vis:sf-afericao', 'oculto');
  f.append('cat:sf-bpc', '');
  f.append('vis:sf-bpc', 'visivel');
  f.append('falas:sf-relig', 'Bom dia!\n\nConfirme o endereço');
  f.append('check:sf-relig', 'Comprovante');
  f.append('falas:sf-bpc', '   ');
  f.append('check:sf-md-irrigante', 'Outorga');
  f.append('outro', 'x');
  assert.deepEqual(atendimentoDoFormulario(f), {
    categorias: [{ nome: 'Ligação' }, { nome: 'Cobrança' }],
    servicos: { 'sf-relig': { categoria: 'Cobrança' }, 'sf-afericao': { oculto: true } },
    scripts: {
      'sf-relig': { falas: ['Bom dia!', 'Confirme o endereço'], checklist: ['Comprovante'] },
      'sf-md-irrigante': { falas: [], checklist: ['Outorga'] },
    },
  });
});

test('resumo para comparar versões', () => {
  assert.equal(
    resumoAtendimento(
      {
        categorias: [{ nome: 'A' }, { nome: 'B' }],
        servicos: { 'sf-relig': { categoria: 'B' }, 'sf-afericao': { oculto: true } },
        scripts: { 'sf-relig': { falas: ['Oi'], checklist: ['Doc'] } },
      },
      { 'sf-relig': 'Religação' },
    ),
    'Categorias: A · B\nsf-afericao: oculto\nReligação: visível em B\nReligação · fala: Oi\nReligação · checklist: Doc',
  );
  assert.equal(resumoAtendimento({}), 'Categorias: ');
});

test('com os scripts ocultos, o formulário não lê scripts', () => {
  const f = new FormData();
  f.append('categorias', 'A');
  f.append('falas:sf-relig', 'Oi');
  assert.deepEqual(atendimentoDoFormulario(f, false), { categorias: [{ nome: 'A' }], servicos: {}, scripts: {} });
});
