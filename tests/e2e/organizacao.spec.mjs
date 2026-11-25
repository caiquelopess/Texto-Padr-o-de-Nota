import { abrirServico, expect, fecharTextoGerado, preencherObrigatorios, test } from '../support/pagina.mjs';

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
  await fecharTextoGerado(page);
  const chip = page.locator('#mais_usados .chip-servico');
  await expect(chip).toHaveText(['Reativação Virtual']);
  await abrirServico(page, 'sf-afericao');
  await chip.click();
  await expect(page.locator('#sf-reativ-virtual')).toHaveClass(/active/);
});

test('celular: barra embaixo, folha "Mais", ações à mão e texto gerado em folha', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await expect(page.locator('.app-baixo')).toBeVisible();
  await expect(page.locator('.app-baixo [data-aba="agenda"]')).toHaveClass(/ativa/);
  // Calculadora fica em "Mais"
  await page.click('#btn_mais');
  await expect(page.locator('#folha_mais')).toBeVisible();
  await page.click('#folha_mais [data-aba="calc"]');
  await expect(page.locator('#folha_mais')).toBeHidden();
  await expect(page.locator('#app_titulo')).toHaveText('Calculadora de Refaturamento');
  // volta aos textos e gera: o texto sobe numa folha
  await page.locator('.app-baixo [data-aba="agenda"]').tap();
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  const gerar = page.locator('#sf-reativ-virtual > .actions .btn').first();
  await expect(gerar).toBeInViewport();
  await gerar.click();
  await expect(page.locator('#folha_saida')).toBeVisible();
  await expect(page.locator('#folha_saida #out-nota')).not.toHaveValue('');
  await page.click('#folha_saida .folha-fechar');
  await page.click('#btn_cel_rever');
  await expect(page.locator('#folha_saida')).toBeVisible();
  // telefone abre o teclado numérico
  await expect(page.locator('#rv_tel, #sf-reativ-virtual input[id*="tel"]').first()).toHaveAttribute('inputmode', 'tel');
});

test('celular: menu do perfil e temas abrem como folha com todos os itens visíveis', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await page.route('**/api/sessao', (r) => r.fulfill({ json: { usuario: 'maria.teste', perfil: 'gestor', admin: true, gestor: true } }));
  await page.reload();
  await page.click('#btn_usuario');
  const itens = page.locator('.menu-usuario-lista .tema-opcao');
  await expect(itens).toHaveCount(5);
  for (let i = 0; i < 5; i++) await expect(itens.nth(i)).toBeInViewport({ ratio: 1 });
  await page.click('#btn_usuario_tema');
  const temas = page.locator('#tema_menu .tema-opcao');
  await expect(temas).toHaveCount(5);
  for (let i = 0; i < 5; i++) await expect(temas.nth(i)).toBeInViewport({ ratio: 1 });
});
