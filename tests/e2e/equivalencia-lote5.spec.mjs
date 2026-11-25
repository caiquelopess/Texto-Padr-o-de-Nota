import { expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 5, Troca de Titularidade e Reativação com débitos):
// textos gravados com o código ANTIGO. Cada caso abre o botão do tipo (formulário|subtipo).
// MMGD "Não" preenche sozinho a Tarefa Neo com "nao" (quando ela não é informada).
const TT = {
  tt_solic: 'Maria',
  tt_tel: '71993501519',
  tt_email: 'm@e.com',
  tt_leitura: '1234',
  tt_cca: '7000000001',
  tt_ccn: 'A gerar',
  tt_rec: 'pendente de regularização',
  tt_ciente_fim: 'Sim',
  tt_crit: 'fornecida pelo cliente',
};
const DEB_TT = {
  tt_deb_total: '1500,00',
  tt_deb_solic: 'Não possui',
  tt_fat_solic_entregue: 'não',
  tt_periodo: '01/2026 até 05/2026',
  tt_doc_posse: 'Contrato',
  tt_forma_entrega: 'E-mail',
};
const RI = {
  ri_solic: 'João',
  ri_ref: 'Mercado',
  ri_tel: '71993501519',
  ri_email: 'j@e.com',
  ri_cca: '7000000003',
  ri_ccn: 'A gerar',
  ri_deb_total: '900,00',
  ri_deb_solic: 'Não possui',
  ri_fat_entregue: 'não',
  ri_periodo: '02/2026 até 04/2026',
  ri_doc_posse: 'Matrícula',
  ri_rec: 'indisponível',
  ri_proc: 'Ana',
};
const CASOS = [
  {
    botao: 'sf-tt|sem_debito',
    valores: { ...TT, tt_tipo: 'sem_debito', tt_rep: 'Não informado', tt_cpf: '12345678901', tt_fat_entregue: 'Não', tt_mmgd: 'Sim', tt_neo: '987' },
    nota: 'Solicitante (titular).: Maria\nSe houver, representante legal: Não informado\nCPF/CNPJ: 123.456.789-01\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nLeitura: 1234\nCC antiga: 7000000001\nNova CC: A gerar\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura entregue: Não\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 987',
  },
  {
    botao: 'sf-tt|com_assuncao',
    valores: { ...TT, ...DEB_TT, tt_tipo: 'com_assuncao', tt_cpf: '12345678000195', tt_retornar_termo: 'Não', tt_mmgd: 'Sim' },
    depois: { tt_mmgd: 'Não' },
  },
  {
    botao: 'sf-tt|sem_debito',
    valores: { ...TT, ...DEB_TT, tt_tipo: 'com_isencao', tt_cpf: '12345678901', tt_ni: 'NI-55', tt_mmgd: 'Não', tt_neo: '555' },
  },
  { botao: 'sf-ri|assuncao', valores: { ...RI, ri_tipo: 'assuncao', ri_cpf: '12345678901', ri_leitura: '4321', ri_retornar_termo: 'Sim' } },
  {
    botao: 'sf-ri|assuncao',
    valores: { ...RI, ri_tipo: 'isencao', ri_cpf: '12345678000195', ri_leitura: '4321', ri_ni: 'NI-1', ri_mmgd: 'Sim', ri_neo: '77' },
  },
  {
    botao: 'sf-ri|virtual_assuncao',
    valores: { ...RI, ri_tipo: 'virtual_assuncao', ri_cpf: '12345678901', ri_medidor: 'M-1', ri_leitura: 'Sem leitura', ri_retornar_termo: 'Não' },
  },
  {
    botao: 'sf-ri|virtual_isencao',
    valores: { ...RI, ri_tipo: 'virtual_isencao', ri_cpf: '12345678901', ri_medidor: 'M-2', ri_leitura: '555', ri_ni: 'Não se aplica' },
  },
];

