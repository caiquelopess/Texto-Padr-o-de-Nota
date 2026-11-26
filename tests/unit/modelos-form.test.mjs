import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIAS_PADRAO, MOSTRAR_AVANCADO, modeloDoFormulario, mostrarSeSimples, textoDoAviso } from '../../functions/_lib/modelos-form.js';

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

test('modelo do sistema personalizado: o que o formulário não mostra é mantido', () => {
  const base = {
    id: 'troca-titularidade',
    sf: 'sf-tt',
    nome: 'Troca',
    categoria: 'Titularidade e Cadastro',
    botao: 'Gerar Texto e Copiar',
    subtipos: { campo: 'tipo', botoes: [{ valor: 'a', nome: 'A' }] },
    avisos: [
      { html: '<b>Atenção:</b> CNPJ', classeOriginal: 'alert-box alerta-cnpj', id: 'pade_tt', mostrarSe: { campo: 'tipo', igual: 'a' } },
      'Texto simples',
    ],
    campos: [
      { id: 'tipo', elementoId: 'tt_tipo', rotulo: 'Tipo', tipo: 'opcao', opcoes: ['a', 'b'], rotulosOpcoes: ['A', 'B'], oculto: true, obrigatorio: true },
      {
        id: 'solic',
        elementoId: 'tt_solic',
        rotulo: 'Solicitante',
        tipo: 'texto',
        dica: 'Nome',
        rotuloSe: { campo: 'tipo', igual: 'b', rotulo: 'Titular' },
        mostrarSe: [
          { campo: 'tipo', igual: 'a' },
          { campo: 'tipo', igual: ['a', 'b'] },
        ],
      },
      { id: 'cpf', elementoId: 'tt_cpf', rotulo: 'CPF', tipo: 'documento', obrigatorio: true },
    ],
    nota: 'x',
    agenda: '',
  };
  const linha = (id, rotulo, tipo, obrig, opcoes, mostrar) => [
    ['campo_id', id],
    ['campo_rotulo', rotulo],
    ['campo_tipo', tipo],
    ['campo_obrigatorio', obrig],
    ['campo_opcoes', opcoes],
    ['campo_mostrar', mostrar],
  ];
  const f = formulario([
    ['nome', 'Troca de Titularidade'],
    ['categoria', 'Titularidade e Cadastro'],
    ['descricao', ''],
    ['avisos', 'Atenção: CNPJ\nAviso novo'],
    ['copiar', 'nota'],
    ...linha('tipo', 'Tipo', 'opcao', 'sim', 'a | b', ''),
    ...linha('solic', 'Solicitante (titular)', 'texto', 'sim', '', MOSTRAR_AVANCADO),
    ...linha('cpf', 'CPF/CNPJ', 'documento', 'nao', '', 'tipo=b'),
    ['nota', 'Novo texto {{solic}}'],
    ['agenda', ''],
  ]);
  const m = modeloDoFormulario(f, 'troca-titularidade', base);
  // configurações do modelo
  assert.equal(m.sf, 'sf-tt');
  assert.equal(m.botao, 'Gerar Texto e Copiar');
  assert.deepEqual(m.subtipos, base.subtipos);
  assert.equal(m.nome, 'Troca de Titularidade');
  assert.equal(m.nota, 'Novo texto {{solic}}');
  // aviso igual mantém a formatação; linha nova é texto puro; aviso apagado sai
  assert.deepEqual(m.avisos, [base.avisos[0], 'Aviso novo']);
  // campos: ids originais, dica, rótulos das opções (opções iguais) e regras avançadas mantidos
  assert.deepEqual(m.campos[0], { ...base.campos[0] });
  assert.deepEqual(m.campos[1], { ...base.campos[1], rotulo: 'Solicitante (titular)', obrigatorio: true });
  assert.deepEqual(m.campos[2], { id: 'cpf', elementoId: 'tt_cpf', rotulo: 'CPF/CNPJ', tipo: 'documento', mostrarSe: { campo: 'tipo', igual: ['b'] } });
  // opções mudadas: os rótulos antigos das opções saem
  const f2 = formulario([...f.entries()].map(([k, v]) => [k, k === 'campo_opcoes' && v === 'a | b' ? 'a | b | c' : v]));
  assert.equal(modeloDoFormulario(f2, 'troca-titularidade', base).campos[0].rotulosOpcoes, undefined);
  // sem base, nada de extra
  assert.equal(modeloDoFormulario(f, 'x').sf, undefined);
  assert.equal(textoDoAviso({ html: 'A<br>B <b>C</b>' }), 'A B C');
  assert.equal(textoDoAviso({ texto: ' T ' }), 'T');
  assert.equal(mostrarSeSimples({ campo: 'a', igual: 'b' }), true);
  assert.equal(mostrarSeSimples({ campo: 'a', maiorQue: 1 }), false);
});
