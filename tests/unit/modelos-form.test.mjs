import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIAS_PADRAO, modeloDoFormulario } from '../../functions/_lib/modelos-form.js';

const formulario = (pares) => {
  const f = new FormData();
  for (const [k, v] of pares) f.append(k, v);
  return f;
};

test('formulário do editor vira o modelo', () => {
  const f = formulario([
    ['nome', ' Atualização '],
    ['categoria', 'Titularidade e Cadastro'],
    ['descricao', 'desc'],
    ['avisos', 'Aviso 1\r\n\r\n Aviso 2 '],
    ['copiar', 'agenda'],
    ['campo_id', 'motivo'],
    ['campo_rotulo', 'Motivo'],
    ['campo_tipo', 'opcao'],
    ['campo_obrigatorio', 'sim'],
    ['campo_opcoes', 'A | B |'],
    ['campo_mostrar', ''],
    ['campo_id', 'pns'],
    ['campo_rotulo', 'PNs'],
    ['campo_tipo', 'texto'],
    ['campo_obrigatorio', 'nao'],
    ['campo_opcoes', 'ignorado'],
    ['campo_mostrar', 'motivo = B|C'],
    ['campo_id', ''],
    ['campo_rotulo', ''],
    ['campo_tipo', 'texto'],
    ['campo_obrigatorio', 'nao'],
    ['campo_opcoes', ''],
    ['campo_mostrar', ''],
    ['campo_id', 'x'],
    ['campo_rotulo', 'X'],
    ['campo_tipo', ''],
    ['campo_obrigatorio', 'nao'],
    ['campo_opcoes', ''],
    ['campo_mostrar', 'invalido'],
    ['nota', 'Linha 1\r\nLinha 2\n\n'],
    ['agenda', ''],
  ]);
  assert.deepEqual(modeloDoFormulario(f, 'atualizacao'), {
    id: 'atualizacao',
    nome: 'Atualização',
    categoria: 'Titularidade e Cadastro',
    descricao: 'desc',
    avisos: ['Aviso 1', 'Aviso 2'],
    copiar: 'agenda',
    campos: [
      { id: 'motivo', rotulo: 'Motivo', tipo: 'opcao', obrigatorio: true, opcoes: ['A', 'B'] },
      { id: 'pns', rotulo: 'PNs', tipo: 'texto', mostrarSe: { campo: 'motivo', igual: ['B', 'C'] } },
      { id: 'x', rotulo: 'X', tipo: 'texto' },
    ],
    nota: 'Linha 1\nLinha 2',
    agenda: '',
  });
  const vazio = modeloDoFormulario(formulario([]), 'z');
  assert.equal(vazio.copiar, 'nota');
  assert.deepEqual(vazio.campos, []);
  assert.deepEqual(vazio.avisos, []);
  assert.equal(CATEGORIAS_PADRAO.length, 7);
});
