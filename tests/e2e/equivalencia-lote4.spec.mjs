import { abrirServico, expect, fecharTextoGerado, test } from '../support/pagina.mjs';

// Equivalência da migração (lote 4, TR de Partidas): textos gravados com o código ANTIGO.
// Inclui CPF/CNPJ digitados só com números e vencimentos em mm/aaaa ou data sem zero,
// que o sistema padroniza. Os valores entram direto no campo (sem a máscara de digitação).
const BASE = {
  trp_cc_orig: '7000000001',
  trp_cc_dest: '7000000002',
  trp_contrato: '5000000001',
  trp_solic: 'Maria',
  trp_tel: '71993501519',
  trp_email: 'm@e.com',
  trp_valor: '1500,00',
  trp_nota: 'Não se aplica',
};
const CASOS = [
  {
    sf: 'sf-tr-partidas',
    valores: { ...BASE, trp_tipo: 'pf', trp_cpf: '12345678901', trp_venc_de: '3/2026', trp_venc_ate: '5/1/2027' },
    nota: 'Conta contrato de origem: 7000000001\nConta contrato de destino: 7000000002\nContrato: 5000000001\nSolicitante: Maria\nCPF/CNPJ: 123.456.789-01\nTelefone: (71) 99350-1519\n\nE-mail: m@e.com\nValor R$ 1500,00 referente ao vencimento de 03/2026 até 05/01/2027;\nN.º da nota (para débito superior a R$2.000,01): Não se aplica',
  },
  {
    sf: 'sf-tr-partidas',
    valores: { ...BASE, trp_tipo: 'pj', trp_cpf: '12345678000195', trp_cnpj: '98765432000110', trp_venc_de: '10/2026', trp_venc_ate: '11/2026' },
    nota: 'Conta contrato de origem; 7000000001\nConta contrato de destino; 7000000002\nContrato: 5000000001\nRepresentante legal da empresa: Maria\nCPF/CNPJ; 12.345.678/0001-95\nCNPJ; 98.765.432/0001-10\n\nTelefone: (71) 99350-1519\nE-mail: m@e.com\nValor R$ 1500,00 referente ao vencimento de 10/2026 até 11/2026\nN.º da nota (para débito superior a R$2.000,01) Não se aplica',
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
    await expect(page.locator('#out-agenda')).toHaveValue(c.nota);
    await fecharTextoGerado(page);
  });
}

// Erros de validação iguais aos de antes
test('lote 4: CPF/CNPJ e vencimento inválidos são barrados', async ({ page }) => {
  await abrirServico(page, 'sf-tr-partidas');
  const aviso = async (valores) =>
    page.evaluate((valores) => {
      window.limparForm('sf-tr-partidas');
      for (const [id, v] of Object.entries(valores)) {
        const el = document.getElementById(id);
        el.value = v;
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.querySelector('#sf-tr-partidas > .actions .btn:not(.btn-clear)').click();
      return document.getElementById('toastAviso').textContent;
    }, valores);
  expect(await aviso({ ...BASE, trp_tipo: 'pf', trp_cpf: '123', trp_venc_de: '10/2026', trp_venc_ate: '11/2026' })).toContain(
    'O campo "CPF/CNPJ:" deve conter um CPF com 11 números ou um CNPJ com 14 números.',
  );
  expect(await aviso({ ...BASE, trp_tipo: 'pj', trp_cpf: '12345678901', trp_cnpj: '12345678901', trp_venc_de: '10/2026', trp_venc_ate: '11/2026' })).toContain(
    'O campo "CNPJ:" deve conter um CNPJ com 14 números.',
  );
  expect(await aviso({ ...BASE, trp_tipo: 'pf', trp_cpf: '12345678901', trp_venc_de: '13/2026', trp_venc_ate: '11/2026' })).toContain(
    'O mês do campo "Vencimento de:" deve ser entre 01 e 12.',
  );
  expect(await aviso({ ...BASE, trp_tipo: 'pf', trp_cpf: '12345678901', trp_venc_de: '10/2026', trp_venc_ate: '31/02/2027' })).toContain(
    'O campo "Até:" deve ter uma data real (dd/mm/aaaa) ou um mês/ano (mm/aaaa) válido.',
  );
  expect(
    await aviso({
      ...BASE,
      trp_tipo: 'pj',
      trp_solic: '',
      trp_cpf: '12345678901',
      trp_cnpj: '12345678000195',
      trp_venc_de: '10/2026',
      trp_venc_ate: '11/2026',
    }),
  ).toContain('Representante legal da empresa:');
});
