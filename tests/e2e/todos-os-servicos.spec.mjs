import { abrirServico, expect, preencherObrigatorios, test } from '../support/pagina.mjs';

// Cada botão da lista de serviços precisa abrir o formulário e gerar texto sem erro.
test('todos os serviços da lista geram texto', async ({ page }) => {
  const servicos = await page.$$eval('#service_nav .sub-btn', (bs) =>
    bs.map((b) => ({ id: /trocarAba\('([^']+)'/.exec(b.getAttribute('data-click'))[1], nome: b.textContent.trim() })),
  );
  expect(servicos.length).toBeGreaterThanOrEqual(45);
  const falhas = [];
  for (const s of servicos) {
    const sf = s.id.split('|')[0];
    await abrirServico(page, s.id);
    await page.evaluate((sf) => window.limparForm(sf), sf);
    await page.waitForTimeout(200); // campos que aparecem conforme a escolha têm animação curta
    await preencherObrigatorios(page, sf);
    await page.evaluate(() => {
      document.getElementById('out-nota').value = '';
      document.getElementById('out-agenda').value = '';
    });
    await page.locator(`#${sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
    const texto = await page.evaluate(() => document.getElementById('out-nota').value + document.getElementById('out-agenda').value);
    if (!texto.trim()) falhas.push(`${s.nome}: ${await page.textContent('#toastAviso')}`);
  }
  expect(falhas).toEqual([]);
});
