import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 11, Reclamações): textos gravados com o código ANTIGO,
// um caso por tipo (e por canal no Atendimento), com faturas em linhas na Leitura e faturamento.
const BASE = { rec_nome: 'Maria Souza', rec_tel: '71993501519', rec_email: 'm@e.com', rec_motivo: 'Cobrança acima do normal' };
const CASOS = [
  {
    valores: {
      ...BASE,
      rec_tipo: 'leitura_fat',
      rec_parte_interna: 'Não',
      rec_prob_medidor: 'Display apagado',
      rec_analises: 'Histórico de consumo',
      rec_leit_cliente: '15420',
      rec_dt_leit: '1/11/2025',
      rec_ref: 'Praça',
      rec_ant: '920012',
    },
    faturas: [
      ['1/10/2025', '150,00'],
      ['10/11/2025', '89,90'],
    ],
  },
  {
    valores: {
      ...BASE,
      rec_tipo: 'leitura_fat',
      rec_prob_medidor: 'Nenhum',
      rec_analises: 'Consumo',
      rec_leit_cliente: 'Sem leitura',
      rec_dt_leit: 'n/a',
      rec_ref: 'Praça',
      rec_modalidade: 'carta',
    },
    faturas: [['05/09/2025', '80,10']],
  },
  {
    valores: {
      ...BASE,
      rec_tipo: 'atendimento',
      rec_subcanal: 'presencial',
      rec_proto: 'P-1',
      rec_loja: 'Loja Centro',
      rec_data: '3/11/2025',
      rec_hora: '14:30',
      rec_func: 'Ana',
    },
  },
  {
    valores: {
      ...BASE,
      rec_tipo: 'atendimento',
      rec_subcanal: 'teleatendimento',
      rec_proto: 'P-2',
      rec_data: '03/11/2025',
      rec_hora: '9h',
      rec_func: 'Não soube informar',
    },
  },
  {
    valores: {
      ...BASE,
      rec_tipo: 'atendimento',
      rec_subcanal: 'campo',
      rec_equipe: 'Placa ABC-1234',
      rec_nota_exec: '920099',
      rec_data: '03/11/2025',
      rec_hora: '10:00',
      rec_func: 'João',
    },
  },
  { valores: { ...BASE, rec_tipo: 'atraso', rec_num_nota: '920001', rec_ref: 'Igreja', rec_modalidade: 'SMS' } },
  { valores: { ...BASE, rec_tipo: 'cadastro', rec_end_atual: 'Rua A, 10', rec_cc_atual: '7000000001' } },
  { valores: { ...BASE, rec_tipo: 'arrecadacao', rec_fatura_simples: 'Venc 10/10/2025 - R$ 150,00', rec_ref: 'Mercado', rec_outras: 'Pago na lotérica' } },
  { valores: { ...BASE, rec_tipo: 'toi', rec_ant: '920777' } },
  { valores: { ...BASE, rec_tipo: 'negativa', rec_fatura_simples: 'Venc 10/10/2025 - R$ 150,00' } },
  { valores: { ...BASE, rec_tipo: 'cobranca' } },
  { valores: { ...BASE, rec_tipo: 'obra', rec_motivo_obra: 'Discordância com critérios técnicos', rec_num_nota: '920002', rec_ref: 'Escola' } },
  { valores: { ...BASE, rec_tipo: 'entrega', rec_fatura_simples: 'Venc 10/10/2025 - R$ 150,00' } },
  { valores: { ...BASE, rec_tipo: 'outros' } },
];

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): Maria Souza\nDescrição da Reclamação: Cobrança acima do normal\nInforme se a parte interna já foi verificada: Não\nApontamento de problema no medidor: Display apagado\nInforme as análises realizadas: Histórico de consumo\nValor e vencimento da Fatura: vencimento 01/10/2025 R$ 150,00; vencimento 10/11/2025 R$ 89,90\nLeitura apresentada pelo cliente: 15420 | Data da coleta da Leitura: 01/11/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: 920012\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): Maria Souza\nDescrição da Reclamação: Cobrança acima do normal\nInforme se a parte interna já foi verificada: Não\nApontamento de problema no medidor: Display apagado\nInforme as análises realizadas: Histórico de consumo\nValor e vencimento da Fatura: vencimento 01/10/2025 R$ 150,00; vencimento 10/11/2025 R$ 89,90\nLeitura apresentada pelo cliente: 15420 | Data da coleta da Leitura: 01/11/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: 920012\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): Maria Souza\nDescrição da Reclamação: Cobrança acima do normal\nInforme se a parte interna já foi verificada: Sim\nApontamento de problema no medidor: Nenhum\nInforme as análises realizadas: Consumo\nValor e vencimento da Fatura: vencimento 05/09/2025 R$ 80,10\nLeitura apresentada pelo cliente: Sem leitura | Data da coleta da Leitura: n/a\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação (e-mail, SMS ou carta): carta\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): Maria Souza\nDescrição da Reclamação: Cobrança acima do normal\nInforme se a parte interna já foi verificada: Sim\nApontamento de problema no medidor: Nenhum\nInforme as análises realizadas: Consumo\nValor e vencimento da Fatura: vencimento 05/09/2025 R$ 80,10\nLeitura apresentada pelo cliente: Sem leitura | Data da coleta da Leitura: n/a\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação (e-mail, SMS ou carta): carta\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: presencial\nMotivo da Reclamação: Cobrança acima do normal\nProtocolo do Atendimento (*apenas reclamação de teleatendimento/presencial): P-1\nLoja de Atendimento Reclamada (*apenas quando reclamação de atendimento presencial): Loja Centro\nData: 03/11/2025\nHorário: 14:30\nNome do Funcionário Reclamado: Ana\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: presencial\nMotivo da Reclamação: Cobrança acima do normal\nProtocolo do Atendimento (*apenas reclamação de teleatendimento/presencial): P-1\nLoja de Atendimento Reclamada (*apenas quando reclamação de atendimento presencial): Loja Centro\nData: 03/11/2025\nHorário: 14:30\nNome do Funcionário Reclamado: Ana\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: teleatendimento\nMotivo da Reclamação: Cobrança acima do normal\nProtocolo do Atendimento (*apenas reclamação de teleatendimento/presencial): P-2\nData: 03/11/2025\nHorário: 9h\nNome do Funcionário Reclamado: Não soube informar\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: teleatendimento\nMotivo da Reclamação: Cobrança acima do normal\nProtocolo do Atendimento (*apenas reclamação de teleatendimento/presencial): P-2\nData: 03/11/2025\nHorário: 9h\nNome do Funcionário Reclamado: Não soube informar\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: campo\nMotivo da Reclamação: Cobrança acima do normal\nEquipe Reclamada (*apenas quando reclamação do serviço de campo - placa do veículo): Placa ABC-1234\nNº da Nota de Serviço que foi Executada (*apenas quando reclamação do serviço de campo): 920099\nData: 03/11/2025\nHorário: 10:00\nNome do Funcionário Reclamado: João\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nCanal do Atendimento Reclamado: campo\nMotivo da Reclamação: Cobrança acima do normal\nEquipe Reclamada (*apenas quando reclamação do serviço de campo - placa do veículo): Placa ABC-1234\nNº da Nota de Serviço que foi Executada (*apenas quando reclamação do serviço de campo): 920099\nData: 03/11/2025\nHorário: 10:00\nNome do Funcionário Reclamado: João\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nNúmero da nota de serviço em atraso: 920001\nPontos de referência: Igreja\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação (e-mail, SMS ou carta): SMS\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nNúmero da nota de serviço em atraso: 920001\nPontos de referência: Igreja\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação (e-mail, SMS ou carta): SMS\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Solicitante (informar caso seja procurador): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nCliente informa que hoje reside no endereço: Rua A, 10\nConta contrato atual do solicitante: 7000000001\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Solicitante (informar caso seja procurador): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nCliente informa que hoje reside no endereço: Rua A, 10\nConta contrato atual do solicitante: 7000000001\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura(s): (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nPonto de Referência: Mercado\nE-mail: m@e.com\nTelefone: (71) 99350-1519\nOutras informações: Pago na lotérica\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura(s): (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nPonto de Referência: Mercado\nE-mail: m@e.com\nTelefone: (71) 99350-1519\nOutras informações: Pago na lotérica\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Solicitante (informar caso seja procurador): Maria Souza\nTelefones: (71) 99350-1519 | E-mail para contato: m@e.com\nMotivo da reclamação: Cobrança acima do normal\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: 920777\nPrazo para análise até 15 (quinze) dias corridos, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Solicitante (informar caso seja procurador): Maria Souza\nTelefones: (71) 99350-1519 | E-mail para contato: m@e.com\nMotivo da reclamação: Cobrança acima do normal\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: 920777\nPrazo para análise até 15 (quinze) dias corridos, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura: (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura: (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Solicitante (informar caso seja procurador): Maria Souza\nTelefones e e-mail para contato: (71) 99350-1519 - m@e.com\nMotivo da reclamação: Cobrança acima do normal\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Solicitante (informar caso seja procurador): Maria Souza\nTelefones e e-mail para contato: (71) 99350-1519 - m@e.com\nMotivo da reclamação: Cobrança acima do normal\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Discordância com critérios técnicos\nNúmero da nota de serviço: 920002\nPontos de referência: Escola\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Discordância com critérios técnicos\nNúmero da nota de serviço: 920002\nPontos de referência: Escola\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura: (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nFatura: (vencimento e valor): Venc 10/10/2025 - R$ 150,00\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Nome e sobrenome do cliente (titular ou terceiros): Maria Souza\nMotivo da Reclamação: Cobrança acima do normal\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nModalidade de comunicação (e-mail, SMS ou carta): e-mail\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nPrazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
];

async function gerar(page, c) {
  await page.evaluate(
    ({ valores, faturas }) => {
      window.trocarAba('sf-reclamacoes', document.querySelector(`#service_nav .sub-btn[data-click*="'sf-reclamacoes'"]`));
      window.limparForm('sf-reclamacoes');
      // selects primeiro (mostram os campos), depois os textos
      const ordem = Object.entries(valores).sort(
        ([a], [b]) => (document.getElementById(b).tagName === 'SELECT') - (document.getElementById(a).tagName === 'SELECT'),
      );
      for (const [id, v] of ordem) {
        const el = document.getElementById(id);
        el.value = v;
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const caixa = document.getElementById('container_faturas_rec');
      (faturas || []).forEach(([venc, valor], i) => {
        if (i > 0) caixa.parentElement.querySelector('.btn-add').click();
        const linha = caixa.querySelectorAll('.fatura-row')[i];
        linha.querySelector('input').value = venc;
        linha.querySelectorAll('input')[1].value = valor;
      });
    },
    { valores: c.valores, faturas: c.faturas },
  );
  await page.locator('#sf-reclamacoes > .actions .btn:not(.btn-clear):not(.btn-edit)').first().click();
}

for (const [i, c] of CASOS.entries()) {
  test(`equivalência reclamação ${c.valores.rec_tipo} #${i}`, async ({ page }) => {
    await gerar(page, c);
    const r = { nota: await page.locator('#out-nota').inputValue(), agenda: await page.locator('#out-agenda').inputValue() };
    expect(r).toEqual(ESPERADO[i]);
    await fecharTextoGerado(page);
  });
}

test('lote 11: datas e vencimentos inválidos são barrados', async ({ page }) => {
  const c = CASOS[0];
  for (const [mudar, faturas, msg] of [
    [{ rec_dt_leit: '31/02/2025' }, c.faturas, 'A data do campo "Data da coleta da Leitura:" não é uma data real. Verifique o dia e o mês.'],
    [{ rec_dt_leit: '10/10/2099' }, c.faturas, 'A data do campo "Data da coleta da Leitura:" não pode ser uma data futura.'],
    [{}, [['31/02/2025', '1,00']], 'O vencimento da fatura deve ser uma data real, no formato dd/mm/aaaa.'],
  ]) {
    await gerar(page, { valores: { ...c.valores, ...mudar }, faturas });
    await expect(page.locator('#toastAviso')).toContainText(msg);
  }
});
