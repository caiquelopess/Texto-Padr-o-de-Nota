import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MD_TIPOS, mdCamposVisiveis, mdGerar, mdTestarModelo, mdValidarModelo, mdValidarValores } from '../../src/nucleo/modelos.mjs';

// O modelo de Atualização Cadastral que vai embutido no site (src/modelos).
const atualizacao = JSON.parse(readFileSync(new URL('../../src/modelos/atualizacao-cadastral.json', import.meta.url), 'utf8'));

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
  assert.deepEqual(MD_TIPOS.length, 9);
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
  assert.equal(todos.exemplos[0].agenda, 'Teste texto Teste textoLongo (71) 99350-1519 teste@email.com 10/11/2026 123456 Um 12345678901 10/2026');
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

test('padronização de datas e telefones (igual ao sistema anterior)', async () => {
  const { mdNormalizarValores } = await import('../../src/nucleo/modelos.mjs');
  const m = {
    campos: [
      { id: 'liv', rotulo: 'Ligar dia', tipo: 'data' },
      { id: 'pas', rotulo: 'Data da ligação', tipo: 'data', dataRegra: 'passada' },
      { id: 'tel', rotulo: 'Tel', tipo: 'telefone' },
      { id: 'esc', rotulo: 'Escondido', tipo: 'data', mostrarSe: { campo: 'x', igual: 'sim' } },
      { id: 'txt', rotulo: 'Texto', tipo: 'texto' },
    ],
  };
  const hoje = new Date(2026, 10, 25, 15, 30);
  assert.deepEqual(mdNormalizarValores(m, { liv: '1/2/2027', pas: ' 25 / 11 / 2026 ', tel: '71993501519', esc: 'lixo', txt: ' a ' }, hoje), {
    valores: { liv: '01/02/2027', pas: '25/11/2026', tel: '(71) 99350-1519', esc: 'lixo', txt: ' a ' },
    erros: [],
  });
  assert.deepEqual(mdNormalizarValores(m, { liv: '2026-11-01', pas: '26/11/2026', tel: '123' }, hoje).erros, [
    'A data do campo "Ligar dia" deve estar no formato dd/mm/aaaa.',
    'A data do campo "Data da ligação" não pode ser uma data futura.',
    'O telefone do campo "Tel" deve ter 10 ou 11 dígitos, com DDD.',
  ]);
  for (const ruim of ['31/02/2026', '00/01/2026', '10/13/2026', '32/01/2026', '29/02/2025'])
    assert.deepEqual(mdNormalizarValores(m, { liv: ruim }, hoje).erros, ['A data do campo "Ligar dia" não é uma data real. Verifique o dia e o mês.'], ruim);
  assert.deepEqual(mdNormalizarValores(m, { liv: '29/02/2028' }, hoje).valores.liv, '29/02/2028');
  assert.deepEqual(mdNormalizarValores(m, { esc: '1/1/2020', x: 'sim' }, hoje).valores.esc, '01/01/2020');
  assert.deepEqual(mdNormalizarValores(m, {}).erros, []);
});

test('documento (CPF/CNPJ), data ou mês e rótulo condicional', async () => {
  const { mdNormalizarValores, mdRotulo } = await import('../../src/nucleo/modelos.mjs');
  const m = {
    id: 'docs',
    nome: 'Docs',
    categoria: 'X',
    campos: [
      { id: 'tipo', rotulo: 'Tipo', tipo: 'opcao', opcoes: ['pf', 'pj'] },
      { id: 'doc', rotulo: 'CPF/CNPJ:', tipo: 'documento', obrigatorio: true, rotuloSe: { campo: 'tipo', igual: 'pj', rotulo: 'Documento PJ:' } },
      { id: 'cpf', rotulo: 'CPF:', tipo: 'documento', documento: 'cpf' },
      { id: 'cnpj', rotulo: 'CNPJ:', tipo: 'documento', documento: 'cnpj' },
      { id: 'venc', rotulo: 'Vencimento:', tipo: 'dataOuMes' },
    ],
    nota: '{{doc}} {{cpf}} {{cnpj}} {{venc}}',
  };
  assert.deepEqual(mdValidarModelo(m), []);
  assert.equal(mdTestarModelo(m).ok, true);
  const n = (v) => mdNormalizarValores(m, { tipo: 'pf', ...v });
  assert.deepEqual(n({ doc: '123.456.789-01', cpf: '12345678901', cnpj: '12345678000195', venc: '3/2026' }).valores, {
    tipo: 'pf',
    doc: '123.456.789-01',
    cpf: '123.456.789-01',
    cnpj: '12.345.678/0001-95',
    venc: '03/2026',
  });
  assert.equal(n({ doc: '12345678000195', venc: '5/1/2027' }).valores.doc, '12.345.678/0001-95');
  assert.equal(n({ venc: '5/1/2027' }).valores.venc, '05/01/2027');
  assert.deepEqual(n({ doc: '123', cpf: '12345678000195', cnpj: '12345678901' }).erros, [
    'O campo "CPF/CNPJ:" deve conter um CPF com 11 números ou um CNPJ com 14 números. Verifique e tente novamente.',
    'O campo "CPF:" deve conter um CPF com 11 números. Verifique e tente novamente.',
    'O campo "CNPJ:" deve conter um CNPJ com 14 números. Verifique e tente novamente.',
  ]);
  assert.deepEqual(mdNormalizarValores(m, { tipo: 'pj', doc: '1' }).erros[0].slice(0, 22), 'O campo "Documento PJ:');
  assert.deepEqual(n({ venc: '13/2026' }).erros, ['O mês do campo "Vencimento:" deve ser entre 01 e 12.']);
  for (const ruim of ['31/02/2027', '0/2026x', 'abc', '1/1/27'])
    assert.deepEqual(n({ venc: ruim }).erros, ['O campo "Vencimento:" deve ter uma data real (dd/mm/aaaa) ou um mês/ano (mm/aaaa) válido.'], ruim);
  assert.deepEqual(n({ venc: '00/2026' }).erros, ['O mês do campo "Vencimento:" deve ser entre 01 e 12.']);
  // rótulo condicional e mensagens de validação
  assert.equal(mdRotulo(m.campos[1], { tipo: 'pj' }), 'Documento PJ:');
  assert.equal(mdRotulo(m.campos[1], { tipo: 'pf' }), 'CPF/CNPJ:');
  assert.deepEqual(mdValidarValores(m, { tipo: 'pj' }), ['Preencha o campo: Documento PJ:']);
  assert.deepEqual(mdValidarValores(m, { tipo: 'pf', doc: '1', venc: '1/2026' }), [
    'CPF/CNPJ:: documento inválido.',
    'Vencimento:: use dd/mm/aaaa ou mm/aaaa.',
  ]);
  assert.deepEqual(mdValidarValores(m, { tipo: 'pf', doc: '123.456.789-01', venc: '01/02/2026' }), []);
  // estrutura
  assert.deepEqual(mdValidarModelo({ ...m, campos: [{ ...m.campos[2], documento: 'rg' }] }).slice(0, 1), [
    'Campo "CPF:": documento deve ser doc, cpf ou cnpj.',
  ]);
  assert.deepEqual(
    mdValidarModelo({ ...m, campos: [...m.campos.slice(2), { ...m.campos[1], rotuloSe: { campo: 'x', rotulo: 'Y' } }] }).includes(
      'Campo "CPF/CNPJ:": "rótulo se" incompleto.',
    ),
    true,
  );
});

