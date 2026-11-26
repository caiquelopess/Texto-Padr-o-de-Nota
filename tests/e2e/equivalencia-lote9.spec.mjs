import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 9, Ligação Nova e Ligação MUC): textos gravados com o código ANTIGO.
// A nota sai em maiúsculas; no modo "por expediente" o e-mail depois da "/" fica como foi digitado.
const LN = {
  ln_solic: 'Maria Souza',
  ln_tel: '71993501519',
  ln_ref: 'Px ao beco',
  ln_coords: '-12.95, -38.49',
  ln_email: 'Maria@Email.com',
  ln_proc: 'Stephanie',
};
const MUC = {
  muc_solic: 'João',
  muc_tel: '7133334444',
  muc_ref: 'Perto da praça',
  muc_coords: 'Não informado',
  muc_cod: '920012',
  muc_emp: 'Cond. Sol',
  muc_unid: 'Torre A Ap 301',
  muc_email: 'j@e.com',
  muc_proc: 'Portaria',
};
const CASOS = [
  { sf: 'sf-ligacao-nova', valores: { ...LN, ln_numero: '77', ln_compl: '' } },
  { sf: 'sf-ligacao-nova', valores: { ...LN, ln_tipo_lig: 'TRI', ln_numero: 'S/N', ln_compl: 'casa b', ln_rec: 'pendente de regularização' } },
  {
    sf: 'sf-ligacao-nova',
    valores: { ...LN, ln_modo: 'expediente', ln_tipo_lig: 'BI', ln_num_nota: '300123456', ln_emp: 'Cond. Sol', ln_ap: '101', ln_bloco: 'b' },
  },
  { sf: 'sf-ligacao-muc', valores: { ...MUC } },
  { sf: 'sf-ligacao-muc', valores: { ...MUC, muc_tipo_lig: 'TRI', muc_rec: 'pendente de regularização' } },
];

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'LN MONO N° 77 REF: PX AO BECO CG: -12.95, -38.49 TEL: 71-993501519 PC: STEPHANIE PZ 5D UTEIS',
    agenda:
      'Tipo de solicitação: Ligação Nova\nSolicitante: Maria Souza\nPontos de referências: Px ao beco\nCoordenadas geográficas: -12.95, -38.49\nTipo de ligação: MONO\nTelefones para contato: (71) 99350-1519\nE-mail para contato: Maria@Email.com\nDados da receita: (regular/pendente de regularização): REGULAR\nQuem deverá ser procurado no local: Stephanie\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'LN TRI N° S/N CASA B REF: PX AO BECO CG: -12.95, -38.49 TEL: 71-993501519 PC: STEPHANIE PZ 5D UTEIS',
    agenda:
      'Tipo de solicitação: Ligação Nova\nSolicitante: Maria Souza\nPontos de referências: Px ao beco\nCoordenadas geográficas: -12.95, -38.49\nTipo de ligação: TRI\nTelefones para contato: (71) 99350-1519\nE-mail para contato: Maria@Email.com\nDados da receita: (regular/pendente de regularização): PENDENTE DE REGULARIZAÇÃO\nQuem deverá ser procurado no local: Stephanie\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'LN BI LIB P/AE 300123456 AP 101 BL B REF: PX AO BECO TEL: 71-993501519 PC: STEPHANIE/Maria@Email.com PZ 5D UTEIS',
    agenda:
      'Tipo de solicitação: Ligação Nova\nSolicitante: Maria Souza\nPontos de referências: Px ao beco\nNome do Empreendimento: Cond. Sol\nCoordenadas geográficas: -12.95, -38.49\nTipo de ligação: BI\nTelefones para contato: (71) 99350-1519\nE-mail para contato: Maria@Email.com\nDados da receita: REGULAR\nQuem deverá ser procurado no local: Stephanie\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'Lig nov Solic João Ref Perto da praça Tel (71) 3333-4444 Lig MONO Prazo 5 dias úteis Proc Portaria MUC 920012 Nome do empreendimento Cond. Sol TORRE/BL/AP Torre A Ap 301',
    agenda:
      'Tipo de solicitação: MUC\nSolicitante: João\nPontos de referências: Perto da praça\nCoordenadas geográficas: Não informado\nTipo de ligação: MONO\nTelefones para contato: (71) 3333-4444\nMUC: 920012 | Nome do empreendimento: Cond. Sol | TORRE/BL/AP: Torre A Ap 301\nE-mail para contato: j@e.com\nDados da receita: regular\nQuem deverá ser procurado no local: Portaria\nCiente do prazo de 5 dias úteis para execução do serviço',
  },
  {
    nota: 'Lig nov Solic João Ref Perto da praça Tel (71) 3333-4444 Lig TRI Prazo 5 dias úteis Proc Portaria MUC 920012 Nome do empreendimento Cond. Sol TORRE/BL/AP Torre A Ap 301',
    agenda:
      'Tipo de solicitação: MUC\nSolicitante: João\nPontos de referências: Perto da praça\nCoordenadas geográficas: Não informado\nTipo de ligação: TRI\nTelefones para contato: (71) 3333-4444\nMUC: 920012 | Nome do empreendimento: Cond. Sol | TORRE/BL/AP: Torre A Ap 301\nE-mail para contato: j@e.com\nDados da receita: pendente de regularização\nQuem deverá ser procurado no local: Portaria\nCiente do prazo de 5 dias úteis para execução do serviço',
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
