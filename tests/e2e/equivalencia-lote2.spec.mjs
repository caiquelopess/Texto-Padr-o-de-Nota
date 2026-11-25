import { abrirServico, expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 2): textos gravados com o código ANTIGO, antes da migração.
// Cobre os ramos de cada serviço (PF/PJ, com/sem comprovante, titular ou não, etc.).
const CASOS = [
  {
    sf: 'sf-mc',
    valores: {
      mc_solic: 'Maria Teste',
      mc_motivo: 'Troca de classe',
      mc_tel: '71993501519',
      mc_ref: 'Mercado',
      mc_proc: 'Maria',
      mc_email: 'Não',
    },
    nota: 'Solicitante: Maria Teste\nMotivo: Troca de classe\nTelefone: (71) 99350-1519\nPonto de Referência: Mercado\nQuem procurar: Maria\nPossui e-mail: Não',
    agenda:
      'Solicitante: Maria Teste\nMotivo: Troca de classe\nTelefone: (71) 99350-1519\nPonto de Referência: Mercado\nQuem procurar: Maria\nPossui e-mail: Não',
  },
  {
    sf: 'sf-bpc',
    valores: {
      bpc_titular: 'mesmo',
      bpc_cc: '7000000001',
      bpc_benef: '123456',
      bpc_tel: '71993501519',
      bpc_email: 'maria@email.com',
    },
    nota: 'Numero da conta contrato: 7000000001\nNumero do Beneficio de Prestação Continuada BPC: 123456\nTelefone: (71) 99350-1519\nE mail: maria@email.com',
    agenda: 'Numero da conta contrato: 7000000001\nNumero do Beneficio de Prestação Continuada BPC: 123456\nTelefone: (71) 99350-1519\nE mail: maria@email.com',
  },
  {
    sf: 'sf-bpc',
    valores: {
      bpc_titular: 'diferente',
      bpc_cc: '7000000001',
      bpc_benef: '123456',
      bpc_pn: '1010000001',
      bpc_tel: '71993501519',
      bpc_email: 'Não informado',
    },
    nota: 'Numero da conta contrato: 7000000001\nNumero do Beneficio de Prestação Continuada BPC: 123456\nNumero do Parceiro de Negócios PN beneficiário: 1010000001\nTelefone: (71) 99350-1519\nE mail: Não informado',
    agenda:
      'Numero da conta contrato: 7000000001\nNumero do Beneficio de Prestação Continuada BPC: 123456\nNumero do Parceiro de Negócios PN beneficiário: 1010000001\nTelefone: (71) 99350-1519\nE mail: Não informado',
  },
  {
    sf: 'sf-aparelhagem',
    valores: {
      ap_sit: 'normal',
      ap_tel: '71993501519',
      ap_email: 'a@b.com',
    },
    nota: 'Favor cadastrar internação domiciliar, documentação inserida no KM. Tel (71) 99350-1519 e-mail a@b.com',
    agenda: 'Favor cadastrar internação domiciliar, documentação inserida no KM. Tel (71) 99350-1519 e-mail a@b.com',
  },
  {
    sf: 'sf-aparelhagem',
    valores: {
      ap_sit: 'osb',
      ap_tel: '71993501519',
      ap_email: 'Não informado',
    },
    nota: 'FATURA EM OSB (PERÍODO DE FATURAMENTO), FATURA EM OSB para que o setor possa incluir o bloqueio. Tel (71) 99350-1519 e-mail Não informado',
    agenda: 'FATURA EM OSB (PERÍODO DE FATURAMENTO), FATURA EM OSB para que o setor possa incluir o bloqueio. Tel (71) 99350-1519 e-mail Não informado',
  },
  {
    sf: 'sf-tarefa-neo',
    valores: {
      tneo_titulo: 'Transferência',
      tneo_nome: 'Maria',
      tneo_ccn: '7000000002',
      tneo_cca: '7000000001',
      tneo_tel: '71993501519',
      tneo_email: 'm@e.com',
      tneo_desc: 'Transferir créditos',
    },
    nota: 'Título: Transferência\nNome: Maria\nConta contrato nova: 7000000002\nConta contrato antiga: 7000000001\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nDescrição da solicitação: Transferir créditos',
    agenda:
      'Título: Transferência\nNome: Maria\nConta contrato nova: 7000000002\nConta contrato antiga: 7000000001\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nDescrição da solicitação: Transferir créditos',
  },
  {
    sf: 'sf-movein-moveout',
    valores: {
      mm_contrato: '123',
      mm_inst: '456',
      mm_cca: '7000000001',
      mm_ccn: '7000000002',
      mm_motivo: 'TROCA DE TITULARIDADE',
    },
    nota: 'Contrato: 123\nInstalação: 456\nConta contrato antiga: 7000000001\nConta contrato nova : 7000000002\nSolicito o estorno de move in e move out e instalação Pelo motivo de: TROCA DE TITULARIDADE',
    agenda:
      'Contrato: 123\nInstalação: 456\nConta contrato antiga: 7000000001\nConta contrato nova : 7000000002\nSolicito o estorno de move in e move out e instalação Pelo motivo de: TROCA DE TITULARIDADE',
  },
  {
    sf: 'sf-verif-equip',
    valores: {
      ve_solic: 'Maria',
      ve_motivo: 'Medidor parado',
      ve_tel: '71993501519',
      ve_proc: 'Maria',
      ve_ref: 'Mercado',
      ve_equip: 'Externo',
      ve_email: 'Sim',
    },
    nota: '',
    agenda:
      'Solicitante: Maria\nMotivo: Medidor parado\nTelefone: (71) 99350-1519\nQuem procurar: Maria\nPonto de Referência: Mercado\nEquipamento interno ou externo: Externo\nPossui e-mail: Sim',
  },
  {
    sf: 'sf-afericao',
    valores: {
      af_solic: 'Maria',
      af_motivo: 'Consumo alto',
      af_tel: '71993501519',
      af_horario: '8h às 12h',
      af_proc: 'Maria',
      af_ref: 'Mercado',
      af_equip: 'Interno',
      af_email: 'Não',
    },
    nota: '',
    agenda:
      'Solicitante: Maria\nMotivo: Consumo alto\nTelefone: (71) 99350-1519\nHorário para contato: 8h às 12h\nQuem procurar: Maria\nPonto de Referência: Mercado\nEquipamento interno ou externo: Interno\nPossui e-mail: Não\nCliente ciente da possível cobrança de taxa',
  },
  {
    sf: 'sf-relig',
    valores: {
      relig_opcao: 'com_comprovante',
      relig_solic: 'Maria',
      relig_tel: '71993501519',
      relig_ref: 'Mercado',
      relig_proc: 'Maria',
    },
    nota: 'Cliente em loja, comprovantes apresentados, não cobrar em campo.\nSolicitante: Maria\nTelefone: (71) 99350-1519\nPonto de referencia: Mercado\nProcurar por: Maria\nCiente de taxa.',
    agenda:
      'Cliente em loja, comprovantes apresentados, não cobrar em campo.\nSolicitante: Maria\nTelefone: (71) 99350-1519\nPonto de referencia: Mercado\nProcurar por: Maria\nCiente de taxa.',
  },
  {
    sf: 'sf-relig',
    valores: {
      relig_opcao: 'sem_comprovante',
      relig_solic: 'Maria',
      relig_tel: '71993501519',
      relig_ref: 'Mercado',
      relig_proc: 'Maria',
    },
    nota: 'Cliente não apresentou comprovantes.\nSolicitante: Maria\nTelefone: (71) 99350-1519\nPonto de referencia: Mercado\nProcurar por: Maria\nCiente de taxa.',
    agenda:
      'Cliente não apresentou comprovantes.\nSolicitante: Maria\nTelefone: (71) 99350-1519\nPonto de referencia: Mercado\nProcurar por: Maria\nCiente de taxa.',
  },
  {
    sf: 'sf-parcelamento',
    valores: {
      parc_tipo: 'pf',
      parc_solic: 'Maria',
      parc_rec: 'regular',
      parc_tel: '71993501519',
      parc_email: 'm@e.com',
      parc_divida: '1.000,00',
      parc_plano: '999',
      parc_sinal: '100,00',
      parc_qtd_parc: '9',
      parc_val_parc: '100,00',
    },
    nota: 'Solicitante Maria, dados da Receita Federal regular (Inserir cópia do cpf receita federal no SAP KM), telefone (71) 99350-1519, E-mail m@e.com, esteve na loja para negociar a dívida no valor R$1.000,00, plano numero 999 com sinal R$100,00 e o restante do valor divido em 9 parcelas de R$100,00. Cliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
    agenda:
      'Solicitante Maria, dados da Receita Federal regular (Inserir cópia do cpf receita federal no SAP KM), telefone (71) 99350-1519, E-mail m@e.com, esteve na loja para negociar a dívida no valor R$1.000,00, plano numero 999 com sinal R$100,00 e o restante do valor divido em 9 parcelas de R$100,00. Cliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
  },
  {
    sf: 'sf-parcelamento',
    valores: {
      parc_tipo: 'pj',
      parc_solic: 'Maria',
      parc_empresa: 'Empresa X',
      parc_rec: 'pendente regularizacao',
      parc_tel: '71993501519',
      parc_email: 'm@e.com',
      parc_divida: '1.000,00',
      parc_plano: '999',
      parc_sinal: '100,00',
      parc_qtd_parc: '9',
      parc_val_parc: '100,00',
    },
    nota: 'Solicitante Maria, dados da Receita Federal pendente regularizacao (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com representante da Empresa Empresa X esteve na loja de atendimento para negociar a divida no valor R$1.000,00, plano numero 999 com sinal R$100,00 e o restante do valor divido em 9 parcelas de R$100,00.\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
    agenda:
      'Solicitante Maria, dados da Receita Federal pendente regularizacao (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com representante da Empresa Empresa X esteve na loja de atendimento para negociar a divida no valor R$1.000,00, plano numero 999 com sinal R$100,00 e o restante do valor divido em 9 parcelas de R$100,00.\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
  },
  {
    sf: 'sf-parc-tt',
    valores: {
      ptt_tipo: 'pf',
      ptt_solic: 'Maria',
      ptt_rec: 'regular',
      ptt_tel: '71993501519',
      ptt_email: 'm@e.com',
      ptt_divida: '500,00',
      ptt_plano: '77',
      ptt_sinal: '50,00',
      ptt_qtd_parc: '5',
      ptt_val_parc: '90,00',
      ptt_origem_tt: 'Ref 123',
    },
    nota: 'Solicitante Maria, dados da Receita Federal regular (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com, esteve na loja para negociar a dívida no valor R$500,00, plano numero 77 com sinal R$50,00 e o restante do valor divido em 5 parcelas de R$90,00.\nOs débitos são oriundos da troca de titularidade Ref 123 e foram reconhecidas através do termo de assunção assinado (Inserir cópia no SAP KM).\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
    agenda:
      'Solicitante Maria, dados da Receita Federal regular (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com, esteve na loja para negociar a dívida no valor R$500,00, plano numero 77 com sinal R$50,00 e o restante do valor divido em 5 parcelas de R$90,00.\nOs débitos são oriundos da troca de titularidade Ref 123 e foram reconhecidas através do termo de assunção assinado (Inserir cópia no SAP KM).\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado.',
  },
  {
    sf: 'sf-parc-tt',
    valores: {
      ptt_tipo: 'pj',
      ptt_solic: 'Maria',
      ptt_empresa: 'Empresa Y',
      ptt_rec: 'regular',
      ptt_tel: '71993501519',
      ptt_email: 'm@e.com',
      ptt_divida: '500,00',
      ptt_plano: '77',
      ptt_sinal: '50,00',
      ptt_qtd_parc: '5',
      ptt_val_parc: '90,00',
      ptt_origem_tt: 'Ref 123',
    },
    nota: 'Solicitante Maria, dados da Receita Federal regular (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com representante da Empresa Empresa Y esteve na loja de atendimento para negociar a divida no valor R$500,00, plano numero 77 com sinal R$50,00 e o restante do valor divido em 5 parcelas de R$90,00.\nOs débitos são oriundos da troca de titularidade Ref 123 e foram reconhecidas através do termo de assunção assinado (Inserir cópia no SAP KM).\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado',
    agenda:
      'Solicitante Maria, dados da Receita Federal regular (Inserir cópia no SAP KM), telefone (71) 99350-1519, E-mail m@e.com representante da Empresa Empresa Y esteve na loja de atendimento para negociar a divida no valor R$500,00, plano numero 77 com sinal R$50,00 e o restante do valor divido em 5 parcelas de R$90,00.\nOs débitos são oriundos da troca de titularidade Ref 123 e foram reconhecidas através do termo de assunção assinado (Inserir cópia no SAP KM).\nCliente ciente que caso o sinal não seja pago na data de hoje, o plano de parcelamento será cancelado',
  },
  {
    sf: 'sf-cpnb',
    valores: {
      cpnb_solic: 'Maria',
      cpnb_motivo: 'Paga e não baixada',
      cpnb_fatura: '10/10/2026 R$ 100',
      cpnb_ref: 'Mercado',
      cpnb_tel: '71993501519',
      cpnb_email: 'm@e.com',
      cpnb_neg: 'Não',
      cpnb_ant: '',
      cpnb_resp: 'SMS',
    },
    nota: 'Solicitante: Maria\nMotivo : Paga e não baixada\nFatura (vencimento e valor) : 10/10/2026 R$ 100\nPontos de Referência : Mercado\nTelefone : (71) 99350-1519\nE-mail: : m@e.com\nInforme se o cliente está negativado: Não\nSe houver reclamação anterior, informe o n° da reclamação anterior : N/A\nModalidade de resposta: SMS\nPrazo que deverá informado e verbalizado ao cliente é de 5 dias úteis para uma primeira análise.',
    agenda:
      'Solicitante: Maria\nMotivo : Paga e não baixada\nFatura (vencimento e valor) : 10/10/2026 R$ 100\nPontos de Referência : Mercado\nTelefone : (71) 99350-1519\nE-mail: : m@e.com\nInforme se o cliente está negativado: Não\nSe houver reclamação anterior, informe o n° da reclamação anterior : N/A\nModalidade de resposta: SMS\nPrazo que deverá informado e verbalizado ao cliente é de 5 dias úteis para uma primeira análise.',
  },
  {
    sf: 'sf-cpnb',
    valores: {
      cpnb_solic: 'Maria',
      cpnb_motivo: 'Paga e não baixada',
      cpnb_fatura: '10/10/2026 R$ 100',
      cpnb_ref: 'Mercado',
      cpnb_tel: '71993501519',
      cpnb_email: 'm@e.com',
      cpnb_neg: 'Sim',
      cpnb_ant: '300123',
      cpnb_resp: 'carta',
    },
    nota: 'Solicitante: Maria\nMotivo : Paga e não baixada\nFatura (vencimento e valor) : 10/10/2026 R$ 100\nPontos de Referência : Mercado\nTelefone : (71) 99350-1519\nE-mail: : m@e.com\nInforme se o cliente está negativado: Sim\nSe houver reclamação anterior, informe o n° da reclamação anterior : 300123\nModalidade de resposta: carta\nPrazo que deverá informado e verbalizado ao cliente é de 5 dias úteis para uma primeira análise.',
    agenda:
      'Solicitante: Maria\nMotivo : Paga e não baixada\nFatura (vencimento e valor) : 10/10/2026 R$ 100\nPontos de Referência : Mercado\nTelefone : (71) 99350-1519\nE-mail: : m@e.com\nInforme se o cliente está negativado: Sim\nSe houver reclamação anterior, informe o n° da reclamação anterior : 300123\nModalidade de resposta: carta\nPrazo que deverá informado e verbalizado ao cliente é de 5 dias úteis para uma primeira análise.',
  },
];

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.sf} #${i}`, async ({ page }) => {
    await abrirServico(page, c.sf);
    await page.evaluate((sf) => window.limparForm(sf), c.sf);
    for (const [id, v] of Object.entries(c.valores)) {
      if ((await page.locator(`#${id}`).evaluate((e) => e.tagName)) === 'SELECT')
        await page.evaluate(
          ([i2, v2]) => {
            const s = document.getElementById(i2);
            s.value = v2;
            s.dispatchEvent(new Event('change', { bubbles: true }));
          },
          [id, v],
        );
      else await page.fill(`#${id}`, v);
    }
    await page.locator(`#${c.sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
    await expect(page.locator('#out-nota')).toHaveValue(c.nota);
    await expect(page.locator('#out-agenda')).toHaveValue(c.agenda);
    await fecharTextoGerado(page);
  });
}
