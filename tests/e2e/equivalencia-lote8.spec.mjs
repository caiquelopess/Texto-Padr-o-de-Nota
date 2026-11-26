import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 8, Reclamação GD e Restituição de valores): textos gravados com o código ANTIGO.
const GD = { gd_nome: 'Maria', gd_motivo: 'Sem compensação', gd_ref: 'Praça', gd_email: 'm@e.com', gd_tel: '71993501519' };
const RES = {
  res_solic: 'João',
  res_tel: '7133334444',
  res_email1: 'j@e.com',
  res_email2: 'j@e.com',
  res_dados_banc: 'Conta do titular',
  res_banco: 'Banco X',
  res_ag: '0035',
};
const CASOS = [
  { sf: 'sf-reclamacao-gd', valores: { ...GD, gd_tipo: 'ausencia_fat', gd_dt_ultima_fat: '1/2/2025', gd_periodo_sem_fat: '2 meses' } },
  {
    sf: 'sf-reclamacao-gd',
    valores: {
      ...GD,
      gd_tipo: 'credito_gmm',
      gd_dt_ult_sem_cred: '05/03/2025',
      gd_dt_gmm: '1/1/2025',
      gd_outras: 'Cliente GD',
      gd_ant: '920012',
      gd_modalidade: 'SMS',
    },
  },
  {
    sf: 'sf-reclamacao-gd',
    valores: { ...GD, gd_tipo: 'geradora_benef', gd_ger_benef: 'Beneficiária', gd_periodo_sem_comp: 'Ciclo atual', gd_modalidade: 'carta' },
  },
  { sf: 'sf-reclamacao-gd', valores: { ...GD, gd_tipo: 'art_323', gd_art323_simnao: 'Sim', gd_periodo_fat: '01/2025 a 03/2025' } },
  { sf: 'sf-reclamacao-gd', valores: { ...GD, gd_tipo: 'art_323', gd_art323_simnao: 'Não', gd_periodo_fat: '01/2025' } },
  { sf: 'sf-res', valores: { ...RES, res_conta: '12345-6', res_tipo_conta: 'Poupança' } },
  { sf: 'sf-res', valores: { ...RES, res_forma_pag: 'ordem' } },
];

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'Ausência de Faturamento\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nData da última fatura: 01/02/2025\nPeríodo sem receber a fatura: 2 meses\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Ausência de Faturamento\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nData da última fatura: 01/02/2025\nPeríodo sem receber a fatura: 2 meses\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Crédito não migrado do GMM para o SAP\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nData da última fatura sem informação do crédito: 05/03/2025\nData do último registro do demonstrativo no GMM: 01/01/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Cliente GD\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: 920012\nModalidade de comunicação: SMS\nCliente solicita comunicação por SMS. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Crédito não migrado do GMM para o SAP\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nData da última fatura sem informação do crédito: 05/03/2025\nData do último registro do demonstrativo no GMM: 01/01/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Cliente GD\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: 920012\nModalidade de comunicação: SMS\nCliente solicita comunicação por SMS. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Geradora e Beneficiária sem compensar\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nGeradora ou beneficiária: Beneficiária\nPeríodo sem compensar: Ciclo atual\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: carta\nCliente solicita comunicação por carta. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Geradora e Beneficiária sem compensar\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nGeradora ou beneficiária: Beneficiária\nPeríodo sem compensar: Ciclo atual\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: carta\nCliente solicita comunicação por carta. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Faturamento acumulado sem aplicação do Art 323\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nAs faturas deveriam ter a aplicação do Artigo 323? Sim (X) Não ( )\nPeríodo do faturamento: 01/2025 a 03/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Faturamento acumulado sem aplicação do Art 323\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nAs faturas deveriam ter a aplicação do Artigo 323? Sim (X) Não ( )\nPeríodo do faturamento: 01/2025 a 03/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Faturamento acumulado sem aplicação do Art 323\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nAs faturas deveriam ter a aplicação do Artigo 323? Sim ( ) Não (X)\nPeríodo do faturamento: 01/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
    agenda:
      'Faturamento acumulado sem aplicação do Art 323\nSolicitante – Maria\nDescrição da reclamação: Sem compensação\nAs faturas deveriam ter a aplicação do Artigo 323? Sim ( ) Não (X)\nPeríodo do faturamento: 01/2025\nPonto de Referência: Praça\nE-mail: m@e.com\nTel. Celular: (71) 99350-1519\nOutras Informações: Não informado\nVerifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: N/A\nModalidade de comunicação: e-mail\nCliente solicita comunicação por e-mail. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.',
  },
  {
    nota: 'Solicitante: João\nTelefone: (71) 3333-4444\nE mail: j@e.com\nForma de pagamento: (X) Conta Bancária ( ) Ordem de pagamento\nE-mail: j@e.com\nDados Bancários: Conta do titular\nBanco: Banco X\nAgência: 0035\nConta: 12345-6\nTipo da Conta: Poupança',
    agenda:
      'Solicitante: João\nTelefone: (71) 3333-4444\nE mail: j@e.com\nForma de pagamento: (X) Conta Bancária ( ) Ordem de pagamento\nE-mail: j@e.com\nDados Bancários: Conta do titular\nBanco: Banco X\nAgência: 0035\nConta: 12345-6\nTipo da Conta: Poupança',
  },
  {
    nota: 'Solicitante: João\nTelefone: (71) 3333-4444\nE mail: j@e.com\nForma de pagamento: ( ) Conta Bancária (X) Ordem de pagamento\nE-mail: j@e.com\nDados Bancários: Conta do titular\nBanco: Banco X\nAgência: 0035\nConta: Não se aplica\nTipo da Conta: Não se aplica',
    agenda:
      'Solicitante: João\nTelefone: (71) 3333-4444\nE mail: j@e.com\nForma de pagamento: ( ) Conta Bancária (X) Ordem de pagamento\nE-mail: j@e.com\nDados Bancários: Conta do titular\nBanco: Banco X\nAgência: 0035\nConta: Não se aplica\nTipo da Conta: Não se aplica',
  },
];

async function preencher(page, sf, valores) {
  await page.evaluate(
    ({ sf, valores }) => {
      window.trocarAba(sf, document.querySelector(`#service_nav .sub-btn[data-click*="'${sf}'"]`));
      window.limparForm(sf);
      for (const [id, v] of Object.entries(valores)) {
        const el = document.getElementById(id);
        el.value = v;
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    { sf, valores },
  );
  await page.locator(`#${sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
}

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.sf} #${i}`, async ({ page }) => {
    await preencher(page, c.sf, c.valores);
    const r = { nota: await page.locator('#out-nota').inputValue(), agenda: await page.locator('#out-agenda').inputValue() };
    expect(r).toEqual(ESPERADO[i]);
    await fecharTextoGerado(page);
  });
}

test('lote 8: datas da Reclamação GD inválidas ou futuras são barradas', async ({ page }) => {
  for (const [valor, msg] of [
    ['2025-02-01', 'A data do campo "Data da última fatura:" deve estar no formato dd/mm/aaaa.'],
    ['31/02/2025', 'A data do campo "Data da última fatura:" não é uma data real. Verifique o dia e o mês.'],
    ['10/10/2099', 'A data do campo "Data da última fatura:" não pode ser uma data futura.'],
  ]) {
    await preencher(page, 'sf-reclamacao-gd', { ...GD, gd_tipo: 'ausencia_fat', gd_dt_ultima_fat: valor, gd_periodo_sem_fat: '2 meses' });
    await expect(page.locator('#toastAviso')).toContainText(msg);
  }
});