async function preencher(page, valores) {
  await page.evaluate((valores) => {
    for (const [id, v] of Object.entries(valores)) {
      const el = document.getElementById(id);
      el.value = v;
      if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, valores);
}

async function gerar(page, c) {
  const sf = c.botao.split('|')[0];
  await page.evaluate((b) => {
    const btn = document.querySelector(`#service_nav .sub-btn[data-click*="'${b}'"]`);
    window.trocarAba(b, btn);
    window.limparForm(b.split('|')[0]);
  }, c.botao);
  await page.waitForTimeout(50); // o tipo do botão volta logo após limpar
  await preencher(page, c.valores);
  if (c.depois) await preencher(page, c.depois);
  await page.locator(`#${sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
  return { nota: await page.locator('#out-nota').inputValue(), agenda: await page.locator('#out-agenda').inputValue() };
}

// Saídas do código antigo (nota e agenda de cada caso, na mesma ordem de CASOS).
const ESPERADO = [
  {
    nota: 'Solicitante (titular).: Maria\nSe houver, representante legal: Não informado\nCPF/CNPJ: 123.456.789-01\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nLeitura: 1234\nCC antiga: 7000000001\nNova CC: A gerar\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura entregue: Não\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 987',
    agenda:
      'Solicitante (titular).: Maria\nSe houver, representante legal: Não informado\nCPF/CNPJ: 123.456.789-01\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nLeitura: 1234\nCC antiga: 7000000001\nNova CC: A gerar\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura entregue: Não\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 987',
  },
  {
    nota: 'Solicitante: Maria\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 99350-1519\nE-mail: m@e.com\nServiço: Troca \nCC Antiga: 7000000001\nCC Nova: A gerar\nLeitura: 1234\nValor do débito total R$: 1500,00\nInformou ao cliente para retornar no dia seguinte para assinar o termo de assunção de débitos: Não\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até): 01/2026 até 05/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período final de: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura final entregue de que forma: E-mail\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: nao',
    agenda:
      'Solicitante: Maria\nCPF/CNPJ: 12.345.678/0001-95\nTelefone com DDD: (71) 99350-1519\nE-mail: m@e.com\nServiço: Troca \nCC Antiga: 7000000001\nCC Nova: A gerar\nLeitura: 1234\nValor do débito total R$: 1500,00\nInformou ao cliente para retornar no dia seguinte para assinar o termo de assunção de débitos: Não\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até): 01/2026 até 05/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Contrato\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período final de: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura final entregue de que forma: E-mail\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: nao',
  },
  {
    nota: 'Solicitante: Maria\nCPF/CNPJ: 123.456.789-01\nTelefone com DDD: (71) 99350-1519\nE-mail: m@e.com\nServiço: Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: A gerar\nLeitura: 1234\nValor do débito total R$: 1500,00\nCaso débito >R$12.000, número da nota interna: NI-55\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até): 01/2026 até 05/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM) : Contrato\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período final de: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura final entregue de que forma: E-mail\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: 555',
    agenda:
      'Solicitante: Maria\nCPF/CNPJ: 123.456.789-01\nTelefone com DDD: (71) 99350-1519\nE-mail: m@e.com\nServiço: Troca de titularidade\nCC Antiga: 7000000001\nCC Nova: A gerar\nLeitura: 1234\nValor do débito total R$: 1500,00\nCaso débito >R$12.000, número da nota interna: NI-55\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até): 01/2026 até 05/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM) : Contrato\nDados da Receita Federal (inserir cópia no SAP KM): pendente de regularização\nCliente ciente do faturamento da fatura de período final de: Sim\nCritério de fatura final: fornecida pelo cliente\nFatura final entregue de que forma: E-mail\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: 555',
  },
  {
    nota: 'REATIV Ref ou geolocalização Mercado Tel (71) 99350-1519 Prazo 5 dias úteis Proc Ana',
    agenda:
      'Solicitante: João\nCPF/CNPJ:123.456.789-01\nTelefone com DDD:(71) 99350-1519\nE-mail:j@e.com\nServiço: Reativação \nCC Antiga: 7000000003\nCC Nova:A gerar\nLeitura:4321\nValor do débito total R$:900,00\nInformou ao cliente para retornar no dia seguinte para assinar o termo de assunção de débitos: Sim\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade):Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até):02/2026 até 04/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Matrícula\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Não se aplica\nFatura final entregue de que forma: Não se aplica\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: nao',
  },
  {
    nota: 'REATIV Ref ou geolocalização Mercado Tel (71) 99350-1519 Prazo 5 dias úteis Proc Ana',
    agenda:
      'Solicitante: João\nCPF/CNPJ:12.345.678/0001-95\nTelefone com DDD:(71) 99350-1519\nE-mail:j@e.com\nServiço: Reativação\nCC Antiga:7000000003\nCC Nova:A gerar\nLeitura:4321\nValor do débito total R$:900,00\nCaso débito >R$12.000, número da nota interna:NI-1\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade):Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até):02/2026 até 04/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM) : Matrícula\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: não se aplica\nFatura final entregue de que forma: não se aplica\nSe trata de unidade consumidora MMGD Geradora? Sim\nNúmero da Tarefa Neo aberta: 77',
  },
  {
    nota: 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° M-1 / LEITURA Sem leitura  Solic: João Ref: Mercado Tel: (71) 99350-1519 Proc: Ana',
    agenda:
      'Solicitante: João\nCPF/CNPJ:123.456.789-01\nTelefone com DDD:(71) 99350-1519\nE-mail:j@e.com\nServiço: Reativação \nCC Antiga: 7000000003\nCC Nova:A gerar\nLeitura:Sem leitura\nValor do débito total R$:900,00\nInformou ao cliente para retornar no dia seguinte para assinar o termo de assunção de débitos: Não\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade):Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até):02/2026 até 04/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): Matrícula\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: Não se aplica\nFatura final entregue de que forma: Não se aplica\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: nao',
  },
  {
    nota: 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° M-2 / LEITURA 555  Solic: João Ref: Mercado Tel: (71) 99350-1519 Proc: Ana',
    agenda:
      'Solicitante: João\nCPF/CNPJ:123.456.789-01\nTelefone com DDD:(71) 99350-1519\nE-mail:j@e.com\nServiço: Reativação\nCC Antiga:7000000003\nCC Nova:A gerar\nLeitura:555\nValor do débito total R$:900,00\nCaso débito >R$12.000, número da nota interna:Não se aplica\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade):Não possui\nFatura de responsabilidade do Solicitante foi entregue: não\nPeríodo (de/até):02/2026 até 04/2026\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM) : Matrícula\nDados da Receita Federal (inserir cópia no SAP KM): indisponível\nCliente ciente do faturamento da fatura de período final de: Não se aplica\nCritério de fatura final: não se aplica\nFatura final entregue de que forma: não se aplica\nSe trata de unidade consumidora MMGD Geradora? Não\nNúmero da Tarefa Neo aberta: nao',
  },
];

for (const [i, c] of CASOS.entries()) {
  test(`equivalência ${c.botao} #${i}`, async ({ page }) => {
    const r = await gerar(page, c);
    expect(r).toEqual(ESPERADO[i]);
    await fecharTextoGerado(page);
  });
}
