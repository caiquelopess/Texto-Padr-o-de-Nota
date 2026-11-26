import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 7, Ressarcimento de Danos): textos gravados com o código ANTIGO.
// Os campos "data e horário" não são reescritos: só é conferido que começam com uma data real e passada.
const CASOS = [
  {
    sf: 'sf-danos-eletricos',
    valores: {
      rde_solic: 'Maria',
      rde_dt_ini: '10/10/2025 às 14:00',
      rde_dt_fim: '10/10/2025 às 15:30',
      rde_tel: '71993501519',
      rde_ref: 'Colégio X e mercadinho Y',
      rde_email: 'm@e.com',
      rde_relato: 'Oscilação após chuva',
      rde_lista: '1x TV (2 anos)',
    },
  },
  {
    sf: 'sf-danos-eletricos',
    valores: {
      rde_solic: 'Maria',
      rde_dt_ini: '1/2/2025 14h',
      rde_dt_fim: '01/02/2025 16h',
      rde_tel: '7133334444',
      rde_ref: 'Igreja',
      rde_email: 'm@e.com',
      rde_meio: 'e-mail',
      rde_relato: 'Estalo',
      rde_lista: '1x Geladeira',
      rde_conserto: 'sim',
    },
  },
  { sf: 'sf-rde-doc', valores: { rdedoc_solic: 'João', rdedoc_equip: '1x TV', rdedoc_local: 'Loja Centro' } },
  {
    sf: 'sf-rde-doc',
    valores: { rdedoc_solic: 'João', rdedoc_cred: 'nao', rdedoc_qtd_orc: '2', rdedoc_qtd_desist: '1', rdedoc_equip: '1x TV', rdedoc_local: 'Loja Centro' },
  },
  { sf: 'sf-rde-doc', valores: { rdedoc_solic: 'João', rdedoc_qtd_desist: '2', rdedoc_equip: '1x TV', rdedoc_local: 'Loja Centro' } },
  {
    sf: 'sf-outros-danos',
    valores: {
      rod_solic: 'Ana Souza',
      rod_dt_ini: '05/05/2025 às 08:00',
      rod_dt_fim: '05/05/2025 às 09:00',
      rod_tel: '71993501519',
      rod_ref: 'Praça',
      rod_email: 'a@e.com',
      rod_meio: 'e-mail',
      rod_relato: 'Caminhão bateu no muro',
      rod_desc: 'Muro avariado',
    },
  },
];

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA\nSolicitante: Maria\nRelato da ocorrência: Oscilação após chuva\nData e horário do início do ocorrido: 10/10/2025 às 14:00\nData e horário do fim do ocorrido: 10/10/2025 às 15:30\nReferência: Colégio X e mercadinho Y\nTelefone para contato: (71) 99350-1519\nE-mail para contato: m@e.com\nMeio de comunicação escolhido: carta\nLista de equipamentos danificados: 1x TV (2 anos)\nOcorreu o conserto: Sim ( ) Não (X)',
    agenda:
      'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA\nSolicitante: Maria\nRelato da ocorrência: Oscilação após chuva\nData e horário do início do ocorrido: 10/10/2025 às 14:00\nData e horário do fim do ocorrido: 10/10/2025 às 15:30\nReferência: Colégio X e mercadinho Y\nTelefone para contato: (71) 99350-1519\nE-mail para contato: m@e.com\nMeio de comunicação escolhido: carta\nLista de equipamentos danificados: 1x TV (2 anos)\nOcorreu o conserto: Sim ( ) Não (X)',
  },
  {
    nota: 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA\nSolicitante: Maria\nRelato da ocorrência: Estalo\nData e horário do início do ocorrido: 1/2/2025 14h\nData e horário do fim do ocorrido: 01/02/2025 16h\nReferência: Igreja\nTelefone para contato: (71) 3333-4444\nE-mail para contato: m@e.com\nMeio de comunicação escolhido: e-mail\nLista de equipamentos danificados: 1x Geladeira\nOcorreu o conserto: Sim (X) Não ( )',
    agenda:
      'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA\nSolicitante: Maria\nRelato da ocorrência: Estalo\nData e horário do início do ocorrido: 1/2/2025 14h\nData e horário do fim do ocorrido: 01/02/2025 16h\nReferência: Igreja\nTelefone para contato: (71) 3333-4444\nE-mail para contato: m@e.com\nMeio de comunicação escolhido: e-mail\nLista de equipamentos danificados: 1x Geladeira\nOcorreu o conserto: Sim (X) Não ( )',
  },
  {
    nota: 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S (X) N ( )\nQuantidade Orçamento (s) 1 (X) 2 ( )\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum (X) ( ) 1 ( ) 2\nLocal de entrega : Loja Centro',
    agenda:
      'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S (X) N ( )\nQuantidade Orçamento (s) 1 (X) 2 ( )\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum (X) ( ) 1 ( ) 2\nLocal de entrega : Loja Centro',
  },
  {
    nota: 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S ( ) N (X)\nQuantidade Orçamento (s) 1 ( ) 2 (X)\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum ( ) (X) 1 ( ) 2\nLocal de entrega : Loja Centro',
    agenda:
      'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S ( ) N (X)\nQuantidade Orçamento (s) 1 ( ) 2 (X)\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum ( ) (X) 1 ( ) 2\nLocal de entrega : Loja Centro',
  },
  {
    nota: 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S (X) N ( )\nQuantidade Orçamento (s) 1 (X) 2 ( )\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum ( ) ( ) 1 (X) 2\nLocal de entrega : Loja Centro',
    agenda:
      'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\nSolicitante João compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\nCliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? S (X) N ( )\nQuantidade Orçamento (s) 1 (X) 2 ( )\nDetalhar de quais equipamentos : 1x TV\nQuantidade Laudo (s) Desistência? Nenhum ( ) ( ) 1 (X) 2\nLocal de entrega : Loja Centro',
  },
  {
    nota: 'Título: RESSARCIMENTO DE DANOS NÃO ELÉTRICOS\nNome e sobrenome do cliente: Ana Souza\nRelatos da ocorrência: Caminhão bateu no muro\nData e horário do início do ocorrido: 05/05/2025 às 08:00\nData e horário do fim do ocorrido: 05/05/2025 às 09:00\nReferência: Praça\nTelefone: (71) 99350-1519\nE-mail para contato: a@e.com\nMeio de comunicação escolhido (carta ou e-mail): e-mail\nDescrição do Dano Não elétrico: Muro avariado\nPrazo para análise 30 (trinta) dias corridos.',
    agenda:
      'Título: RESSARCIMENTO DE DANOS NÃO ELÉTRICOS\nNome e sobrenome do cliente: Ana Souza\nRelatos da ocorrência: Caminhão bateu no muro\nData e horário do início do ocorrido: 05/05/2025 às 08:00\nData e horário do fim do ocorrido: 05/05/2025 às 09:00\nReferência: Praça\nTelefone: (71) 99350-1519\nE-mail para contato: a@e.com\nMeio de comunicação escolhido (carta ou e-mail): e-mail\nDescrição do Dano Não elétrico: Muro avariado\nPrazo para análise 30 (trinta) dias corridos.',
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

test('lote 7: data e horário inválidos ou futuros são barrados', async ({ page }) => {
  const base = CASOS[0].valores;
  for (const [valor, msg] of [
    ['ontem às 14h', 'O campo "Início do ocorrido (Data e horário):" deve começar com uma data no formato dd/mm/aaaa.'],
    ['31/02/2025 às 14h', 'A data do campo "Início do ocorrido (Data e horário):" não é uma data real. Verifique o dia e o mês.'],
    ['10/10/2099 às 14h', 'A data do campo "Início do ocorrido (Data e horário):" não pode ser uma data futura.'],
  ]) {
    await preencher(page, 'sf-danos-eletricos', { ...base, rde_dt_ini: valor });
    await expect(page.locator('#toastAviso')).toContainText(msg);
  }
});
