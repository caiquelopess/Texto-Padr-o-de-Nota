import { expect, test } from '../support/pagina.mjs';

test('balão informativo aparece ao parar o mouse e some ao sair', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no celular não há mouse');
  await page.hover('[data-aba="calc"]');
  await expect(page.locator('#balao_dica')).toHaveClass(/visivel/);
  await expect(page.locator('#balao_dica')).toHaveText('Calcular a leitura esperada para refaturamento');
  await page.mouse.move(5, 800);
  await expect(page.locator('#balao_dica')).not.toHaveClass(/visivel/);
  // "title" nativo vira balão (sem aparecer duas vezes)
  await page.hover('#btn_historico');
  await expect(page.locator('#balao_dica')).toHaveText('Textos gerados salvos neste computador');
  await expect(page.locator('#btn_historico')).not.toHaveAttribute('title');
});

test('temas corporativos: 5 opções e tema retirado vira o mais parecido', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('tp_tema', 'neon-escuro'));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('tp_tema'))).toBe('ardosia');
  await expect(page.locator('html')).toHaveAttribute('data-paleta', 'ardosia');
  await page.evaluate(() => window.abrirTemas());
  await expect(page.locator('#tema_menu .tema-opcao')).toHaveText([
    'Claro Corporativo',
    'Escuro Corporativo',
    'Logos Executive',
    'Conforto Visual',
    'Alto Contraste',
  ]);
});