test('subtipos e "preencher se" na estrutura do modelo', () => {
  const base = {
    id: 'sub',
    nome: 'Sub',
    categoria: 'X',
    campos: [
      { id: 'tipo', rotulo: 'Tipo', tipo: 'opcao', opcoes: ['a', 'b'], oculto: true },
      { id: 'mmgd', rotulo: 'MMGD', tipo: 'opcao', opcoes: ['Não', 'Sim'] },
      { id: 'neo', rotulo: 'Neo', tipo: 'texto', preencherSe: { campo: 'mmgd', igual: 'Não', valor: 'nao' } },
    ],
    subtipos: {
      campo: 'tipo',
      botoes: [
        { valor: 'a', nome: 'Botão A' },
        { valor: 'b', nome: 'Botão B' },
      ],
    },
    nota: '{{#se tipo=a}}A {{neo}}{{/se}}{{#se tipo=b}}B{{/se}}',
  };
  assert.deepEqual(mdValidarModelo(base), []);
  assert.equal(mdTestarModelo(base).ok, true);
  const sub = (s) => mdValidarModelo({ ...base, subtipos: s });
  assert.deepEqual(sub({ campo: 'neo', botoes: [{ valor: 'a', nome: 'A' }] }), ['Subtipos: o campo escolhido precisa ser uma opção (lista).']);
  assert.deepEqual(sub({ campo: 'tipo', botoes: [{ valor: 'z', nome: 'Z' }] }), ['Subtipos: cada botão precisa de nome e de uma opção do campo.']);
  assert.deepEqual(sub({ campo: 'tipo', botoes: [] }), ['Subtipos: cada botão precisa de nome e de uma opção do campo.']);
  assert.deepEqual(sub({ campo: 'tipo', botoes: [{ valor: 'a', nome: ' ' }] }), ['Subtipos: cada botão precisa de nome e de uma opção do campo.']);
  const ruim = { ...base, campos: [...base.campos.slice(0, 2), { ...base.campos[2], preencherSe: { campo: 'x', valor: 'nao' } }] };
  assert.deepEqual(mdValidarModelo(ruim), ['Campo "Neo": "preencher se" incompleto.']);
  const semValor = { ...base, campos: [...base.campos.slice(0, 2), { ...base.campos[2], preencherSe: { campo: 'mmgd', valor: '' } }] };
  assert.deepEqual(mdValidarModelo(semValor), ['Campo "Neo": "preencher se" incompleto.']);
});

test('notaMaiusculas: nota em maiúsculas e sem espaços repetidos; agenda intacta', () => {
  const m = {
    id: 'caps',
    nome: 'Caps',
    categoria: 'X',
    notaMaiusculas: true,
    campos: [
      { id: 'a', rotulo: 'A', tipo: 'texto' },
      { id: 'b', rotulo: 'B', tipo: 'texto' },
      { id: 'leit', rotulo: 'Leitura', tipo: 'texto' },
    ],
    nota: 'RT {{a}} {{b}} fim {{#se leit}}LEITURA {{leit}}{{/se}}{{#se leit=}}NAO INFORMOU LEITURA{{/se}}',
    agenda: 'Agenda {{a}}  {{b}}',
  };
  assert.deepEqual(mdGerar(m, { a: 'ap 101', b: '', leit: '' }), { nota: 'RT AP 101 FIM NAO INFORMOU LEITURA', agenda: 'Agenda ap 101  ' });
  assert.equal(mdGerar(m, { a: 'x', b: 'y', leit: '12' }).nota, 'RT X Y FIM LEITURA 12');
  assert.equal(mdGerar({ ...m, notaMaiusculas: false }, { a: 'x', leit: '1' }).nota, 'RT x  fim LEITURA 1');
});
