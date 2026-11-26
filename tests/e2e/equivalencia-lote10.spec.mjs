import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 10, Isenção de Débitos): textos gravados com o código ANTIGO,
// mais a pendência de 5 dias úteis criada ao gerar e as mensagens de erro.
const AID = {
  aid_cc: '7001234567',
  aid_pn: '1010000000',
  aid_solic: 'Maria Souza',
  aid_doc: '12345678901',
  aid_tel: '71993501519',
  aid_email: 'm@e.com',
  aid_docs: 'Escritura e cnh...',
};
const ISE = {
  ise_solic: 'João Lima',
  ise_doc: '12345678000195',
  ise_tel: '7133334444',
  ise_email: 'j@e.com',
  ise_cca: '7000000001',
  ise_ccn: '7000000002',
  ise_leitura: '15420',
  ise_doc_posse: 'Contrato de locação',
  ise_periodo_final: 'Não se aplica',
  ise_forma: 'Impressa na loja',
};
const CASOS = [
  { botao: 'sf-analise-isencao', valores: AID },
  { botao: 'sf-isencao-deb|troca', valores: { ...ISE, ise_deb_total: 'R$ 3.250,80' } },
  {
    botao: 'sf-isencao-deb|reativacao',
    valores: {
      ...ISE,
      ise_deb_total: '15.000,00',
      ise_ni: 'NI-77',
      ise_deb_solic: 'R$ 120,00',
      ise_fat_solic: 'Sim',
      ise_de: '01/01/2025',
      ise_ate: '31/03/2025',
      ise_rec: 'indisponível',
      ise_crit: 'Leitura fornecida pelo cliente',
      ise_mmgd: 'Sim',
      ise_neo: '555',
    },
  },
  { botao: 'sf-isencao-deb|troca', valores: { ...ISE, ise_deb_total: '12000', ise_ni: 'não deve sair' } },
];

// Saídas do código antigo (nota, agenda e pendência criada, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'Análise de isenção de debitos\nConta contrato: 7001234567\nSolicitante: MARIA SOUZA\nCPF/CNPJ: 123.456.789-01\nPN: 1010000000\nTEL: 71-993501519\nEMAIL: m@e.com\nDOCUMENTAÇÃO APRESENTADA: ESCRITURA E CNH.',
    agenda:
      'Análise de isenção de debitos\nConta contrato: 7001234567\nSolicitante: MARIA SOUZA\nCPF/CNPJ: 123.456.789-01\nPN: 1010000000\nTEL: 71-993501519\nEMAIL: m@e.com\nDOCUMENTAÇÃO APRESENTADA: ESCRITURA E CNH.',
    pendencia: ['isencao', 'Isenção de Débitos (pedido de análise)', 'Maria Souza', '7001234567', '123.456.789-01', 5, true],
  },
  {
    nota: 'Título: TROCA DE TITULARIDADE COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 3.250,80\nCaso débito >R$12.000, número da nota interna: Não se aplica\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não se aplica\nFatura de responsabilidade do Solicitante foi entregue: Não se aplica\nPeríodo (de/até): Não se aplica\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): regular\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Faturado por média\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: Não se aplica',
    agenda:
      'Título: TROCA DE TITULARIDADE COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 3.250,80\nCaso débito >R$12.000, número da nota interna: Não se aplica\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não se aplica\nFatura de responsabilidade do Solicitante foi entregue: Não se aplica\nPeríodo (de/até): Não se aplica\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): regular\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Faturado por média\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: Não se aplica',
    pendencia: ['isencao', 'Troca de Titularidade com Análise de Isenção de Débitos', 'João Lima', '7000000002', '12.345.678/0001-95', 5, true],
  },
  {
    nota: 'Título: REATIVAÇÃO COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Reativação\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 15.000,00\nCaso débito >R$12.000, número da nota interna: NI-77\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): R$ 120,00\nFatura de responsabilidade do Solicitante foi entregue: Sim\nPeríodo (de/até): 01/01/2025 até 31/03/2025\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Leitura fornecida pelo cliente\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 555',
    agenda:
      'Título: REATIVAÇÃO COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Reativação\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 15.000,00\nCaso débito >R$12.000, número da nota interna: NI-77\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): R$ 120,00\nFatura de responsabilidade do Solicitante foi entregue: Sim\nPeríodo (de/até): 01/01/2025 até 31/03/2025\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Leitura fornecida pelo cliente\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 555',
    pendencia: ['isencao', 'Reativação com Análise de Isenção de Débitos', 'João Lima', '7000000002', '12.345.678/0001-95', 5, true],
  },
  {
    nota: 'Título: TROCA DE TITULARIDADE COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 12000\nCaso débito >R$12.000, número da nota interna: Não se aplica\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não se aplica\nFatura de responsabilidade do Solicitante foi entregue: Não se aplica\nPeríodo (de/até): Não se aplica\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): regular\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Faturado por média\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: Não se aplica',
    agenda:
      'Título: TROCA DE TITULARIDADE COM ANÁLISE DE ISENÇÃO DE DÉBITOS\nSolicitante: João Lima\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 3333-4444\nE-mail: j@e.com\nServiço (troca ou reativação): Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: 7000000002\nLeitura: 15420\nValor do débito total R$: 12000\nCaso débito >R$12.000, número da nota interna: Não se aplica\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não se aplica\nFatura de responsabilidade do Solicitante foi entregue: Não se aplica\nPeríodo (de/até): Não se aplica\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato de locação\nDados da Receita Federal (inserir cópia no SAP KM): regular\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Faturado por média\nFatura final entregue de que forma: Impressa na loja\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: Não se aplica',
    pendencia: ['isencao', 'Troca de Titularidade com Análise de Isenção de Débitos', 'João Lima', '7000000002', '12.345.678/0001-95', 5, true],
  },
];

