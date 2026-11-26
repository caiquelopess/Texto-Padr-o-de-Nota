import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RESP_INDEFERIMENTOS, respGerar, respValidar } from '../../src/nucleo/respostas.mjs';

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

test('deferido não tem texto de resposta; dados ausentes viram XXXXX; serviço inválido usa Troca', () => {
  assert.equal(respGerar({ ...BASE, resultado: 'Deferido' }), '');
  assert.equal(respGerar({}), '');
  const t = respGerar({ resultado: 'Indeferido', servico: 'x', motivos: ['processo_fraude'] });
  assert.ok(t.startsWith('Título: TROCA DE TITULARIDADE INDEFERIDA – PROCESSO DE FRAUDE'));
  assert.ok(t.includes('Caro Cliente, a Neoenergia XXXXX informa:\n\nSeu protocolo de atendimento é: XXXXX.'));
});

test('motivos novos: ilegível, sem data, pendência na Receita e débito de responsabilidade', () => {
  const il = respGerar({ ...BASE, motivos: ['documento_ilegivel'], documento: 'contrato de locação' });
  assert.ok(il.includes('o documento contrato de locação anexado em sua solicitação está ilegível'));
  assert.ok(
    il.endsWith(
      'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua Troca de Titularidade.',
    ),
  );
  // só pendência do cliente: "NÃO CONCLUÍDA"; junto com indeferimento: "INDEFERIDA"
  assert.ok(respGerar({ ...BASE, motivos: ['nome_divergente_receita'] }).startsWith('Título: TROCA DE TITULARIDADE NÃO CONCLUÍDA – PENDÊNCIA CADASTRAL'));
  const misto = respGerar({ ...BASE, motivos: ['imovel_sem_data', 'nome_divergente_receita', 'documento_ilegivel'], documento: 'RG' });
  assert.ok(misto.startsWith('Título: TROCA DE TITULARIDADE INDEFERIDA – DOCUMENTO ILEGÍVEL / DOCUMENTO DO IMÓVEL SEM DATA'));
  assert.equal((misto.match(/envie a documentação/g) || []).length, 1);
  assert.ok(misto.endsWith('retorne a um de nossos Canais de Atendimento para que possamos prosseguir com a sua Troca de Titularidade.'));
  // normas iguais citadas uma vez (ilegível + documentação incompleta usam o mesmo Art. 138 de 2021)
  const dois = respGerar({ ...BASE, motivos: ['documentacao_incompleta', 'documento_ilegivel'], documento: 'RG' });
  assert.equal((dois.match(/REN 1000\/2021 \(Art\. 138/g) || []).length, 1);
  const deb = respGerar({ ...BASE, motivos: ['debito_responsabilidade'] });
  assert.ok(deb.includes('a isenção de débitos não pôde ser concedida'));
  assert.ok(deb.endsWith('os débitos deverão ser quitados ou negociados em um de nossos Canais de Atendimento.'));
  const comAviso = RESP_INDEFERIMENTOS.filter((m) => m.aviso).map((m) => m.id);
  assert.deepEqual(comAviso, ['endereco_divergente', 'nome_divergente_receita', 'debito_responsabilidade']);
});

test('validação', () => {
  assert.deepEqual(respValidar({}), [
    'Escolha o resultado (Deferido ou Indeferido).',
    'Escolha o serviço (Troca de Titularidade ou Reativação).',
    'Informe o protocolo de atendimento.',
    'Escolha a distribuidora.',
  ]);
  assert.deepEqual(respValidar({ ...BASE, motivos: [] }), ['Marque pelo menos um motivo do indeferimento.']);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['documentacao_incompleta'], documento: ' ' }), [
    'Informe qual documento não foi identificado ou está ilegível.',
  ]);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['documentacao_incompleta'], documento: 'RG' }), []);
  assert.deepEqual(respValidar({ resultado: 'Deferido' }), []);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['debito_responsabilidade'] }), [
    'Confirme que há comprovação do débito de responsabilidade do solicitante (leia as orientações).',
  ]);
  assert.deepEqual(respValidar({ ...BASE, motivos: ['debito_responsabilidade'], confirmado: true }), []);
  assert.equal(RESP_INDEFERIMENTOS.length, 10);
});
