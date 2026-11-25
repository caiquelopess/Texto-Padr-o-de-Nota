import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MD_TIPOS, mdCamposVisiveis, mdGerar, mdTestarModelo, mdValidarModelo, mdValidarValores } from '../../src/nucleo/modelos.mjs';

// Atualização Cadastral escrita como dados (mesmo texto do serviço atual).
const atualizacao = {
  id: 'atualizacao-cadastral',
  nome: 'Atualização Cadastral',
  categoria: 'Titularidade e Cadastro',
  campos: [
    { id: 'motivo', rotulo: 'Motivo', tipo: 'opcao', obrigatorio: true, opcoes: ['Erro de Endereço', 'Unificar PN', 'Correção de Nome'] },
    { id: 'pns', rotulo: 'PNs', tipo: 'texto', obrigatorio: true, mostrarSe: { campo: 'motivo', igual: 'Unificar PN' } },
    { id: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
    { id: 'tel', rotulo: 'Telefone', tipo: 'telefone', obrigatorio: true },
    { id: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
    { id: 'rg', rotulo: 'RG', tipo: 'texto' },
    { id: 'cnh', rotulo: 'CNH', tipo: 'texto' },
    { id: 'idp', rotulo: 'ID (identificação profissional)', tipo: 'texto' },
  ],
  nota: [
    'Gentileza Atualizar Cadastro',
    'Motivo: {{motivo}}',
    '{{#se motivo=Unificar PN}}',
    'PNs: {{pns}}',
    '{{/se}}',
    '{{#se nome}}',
    'Nome: {{nome}}',
    '{{/se}}',
    '{{#se tel}}',
    'Telefone: {{tel}}',
    '{{/se}}',
    '{{#se email}}',
    'E-mail: {{email}}',
    '{{/se}}',
    '{{#se rg}}',
    'RG: {{rg}}',
    '{{/se}}',
    '{{#se cnh}}',
    'CNH: {{cnh}}',
    '{{/se}}',
    '{{#se idp}}',
    'ID (identificação profissional): {{idp}}',
    '{{/se}}',
  ].join('\n'),
  agenda: '',
};

test('equivalência: Atualização Cadastral igual ao texto oficial atual', () => {
  const v = { motivo: 'Erro de Endereço', nome: 'Maria Teste', tel: '71993501519', email: 'maria@email.com', rg: '1234567', cnh: '', idp: '' };
  assert.deepEqual(mdValidarValores(atualizacao, v), []);
  assert.equal(
    mdGerar(atualizacao, v).nota,
    'Gentileza Atualizar Cadastro\nMotivo: Erro de Endereço\nNome: Maria Teste\nTelefone: (71) 99350-1519\nE-mail: maria@email.com\nRG: 1234567',
  );
  const pn = mdGerar(atualizacao, { ...v, motivo: 'Unificar PN', pns: '1010000001, 1010000002' }).nota.split('\n');
  assert.deepEqual(pn.slice(0, 3), ['Gentileza Atualizar Cadastro', 'Motivo: Unificar PN', 'PNs: 1010000001, 1010000002']);
  // campo escondido não entra, mesmo que tenha valor guardado
  assert.ok(!mdGerar(atualizacao, { ...v, pns: '999' }).nota.includes('999'));
  assert.equal(mdGerar(atualizacao, v).agenda, '');
});

test('filtros e blocos', () => {
  const m = {
    id: 'teste-filtros',
    nome: 'T',
    categoria: 'C',
    campos: [
      { id: 'a', rotulo: 'A', tipo: 'texto' },
      { id: 'tel', rotulo: 'Tel', tipo: 'telefone' },
      { id: 'b', rotulo: 'B', tipo: 'texto' },
    ],
    nota: '{{a|maiusculas}} {{ tel | telefoneNota }} {{b|ou:Não informado}}{{#se a=x}} X{{/se}}{{#se a = Abc}} SIM{{/se}}',
    agenda: 'Tel {{tel}}',
  };
  assert.equal(mdGerar(m, { a: 'Abc', tel: '71 99350-1519 / 7133334444', b: '' }).nota, 'ABC 71-993501519 / 71-33334444 Não informado SIM');
  assert.equal(mdGerar(m, { tel: '123' }).agenda, 'Tel 123');
  assert.equal(mdGerar(m, {}).nota, '  Não informado');
  assert.deepEqual(mdValidarModelo(m), []);
});

test('blocos aninhados e "mostrar se" com várias opções', () => {
  const m = {
    id: 'aninhado',
    nome: 'N',
    categoria: 'C',
    campos: [
      { id: 'tipo', rotulo: 'Tipo', tipo: 'opcao', opcoes: ['A', 'B', 'C'] },
      { id: 'x', rotulo: 'X', tipo: 'texto', mostrarSe: { campo: 'tipo', igual: ['B', 'C'] } },
    ],
    nota: '{{#se tipo}}T={{tipo}}{{#se x}};X={{x}}{{/se}}{{/se}}',
  };
  assert.equal(mdGerar(m, { tipo: 'B', x: '1' }).nota, 'T=B;X=1');
  assert.equal(mdGerar(m, { tipo: 'A', x: '1' }).nota, 'T=A');
  assert.equal(mdGerar(m, {}).nota, '');
  assert.deepEqual(
    mdCamposVisiveis(m, { tipo: 'C' }).map((c) => c.id),
    ['tipo', 'x'],
  );
  assert.deepEqual(
    mdCamposVisiveis(m, {}).map((c) => c.id),
    ['tipo'],
  );
  assert.deepEqual(mdCamposVisiveis({}, {}), []);
});

test('validação do preenchimento', () => {
  const m = {
    campos: [
      { id: 'n', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { id: 't', rotulo: 'Telefone', tipo: 'telefone' },
      { id: 'e', rotulo: 'E-mail', tipo: 'email' },
      { id: 'd', rotulo: 'Data', tipo: 'data' },
      { id: 'q', rotulo: 'Qtd', tipo: 'numero' },
      { id: 'o', rotulo: 'Op', tipo: 'opcao', opcoes: ['Sim', 'Não'] },
    ],
  };
  assert.deepEqual(mdValidarValores(m, { n: ' ', t: '123', e: 'x@', d: '1/1/26', q: '1a', o: 'Talvez' }), [
    'Preencha o campo: Nome',
    'Telefone: telefone com DDD (10 ou 11 dígitos).',
    'E-mail: e-mail inválido.',
    'Data: use dd/mm/aaaa.',
    'Qtd: só números.',
    'Op: escolha uma das opções.',
  ]);
  assert.deepEqual(mdValidarValores(m, { n: 'Ana', t: '7133334444', e: 'Não informado', d: '01/01/2026', q: '12', o: 'Sim' }), []);
  assert.deepEqual(mdValidarValores(m, { n: 'Ana', e: 'a@b.co' }), []);
  assert.deepEqual(mdValidarValores(m), ['Preencha o campo: Nome']);
});

test('validação do modelo aponta cada problema', () => {
  assert.deepEqual(mdValidarModelo(null), ['Modelo vazio.']);
  const erros = mdValidarModelo({
    id: 'X!',
    nome: '',
    categoria: ' ',
    campos: [
      { id: 'a', rotulo: 'A', tipo: 'texto' },
      { id: 'a', rotulo: 'A2', tipo: 'texto' },
      { id: '9b', rotulo: 'B', tipo: 'texto' },
      { id: 'c', rotulo: '', tipo: 'cor' },
      { id: 'd', rotulo: 'D', tipo: 'opcao', opcoes: [] },
      { id: 'e', rotulo: 'E', tipo: 'texto', mostrarSe: { campo: 'zz', igual: 'x' } },
    ],
    nota: '{{#se a}}{{a}} {{nada}} {{a|gritar}}',
    agenda: '{{#se fantasma}}x{{/se}}',
  });
  for (const esperado of [
    'Identificador inválido: use de 3 a 60 letras minúsculas, números e hífen.',
    'Dê um nome ao modelo.',
    'Escolha a categoria.',
    'Campo "a" repetido.',
    'Campo "B": identificador inválido (letras minúsculas, números e _).',
    'Campo "c": falta o rótulo.',
    'Campo "c": tipo desconhecido.',
    'Campo "D": informe as opções.',
    'Campo "E": "mostrar se" usa um campo que não existe.',
    'Texto da NOTA: blocos {{#se}} e {{/se}} não fecham.',
    'Texto da NOTA: {{nada}} não é um campo do modelo.',
    'Texto da NOTA: filtro "gritar" desconhecido.',
    'Texto da AGENDA: {{#se fantasma}} usa um campo que não existe.',
  ])
    assert.ok(erros.includes(esperado), esperado);
  assert.ok(mdValidarModelo({ id: 'abc', nome: 'N', categoria: 'C', campos: [] }).includes('Escreva o texto da NOTA ou da AGENDA.'));
  assert.deepEqual(MD_TIPOS.length, 7);
});

test('teste automático antes de publicar', () => {
  const r = mdTestarModelo(atualizacao);
  assert.equal(r.ok, true, r.erros.join('; '));
  assert.equal(r.exemplos.length, 3); // uma saída para cada opção do motivo
  assert.ok(r.exemplos[1].nota.includes('PNs: Teste PNs'));
  // modelo inválido não chega a gerar
  const ruim = mdTestarModelo({ id: 'x', nome: '', categoria: '', campos: [], nota: '' });
  assert.equal(ruim.ok, false);
  assert.deepEqual(ruim.exemplos, []);
  // texto vazio para a combinação testada
  const vazio = mdTestarModelo({ id: 'vazio', nome: 'V', categoria: 'C', campos: [{ id: 'a', rotulo: 'A', tipo: 'texto' }], nota: '{{#se a=zzz}}x{{/se}}' });
  assert.deepEqual(vazio.erros, ['Teste: o texto gerado ficou vazio.']);
  // marcador malformado sobra no texto
  const sobra = mdTestarModelo({ id: 'sobra', nome: 'S', categoria: 'C', campos: [{ id: 'a', rotulo: 'A', tipo: 'texto' }], nota: 'Olá {{A}}' });
  assert.deepEqual(sobra.erros, ['Teste: sobrou marcador {{ }} no texto gerado.']);
  // exemplo de cada tipo passa na própria validação
  const todos = mdTestarModelo({
    id: 'todos-os-tipos',
    nome: 'T',
    categoria: 'C',
    campos: MD_TIPOS.map((t) => ({ id: `c_${t.toLowerCase()}`, rotulo: t, tipo: t, obrigatorio: true, opcoes: ['Um', 'Dois'] })),
    agenda: MD_TIPOS.map((t) => `{{c_${t.toLowerCase()}}}`).join(' '),
  });
  assert.equal(todos.ok, true, todos.erros.join('; '));
  assert.equal(todos.exemplos[0].agenda, 'Teste texto Teste textoLongo (71) 99350-1519 teste@email.com 10/11/2026 123456 Um');
});

test('limites das validações (início e fim do texto)', () => {
  const base = { nome: 'N', categoria: 'C', campos: [{ id: 'a', rotulo: 'A', tipo: 'texto' }], nota: '{{a}}' };
  const idErr = 'Identificador inválido: use de 3 a 60 letras minúsculas, números e hífen.';
  assert.ok(mdValidarModelo({ ...base, id: 'abc!' }).includes(idErr));
  assert.ok(mdValidarModelo({ ...base, id: '!abc' }).includes(idErr));
  assert.ok(mdValidarModelo({ ...base }).includes(idErr));
  assert.ok(!mdValidarModelo({ ...base, id: 'abc' }).includes(idErr));
  const campoErr = 'Campo "A": identificador inválido (letras minúsculas, números e _).';
  assert.ok(mdValidarModelo({ ...base, id: 'abc', campos: [{ id: 'a-b', rotulo: 'A', tipo: 'texto' }] }).includes(campoErr));
  assert.ok(mdValidarModelo({ ...base, id: 'abc', campos: [{ rotulo: 'A', tipo: 'texto' }] }).includes(campoErr));
  assert.ok(mdValidarModelo({ ...base, id: 'abc', campos: 'x' }).includes('Texto da NOTA: {{a}} não é um campo do modelo.'));
  assert.ok(mdValidarModelo({ ...base, id: 'abc', nota: '{{#seb}}' }).length === 0);
  const m = {
    campos: [
      { id: 'e', rotulo: 'E', tipo: 'email' },
      { id: 'd', rotulo: 'D', tipo: 'data' },
      { id: 'q', rotulo: 'Q', tipo: 'numero' },
    ],
  };
  for (const [v, esperado] of [
    [{ e: 'xx a@b.co' }, 'E: e-mail inválido.'],
    [{ e: 'a@b.co x' }, 'E: e-mail inválido.'],
    [{ d: '01/01/2026x' }, 'D: use dd/mm/aaaa.'],
    [{ d: 'x01/01/2026' }, 'D: use dd/mm/aaaa.'],
    [{ q: 'a12' }, 'Q: só números.'],
  ])
    assert.deepEqual(mdValidarValores(m, v), [esperado], JSON.stringify(v));
});

test('espaços, quebras finais e "mostrar se" sem valor', () => {
  const m = {
    campos: [
      { id: 'a', rotulo: 'A', tipo: 'texto' },
      { id: 'b', rotulo: 'B', tipo: 'texto', mostrarSe: { campo: 'a', igual: 'x' } },
    ],
    nota: 'A={{a}}{{#se a= x }}!{{/se}}{{#se b}}B{{/se}}\n\n',
  };
  assert.equal(mdGerar(m, { a: '  x  ' }).nota, 'A=x!');
  assert.equal(mdGerar(m, { a: '   ' }).nota, 'A=');
  assert.equal(mdGerar(m, { a: 'x', b: 'y' }).nota, 'A=x!B');
  assert.deepEqual(
    mdCamposVisiveis(m, {}).map((c) => c.id),
    ['a'],
  );
  assert.equal(mdGerar({ nota: 'fixo' }, {}).nota, 'fixo');
});

test('teste automático aponta campo que não passa na validação', () => {
  const r = mdTestarModelo({
    id: 'opcao-com-vazio',
    nome: 'O',
    categoria: 'C',
    campos: [{ id: 'o', rotulo: 'Opção', tipo: 'opcao', obrigatorio: true, opcoes: ['', 'Sim'] }],
    nota: 'Escolha: {{o|ou:nenhuma}}',
  });
  assert.equal(r.ok, false);
  assert.deepEqual(r.erros, ['Teste: Preencha o campo: Opção']);
});
