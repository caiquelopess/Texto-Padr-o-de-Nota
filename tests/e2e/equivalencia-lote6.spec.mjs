import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 6, Reativação, Reativação Virtual e Desligamento Definitivo):
// textos gravados com o código ANTIGO. A nota da Reativação sai toda em maiúsculas, sem espaços duplos.
const RTC = {
  rtc_solic: 'Maria Souza',
  rtc_tel: '71993501519',
  rtc_numero: '77',
  rtc_ref: 'Px ao beco do Sirilo',
  rtc_coords: '-12.9585, -38.4955',
  rtc_email: 'm@e.com',
  rtc_proc: 'Stephanie',
};
const RTV = {
  rtv_solic: 'João',
  rtv_tel: '7133334444',
  rtv_medidor: 'M-9',
  rtv_ref: 'Mercado',
  rtv_coords: 'Não informado',
  rtv_email: 'Não informado',
  rtv_proc: 'Portaria',
};
const DD = { dd_ref: 'Igreja', dd_solic: 'Ana', dd_tel: '71993501519', dd_email: 'a@e.com' };
const CASOS = [
  { sf: 'sf-reativ-comum', valores: { ...RTC, rtc_compl: '' } },
  { sf: 'sf-reativ-comum', valores: { ...RTC, rtc_tipo_lig: 'TRI', rtc_compl: 'ap 101', rtc_rec: 'pendente de regularização', rtc_tel: '7133334444' } },
  { sf: 'sf-reativ-virtual', valores: { ...RTV, rtv_leitura: '' } },
  { sf: 'sf-reativ-virtual', valores: { ...RTV, rtv_fase: 'BI', rtv_leitura: '12345', rtv_rec: 'pendente de regularização' } },
  { sf: 'sf-dd', valores: { ...DD } },
  { sf: 'sf-dd', valores: { ...DD, dd_vinculo: 'Representante legal', dd_crit: 'cliente', dd_entregue: 'Não' } },
];

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'RT MONO N° 77 REF: PX AO BECO DO SIRILO CG: -12.9585, -38.4955 TEL: 71-993501519 PC: STEPHANIE PZ 5D UTEIS',
    agenda:
      'Tipo de solicitação: Reativação\nSolicitante: Maria Souza\nPontos de referências: Px ao beco do Sirilo\nCoordenadas geográficas: -12.9585, -38.4955\nTipo de ligação: MONO\nTelefones para contato: (71) 99350-1519\nE-mail para contato: m@e.com\nDados da receita: (regular/pendente de regularização): REGULAR\nQuem deverá ser procurado no local: Stephanie\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'RT TRI N° 77 AP 101 REF: PX AO BECO DO SIRILO CG: -12.9585, -38.4955 TEL: 71-33334444 PC: STEPHANIE PZ 5D UTEIS',
    agenda:
      'Tipo de solicitação: Reativação\nSolicitante: Maria Souza\nPontos de referências: Px ao beco do Sirilo\nCoordenadas geográficas: -12.9585, -38.4955\nTipo de ligação: TRI\nTelefones para contato: (71) 3333-4444\nE-mail para contato: m@e.com\nDados da receita: (regular/pendente de regularização): PENDENTE DE REGULARIZAÇÃO\nQuem deverá ser procurado no local: Stephanie\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° M-9 / NAO INFORMOU LEITURA',
    agenda:
      'Tipo de solicitação: Reativação Virtual\nSolicitante: João\nPontos de referências: Mercado\nCoordenadas geográficas: Não informado\nTipo de ligação: MONO\nTelefones para contato: (71) 3333-4444\nE-mail para contato: Não informado\nDados da receita: (regular/pendente de regularização): REGULAR\nQuem deverá ser procurado no local: Portaria\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° M-9 / LEITURA 12345',
    agenda:
      'Tipo de solicitação: Reativação Virtual\nSolicitante: João\nPontos de referências: Mercado\nCoordenadas geográficas: Não informado\nTipo de ligação: BI\nTelefones para contato: (71) 3333-4444\nE-mail para contato: Não informado\nDados da receita: (regular/pendente de regularização): PENDENTE DE REGULARIZAÇÃO\nQuem deverá ser procurado no local: Portaria\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'Cliente ciente do faturamento da fatura de período final, para desligamento definitivo.\nPonto de Referência: Igreja\nSolicitante: Ana\nTitular ou representante legal? Titular\nEm caso de representante legal, informar se apresentou procuração ou certidão de óbito\nTelefone: (71) 99350-1519\nE-mail: a@e.com\nCritério da fatura final: (X) Faturado por média ou ( ) Leitura fornecida pelo cliente\nFatura Entregue: (X)Sim ( )Não\nCliente ciente que o medidor não será retirado',
    agenda:
      'Cliente ciente do faturamento da fatura de período final, para desligamento definitivo.\nPonto de Referência: Igreja\nSolicitante: Ana\nTitular ou representante legal? Titular\nEm caso de representante legal, informar se apresentou procuração ou certidão de óbito\nTelefone: (71) 99350-1519\nE-mail: a@e.com\nCritério da fatura final: (X) Faturado por média ou ( ) Leitura fornecida pelo cliente\nFatura Entregue: (X)Sim ( )Não\nCliente ciente que o medidor não será retirado',
  },
  {
    nota: 'Cliente ciente do faturamento da fatura de período final, para desligamento definitivo.\nPonto de Referência: Igreja\nSolicitante: Ana\nTitular ou representante legal? Representante legal\nEm caso de representante legal, informar se apresentou procuração ou certidão de óbito\nTelefone: (71) 99350-1519\nE-mail: a@e.com\nCritério da fatura final: ( ) Faturado por média ou (X) Leitura fornecida pelo cliente\nFatura Entregue: ( )Sim (X)Não\nCliente ciente que o medidor não será retirado',
    agenda:
      'Cliente ciente do faturamento da fatura de período final, para desligamento definitivo.\nPonto de Referência: Igreja\nSolicitante: Ana\nTitular ou representante legal? Representante legal\nEm caso de representante legal, informar se apresentou procuração ou certidão de óbito\nTelefone: (71) 99350-1519\nE-mail: a@e.com\nCritério da fatura final: ( ) Faturado por média ou (X) Leitura fornecida pelo cliente\nFatura Entregue: ( )Sim (X)Não\nCliente ciente que o medidor não será retirado',
  },
];

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.sf} #${i}`, async ({ page }) => {
    await page.evaluate(({ sf, valores }) => {
      window.trocarAba(sf, document.querySelector(`#service_nav .sub-btn[data-click*="'${sf}'"]`));
      window.limparForm(sf);
      for (const [id, v] of Object.entries(valores)) {
        const el = document.getElementById(id);
        el.value = v;
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, c);
    await page.locator(`#${c.sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
    const r = { nota: await page.locator('#out-nota').inputValue(), agenda: await page.locator('#out-agenda').inputValue() };
    expect(r).toEqual(ESPERADO[i]);
    await fecharTextoGerado(page);
  });
}

test('Reativação Virtual: lembrete do setor depois de gerar', async ({ page }) => {
  await page.evaluate((v) => {
    window.trocarAba('sf-reativ-virtual', document.querySelector(`#service_nav .sub-btn[data-click*="'sf-reativ-virtual'"]`));
    for (const [id, x] of Object.entries(v)) document.getElementById(id).value = x;
  }, RTV);
  await page.locator('#sf-reativ-virtual > .actions .btn:not(.btn-clear)').first().click();
  await expect(page.locator('#toastAviso')).toHaveText('Lembrete: altere o setor responsável na nota para o código 8GE427.');
});
