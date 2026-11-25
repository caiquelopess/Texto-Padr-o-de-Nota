import { abrirServico, expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 3, serviços com datas): textos gravados com o código ANTIGO.
// Inclui datas digitadas sem zero (1/2/2027), que o sistema corrige para dd/mm/aaaa.
// Os valores entram direto no campo (sem a máscara de digitação), igual nos dois lados.
const CASOS = [
  {
    sf: 'sf-lp',
    valores: {
      lp_solic: 'Maria',
      lp_prx: 'Praça',
      lp_tel: '71993501519',
      lp_email: 'm@e.com',
      lp_carga: '10kw',
      lp_pg: 'PG1',
      lp_dt_lig: '1/2/2027',
      lp_dt_deslig: '15/02/2027',
    },
    nota: 'Solicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Carga 10kw PG PG1 Ligar dia 01/02/2027 e desligar dia 15/02/2027',
    agenda: 'Solicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Carga 10kw PG PG1 Ligar dia 01/02/2027 e desligar dia 15/02/2027',
  },
  {
    sf: 'sf-tele-gravacao',
    valores: {
      tg_solic: 'Maria',
      tg_tel: '71993501519',
      tg_ref: 'Mercado',
      tg_email: 'm@e.com',
      tg_motivo: 'Gravação',
      tg_data: '5/11/2026',
      tg_proto: '123456',
    },
    nota: 'Solicitante Maria Tel (71) 99350-1519 Refr: Mercado\nE-mail: m@e.com\nMotivo: Gravação\nData da ligação 05/11/2026\nProtocolo: 123456\nPrazo de atendimento: 5 dias (úteis).',
    agenda:
      'Solicitante Maria Tel (71) 99350-1519 Refr: Mercado\nE-mail: m@e.com\nMotivo: Gravação\nData da ligação 05/11/2026\nProtocolo: 123456\nPrazo de atendimento: 5 dias (úteis).',
  },
  {
    sf: 'sf-bloq-cobranca',
    valores: {
      bloq_tipo: 'pagamento',
      bloq_ref: '10/2026',
      bloq_dt_ini: '24/11/2026',
      bloq_dt_fim: '27/11/2026',
    },
    nota: 'Bloqueio fatura com ref 10/2026 de 3 dias uteis aguardando baixa no sistema de 24/11/2026 a 27/11/2026',
    agenda: 'Bloqueio fatura com ref 10/2026 de 3 dias uteis aguardando baixa no sistema de 24/11/2026 a 27/11/2026',
  },
  {
    sf: 'sf-bloq-cobranca',
    valores: {
      bloq_tipo: 'reclamacao',
      bloq_ref: '10/2026',
      bloq_rec: '300123 leitura',
      bloq_dt_ini: '1/12/2026',
      bloq_dt_fim: '15/12/2026',
    },
    nota: 'Bloqueio da fatura referencia: 10/2026 pelo prazo de 15 dias corridos, devido à reclamação 300123 leitura pendente no período de 01/12/2026 a 15/12/2026.',
    agenda:
      'Bloqueio da fatura referencia: 10/2026 pelo prazo de 15 dias corridos, devido à reclamação 300123 leitura pendente no período de 01/12/2026 a 15/12/2026.',
  },
  {
    sf: 'sf-ref-padrao',
    valores: {
      refp_opt: 'mudanca',
      refp_solic: 'Maria',
      refp_prx: 'Praça',
      refp_tel: '71993501519',
      refp_email: 'm@e.com',
    },
    nota: 'Solicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com\nMotivo da solicitação: MUDANÇA DE LOCAL DO MEDIDOR.',
    agenda: 'Solicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com\nMotivo da solicitação: MUDANÇA DE LOCAL DO MEDIDOR.',
  },
  {
    sf: 'sf-ref-padrao',
    valores: {
      refp_opt: 'desliga_religa',
      refp_solic: 'Maria',
      refp_prx: 'Praça',
      refp_tel: '71993501519',
      refp_email: 'm@e.com',
      refp_motivo: 'Reforma',
      refp_dt_deslig: '2/1/2027',
      refp_dt_relig: '03/01/2027',
    },
    nota: 'NOTA DE DESLIGA:\nSolicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Motivo da solicitação: Reforma | DESLIGAR DIA 02/01/2027\n\nNOTA DE RELIGA:\nSolicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Motivo da solicitação: Reforma | RELIGAR DIA 03/01/2027',
    agenda:
      'NOTA DE DESLIGA:\nSolicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Motivo da solicitação: Reforma | DESLIGAR DIA 02/01/2027\n\nNOTA DE RELIGA:\nSolicitante Maria PRX Praça Tel (71) 99350-1519 e-mail m@e.com Motivo da solicitação: Reforma | RELIGAR DIA 03/01/2027',
  },
  {
    sf: 'sf-defesa-adm',
    valores: {
      def_dt_ent: '20/11/2026',
      def_dt_env: '21/11/2026',
      def_cc: '7000000001',
      def_toi: 'TOI-9',
      def_solic: 'Maria',
      def_tel: '71993501519',
      def_motivo: 'Cobrança indevida',
      def_fat_venc: '5/1/2027',
      def_fat_val: '150,00',
      def_px: 'Mercado',
      def_email: 'm@e.com',
    },
    nota: 'P-RECURSO ADMINISTRATIVO ENTREGUE DIA 20/11/2026 E ENVIADO DIA 21/11/2026 POR EMAIL E POSTERIORMENTE MALOTE CONTA CONTRATO: 7000000001 TOI TOI-9',
    agenda:
      'SOLICITANTE: Maria\nCONTA CONTRATO: 7000000001 | TOI: TOI-9\nENTREGA P-RECURSO: 20/11/2026 | ENVIO: 21/11/2026\nMOTIVO DA RECLAMAÇÃO : Cobrança indevida\nFATURA VENCIMENTO: 05/01/2027  VALOR: 150,00\nTEL: (71) 99350-1519\nPX : Mercado\nEMAIL: m@e.com\nCliente ciente do envio da resposta por carta ou mail ou SMS\nCliente ciente do prazo do tratamento da reclamação de 05 dias UTEIS ou 15 dias corridos se for a campo',
  },
];

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.sf} #${i}`, async ({ page }) => {
    await abrirServico(page, c.sf);
    await page.evaluate(
      ({ sf, valores }) => {
        window.limparForm(sf);
        for (const [id, v] of Object.entries(valores)) {
          const el = document.getElementById(id);
          el.value = v;
          if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      { sf: c.sf, valores: c.valores },
    );
    await page.locator(`#${c.sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
    await expect(page.locator('#out-nota')).toHaveValue(c.nota);
    await expect(page.locator('#out-agenda')).toHaveValue(c.agenda);
    await fecharTextoGerado(page);
  });
}
