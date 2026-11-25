import { abrirServico, expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 1): textos gravados com o código ANTIGO, antes da migração.
// Depois de migrar para modelos, estes textos têm que sair idênticos, caractere por caractere.
const CASOS = [
  {
    sf: 'sf-reloc-rede',
    valores: {
      ro_solic: 'Maria Teste',
      ro_prx: 'Próximo ao mercado',
      ro_tel: '71993501519',
      ro_email: 'maria@email.com',
      ro_docs: 'Escritura pública',
    },
    nota: 'Solicitante Maria Teste PRX Próximo ao mercado Tel (71) 99350-1519 e-mail maria@email.com. Cliente Orientado quanto aos possíveis custos DOCs anexado: Escritura pública',
    agenda:
      'Solicitante Maria Teste PRX Próximo ao mercado Tel (71) 99350-1519 e-mail maria@email.com. Cliente Orientado quanto aos possíveis custos DOCs anexado: Escritura pública',
  },
  {
    sf: 'sf-med-roub',
    valores: {
      mr_solic: 'Maria Teste',
      mr_prx: 'Rua B',
      mr_tel: '7133334444 / 71993501519',
      mr_email: 'Não informado',
      mr_num: '12345678',
      mr_bo: '00123/2026',
    },
    nota: 'Solicitante Maria Teste PRX Rua B Tel (71) 3333-4444 / (71) 99350-1519 e-mail Não informado Nº Medidor Roubado 12345678 Nº do BO: 00123/2026',
    agenda: 'Solicitante Maria Teste PRX Rua B Tel (71) 3333-4444 / (71) 99350-1519 e-mail Não informado Nº Medidor Roubado 12345678 Nº do BO: 00123/2026',
  },
  {
    sf: 'sf-selagem',
    valores: {
      sel_solic: 'João Teste',
      sel_prx: 'Casa azul',
      sel_tel: '71993501519',
      sel_email: 'joao@email.com',
    },
    nota: 'Solicitante João Teste PRX Casa azul Tel (71) 99350-1519 e-mail joao@email.com',
    agenda: 'Solicitante João Teste PRX Casa azul Tel (71) 99350-1519 e-mail joao@email.com',
  },
  {
    sf: 'sf-ramal',
    valores: {
      sram_solic: 'Ana Teste',
      sram_prx: 'Esquina',
      sram_tel: '71993501519',
      sram_email: 'Não informado',
      sram_motivo: 'Cabo partido',
    },
    nota: 'Solicitante Ana Teste PRX Esquina Tel (71) 99350-1519 e-mail Não informado Motivo da solicitação: Cabo partido',
    agenda: 'Solicitante Ana Teste PRX Esquina Tel (71) 99350-1519 e-mail Não informado Motivo da solicitação: Cabo partido',
  },
  {
    sf: 'sf-isencao-icms',
    valores: {
      icms_ie: '20.123.456-7',
      icms_ref: 'Fazenda Boa Vista',
      icms_tel: '71993501519',
      icms_solic: 'Pedro Teste',
    },
    nota: 'GENTILEZA CADASTRAR PRODUTOR RURAL \nNUMERO DA INSCRICAO ESTADUAL 20.123.456-7 \nREF Fazenda Boa Vista\nTEL (71) 99350-1519 \nSOLICITANTE Pedro Teste',
    agenda:
      'GENTILEZA CADASTRAR PRODUTOR RURAL \nNUMERO DA INSCRICAO ESTADUAL 20.123.456-7 \nREF Fazenda Boa Vista\nTEL (71) 99350-1519 \nSOLICITANTE Pedro Teste',
  },
  {
    sf: 'sf-data-boa',
    valores: {
      db_dia: '10',
    },
    nota: 'CLIENTE SOLICITA DATA BOA PARA O DIA 10',
    agenda: 'CLIENTE SOLICITA DATA BOA PARA O DIA 10',
  },
  {
    sf: 'sf-deb-auto',
    valores: {
      da_titular: 'Maria Teste',
    },
    nota: 'DESCADASTRO DÉBITO AUTOMÁTICO A PEDIDO DO TITULAR SR \nMaria Teste',
    agenda: 'DESCADASTRO DÉBITO AUTOMÁTICO A PEDIDO DO TITULAR SR \nMaria Teste',
  },
  {
    sf: 'sf-canc-parc',
    valores: {
      cparc_plano: '12345',
      cparc_motivo: 'ao não pagamento do sinal.',
    },
    nota: 'Plano de parcelamento 12345 cancelado devido ao não pagamento do sinal.',
    agenda: 'Plano de parcelamento 12345 cancelado devido ao não pagamento do sinal.',
  },
  {
    sf: 'sf-insp',
    valores: {
      insp_solic: 'Maria Teste',
      insp_prx: 'Portaria',
      insp_tel: '71993501519',
      insp_email: 'maria@email.com',
      insp_carga: '10kw',
      insp_pg: '',
      insp_emp: 'Cond. Sol',
      insp_bloco: '',
      insp_muc: '920000001',
    },
    nota: 'Solicitante Maria Teste PRX Portaria Tel (71) 99350-1519 e-mail maria@email.com Carga 10kw Empreendimento: Cond. Sol referente a MUC 920000001',
    agenda: 'Solicitante Maria Teste PRX Portaria Tel (71) 99350-1519 e-mail maria@email.com Carga 10kw Empreendimento: Cond. Sol referente a MUC 920000001',
  },
  {
    sf: 'sf-insp',
    valores: {
      insp_solic: 'Maria Teste',
      insp_prx: 'Portaria',
      insp_tel: '71993501519',
      insp_email: 'maria@email.com',
      insp_carga: '10kw',
      insp_pg: 'PG123',
      insp_emp: 'Cond. Sol',
      insp_bloco: 'Bloco A',
      insp_muc: '920000001',
    },
    nota: 'Solicitante Maria Teste PRX Portaria Tel (71) 99350-1519 e-mail maria@email.com Carga 10kw PG PG123 Empreendimento: Cond. Sol Bloco/Torre: Bloco A (quando houver) referente a MUC 920000001',
    agenda:
      'Solicitante Maria Teste PRX Portaria Tel (71) 99350-1519 e-mail maria@email.com Carga 10kw PG PG123 Empreendimento: Cond. Sol Bloco/Torre: Bloco A (quando houver) referente a MUC 920000001',
  },
];

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.sf} #${i}`, async ({ page }) => {
    await abrirServico(page, c.sf);
    await page.evaluate((sf) => window.limparForm(sf), c.sf);
    for (const [id, v] of Object.entries(c.valores)) await page.fill(`#${id}`, v);
    await page.locator(`#${c.sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
    await expect(page.locator('#out-nota')).toHaveValue(c.nota);
    await expect(page.locator('#out-agenda')).toHaveValue(c.agenda);
    await fecharTextoGerado(page);
  });
}
