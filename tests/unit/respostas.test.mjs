import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RESP_DEFERIMENTOS, RESP_INDEFERIMENTOS, respGerar, respValidar } from '../../src/nucleo/respostas.mjs';

const BASE = { resultado: 'Indeferido', servico: 'Troca de Titularidade', distribuidora: 'Coelba', protocolo: '123' };
const CAB = 'Caro Cliente, a Neoenergia Coelba informa:\n\nSeu protocolo de atendimento é: 123.';

test('um motivo: texto padrão do PDF, com norma e pedido', () => {
  assert.equal(
    respGerar({ ...BASE, motivos: ['data_futura'] }),
    `Título: TROCA DE TITULARIDADE INDEFERIDA – DOCUMENTO DO IMÓVEL COM DATA FUTURA\n\n${CAB}\n\n` +
      'Informamos que após análise, verificamos que a data presente no documento do imóvel é diferente da data atual, portanto, o seu pedido não pode ser realizado.\n\n' +
      'REN 1000/2024 (Art. 138. §1º, II - apresentação de documento, com data, que comprove a propriedade ou posse do imóvel em que se localizam as instalações do consumidor e demais usuários, observado o art. 14.\n\n' +
      'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos seguir com sua Troca de Titularidade.',
  );
  // sem norma e sem pedido
  const t = respGerar({ ...BASE, motivos: ['debito_outra_uc'] });
  assert.ok(t.endsWith('na área de atuação da distribuidora'));
  assert.ok(!t.includes('Solicitamos'));
  // documento informado no texto; sem documento, fica XXXXX
  assert.ok(respGerar({ ...BASE, motivos: ['documentacao_incompleta'], documento: 'RG' }).includes('presença do documento RG anexado'));
  assert.ok(respGerar({ ...BASE, motivos: ['documentacao_incompleta'] }).includes('presença do documento XXXXX anexado'));
});

test('vários motivos: título, lista, normas sem repetir e um só pedido de documentação', () => {
  const t = respGerar({ ...BASE, servico: 'Reativação', motivos: ['cpf_invalido', 'endereco_divergente', 'processo_fraude'] });
  assert.ok(
    t.startsWith('Título: REATIVAÇÃO INDEFERIDA – ENDEREÇO DO DOCUMENTO DO IMÓVEL DIVERGENTE NO SISTEMA COMERCIAL / CPF/CNPJ INVÁLIDO / PROCESSO DE FRAUDE'),
  );
  assert.ok(
    t.includes(
      'Informamos que após análise, verificamos que:\n1. os endereços presentes no Documento do Imóvel e no nosso sistema comercial são divergentes;\n2. o documento CPF/CNPJ',
    ),
  );
  assert.ok(
    t.includes(
      '3. existe um processo de emissão de fatura de cobrança de fraude/irregularidade em andamento.\n\nPortanto, o seu pedido de Reativação não pôde ser realizado.',
    ),
  );
  assert.equal((t.match(/envie a documentação/g) || []).length, 1);
  assert.ok(
    t.includes(
      'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua Reativação.',
    ),
  );
  assert.ok(
    t.endsWith(
      'Solicitamos que a reativação seja solicitada após a conclusão/emissão da fatura de fraude ou irregularidade para que possamos prosseguir com a sua Reativação.',
    ),
  );
  // a mesma norma citada uma vez só; dois motivos com um pedido só: o pedido do próprio motivo
  const dois = respGerar({ ...BASE, motivos: ['debito_outra_uc', 'data_futura'] });
  assert.ok(dois.endsWith('para que possamos seguir com sua Troca de Titularidade.'));
  assert.equal(respGerar({ ...BASE, motivos: ['nao_existe'] }), '');
  assert.equal(respGerar({ ...BASE, motivos: [] }), '');
});

test('deferimento total e parcial; dados ausentes viram XXXXX; serviço inválido usa Troca', () => {
  assert.equal(
    respGerar({ ...BASE, resultado: 'Deferido', motivos: ['total'] }),
    `Título: TROCA DE TITULARIDADE – ISENÇÃO DE DÉBITOS DEFERIDA\n\n${CAB}\n\n` +
      'Informamos que após análise, a sua solicitação de isenção de débitos foi deferida. Os débitos do período analisado não serão cobrados do(a) senhor(a) e o seu pedido de Troca de Titularidade seguirá normalmente.',
  );
  assert.ok(respGerar({ ...BASE, resultado: 'Deferido', motivos: ['parcial'], detalhe: '01/2025' }).includes('Período/valor isento: 01/2025.'));
  assert.ok(
    respGerar({ resultado: 'Deferido', servico: 'x', motivos: ['?'] }).includes(
      'Caro Cliente, a Neoenergia XXXXX informa:\n\nSeu protocolo de atendimento é: XXXXX.',
    ),
  );
  assert.ok(respGerar({ resultado: 'Deferido' }).startsWith('Título: TROCA DE TITULARIDADE – ISENÇÃO DE DÉBITOS DEFERIDA\n'));
  assert.ok(respGerar({ resultado: 'Deferido', motivos: ['parcial'] }).includes('Período/valor isento: XXXXX.'));
});

test('validação', () => {
  assert.deepEqual(respValidar({}), [
    'Escolha o resultado (Deferido ou Indeferido).',
    'Escolha o serviço (Troca de Titularidade ou Reativação).',
    'Informe o protocolo de atendimento.',
    'Escolha a distribuidora.',
  ]);
  assert.deepEqual(respValidar({ ...BASE, motivos: [] }), ['Marque pelo menos um motivo do indeferimento.']);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['documentacao_incompleta'], documento: ' ' }), ['Informe qual documento não foi identificado.']);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['documentacao_incompleta'], documento: 'RG' }), []);
  assert.deepEqual(respValidar({ ...BASE, resultado: 'Deferido', motivos: ['?'] }), ['Escolha o tipo de deferimento.']);
  assert.deepEqual(respValidar({ ...BASE, resultado: 'Deferido', motivos: ['parcial'] }), ['Informe o período/valor isento no deferimento parcial.']);
  assert.deepEqual(respValidar({ ...BASE, resultado: 'Deferido', motivos: ['total'] }), []);
  assert.equal(RESP_INDEFERIMENTOS.length, 6);
  assert.equal(RESP_DEFERIMENTOS.length, 2);
});
