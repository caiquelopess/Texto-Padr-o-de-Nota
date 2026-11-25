import { expect, test } from '../support/pagina.mjs';

const DOC = {
  categorias: [{ nome: 'Mais pedidos' }, { nome: 'Ligação e Reativação' }, { nome: 'Cobrança' }],
  servicos: { 'sf-relig': { categoria: 'Mais pedidos' }, 'sf-bpc': { categoria: 'Cobrança' }, 'sf-afericao': { oculto: true } },
  scripts: {
    'sf-relig': { falas: ['Bom dia! Com quem eu falo?', 'Confirme o endereço completo'], checklist: ['Comprovante de pagamento', 'Ponto de referência'] },
  },
};
const grupo = (page, nome) => page.locator('.svc-grupo').filter({ has: page.locator('.svc-grupo-titulo', { hasText: new RegExp(`^${nome}$`) }) });
const titulos = (page) => page.$$eval('#service_nav .svc-grupo-titulo', (ts) => ts.map((t) => t.textContent));

test('categorias, ocultos e roteiro publicados; sem servidor, usa a cópia', async ({ page }) => {
  await page.route('**/api/atendimento', (r) => r.fulfill({ json: { documento: DOC } }));
  await page.reload();
  const t = await titulos(page);
  expect(t.slice(0, 3)).toEqual(['Mais pedidos', 'Ligação e Reativação', 'Cobrança']);
  await expect(grupo(page, 'Mais pedidos').locator('.sub-btn')).toHaveText(['Religação']);
  await expect(grupo(page, 'Cobrança').locator('.sub-btn')).toHaveText(['BPC/LOAS']);
  // oculto: some da lista e da busca, sem apagar o formulário
  await expect(page.locator('#service_nav .sub-btn', { hasText: 'Aferição' })).toHaveCount(0);
  await expect(page.locator('#svc_count')).toHaveText('45 serviços');
  await page.fill('#busca_servico', 'aferi');
  await expect(page.locator('#busca_sugestoes')).toContainText('Nenhum serviço encontrado');
  await page.fill('#busca_servico', '');
  await expect(page.locator('#sf-afericao')).toBeAttached();
  // roteiro e checklist no serviço
  await page.click('#btn_alternar_servicos');
  await page.click('#service_nav .sub-btn >> text="Religação"');
  const roteiro = page.locator('#sf-relig > .roteiro');
  await expect(roteiro.locator('.roteiro-falas li')).toHaveText(['Bom dia! Com quem eu falo?', 'Confirme o endereço completo']);
  await expect(roteiro.locator('.roteiro-check')).toHaveText([' Comprovante de pagamento', ' Ponto de referência']);
  await roteiro.locator('.roteiro-check input').first().check();
  // serviço sem script não mostra a caixa
  await page.evaluate(() => window.trocarAba('sf-bpc', document.querySelector('[data-click*="sf-bpc"]')));
  await expect(page.locator('#sf-bpc > .roteiro')).toHaveCount(0);

  // servidor fora: mantém a organização guardada
  await page.unroute('**/api/atendimento');
  await page.route('**/api/atendimento', (r) => r.fulfill({ status: 503, body: '{}' }));
  await page.reload();
  expect((await titulos(page))[0]).toBe('Mais pedidos');
});

test('sem configuração publicada, fica a organização padrão', async ({ page }) => {
  await page.route('**/api/atendimento', (r) => r.fulfill({ json: { documento: null } }));
  await page.reload();
  expect((await titulos(page))[0]).toBe('Ligação e Reativação');
  await expect(page.locator('#svc_count')).toHaveText('46 serviços');
});