async function gerar(page, botao, valores) {
  await page.evaluate(
    ({ botao, valores }) => {
      localStorage.removeItem('tp_teste_pendencias_v1');
      const sf = botao.split('|')[0];
      window.trocarAba(botao, document.querySelector(`#service_nav .sub-btn[data-click*="'${botao}'"]`));
      window.limparForm(sf);
      return new Promise((ok) =>
        setTimeout(() => {
          for (const [id, v] of Object.entries(valores)) {
            const el = document.getElementById(id);
            el.value = v;
            el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
          }
          ok();
        }, 50),
      );
    },
    { botao, valores },
  );
  await page
    .locator(`#${botao.split('|')[0]} > .actions .btn:not(.btn-clear):not(.btn-edit)`)
    .first()
    .click();
}

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.botao} #${i}`, async ({ page }) => {
    await gerar(page, c.botao, c.valores);
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
      const pd = JSON.parse(localStorage.getItem('tp_teste_pendencias_v1') || '[]')[0] || {};
      return {
        nota: document.getElementById('out-nota').value,
        agenda: document.getElementById('out-agenda').value,
        pendencia: [pd.tipo, pd.origem, pd.solicitante, pd.cc, pd.doc, pd.prazoUteis, pd.texto === document.getElementById('out-nota').value],
      };
    });
    expect(r).toEqual(ESPERADO[i]);
    await fecharTextoGerado(page);
  });
}

test('lote 10: valores, documento e período inválidos são barrados', async ({ page }) => {
  for (const [botao, valores, msg] of [
    ['sf-analise-isencao', { ...AID, aid_doc: '123' }, 'CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) números.'],
    ['sf-isencao-deb|troca', { ...ISE, ise_doc: '12', ise_deb_total: '10' }, 'CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) números.'],
    ['sf-isencao-deb|troca', { ...ISE, ise_deb_total: 'muito' }, 'informe o valor do débito total em reais (ex: 3.250,80).'],
    ['sf-isencao-deb|troca', { ...ISE, ise_deb_total: '10', ise_de: '01/01/2025' }, 'preencha as duas datas do período (de e até) ou deixe as duas em branco.'],
    [
      'sf-isencao-deb|troca',
      { ...ISE, ise_deb_total: '10', ise_de: '01/03/2025', ise_ate: '01/01/2025' },
      'a data final do período não pode ser anterior à inicial.',
    ],
    ['sf-isencao-deb|troca', { ...ISE, ise_deb_total: '12.000,01' }, 'Débito acima de R$ 12.000 — número da nota interna'],
  ]) {
    await gerar(page, botao, valores);
    await expect(page.locator('#toastAviso')).toContainText(msg);
  }
});
