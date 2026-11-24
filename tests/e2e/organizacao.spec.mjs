import { abrirServico, expect, preencherObrigatorios, test } from '../support/pagina.mjs';

test('serviços agrupados por categoria, sem perder nenhum', async ({ page }) => {
  const grupos = await page.$$eval('#service_nav .svc-grupo', (gs) =>
    gs.map((g) => ({ titulo: g.querySelector('.svc-grupo-titulo').textContent, n: g.querySelectorAll('.sub-btn').length })),
  );
  expect(grupos.map((g) => g.titulo)).toContain('Ressarcimento');
  expect(grupos.reduce((t, g) => t + g.n, 0)).toBe(await page.locator('#service_nav .sub-btn').count());
  await expect(page.locator('#service_nav > .sub-btn')).toHaveCount(0);
});

test('atalhos: / vai para a busca e Ctrl+Enter gera o texto', async ({ page }) => {
  await page.locator('body').press('/');
  await expect(page.locator('#busca_servico')).toBeFocused();
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  await page.locator('#sf-reativ-virtual input:visible').first().press('Control+Enter');
  await expect(page.locator('#out-nota')).not.toHaveValue('');
});

test('"Mais usados" aparece a partir do histórico e abre o serviço', async ({ page }) => {
  await expect(page.locator('#mais_usados')).toBeHidden();
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  await page.locator('#sf-reativ-virtual > .actions .btn').first().click();
  const chip = page.locator('#mais_usados .chip-servico');
  await expect(chip).toHaveText(['Reativação Virtual']);
  await abrirServico(page, 'sf-afericao');
  await chip.click();
  await expect(page.locator('#sf-reativ-virtual')).toHaveClass(/active/);
});
