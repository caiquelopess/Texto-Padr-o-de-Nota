import { abrirServico, expect, test } from '../support/pagina.mjs';

test('Cadastro de Irrigante: texto da nota e documentos necessários', async ({ page }) => {
  await abrirServico(page, 'sf-md-cadastro-irrigante');
  await expect(page.locator('#sf-md-cadastro-irrigante')).toContainText('Documentos necessários');
  await expect(page.locator('#sf-md-cadastro-irrigante')).toContainText('Z_IRR');
  await page.evaluate(() => {
    const v = { solic: 'Jorge Santos Silva', tel: '12912345678', email: 'jorgesantos@email.com', ref: 'Sítio do Pica Pau', proc: 'Jorge' };
    for (const [k, x] of Object.entries(v)) document.getElementById(`md_cadastro_irrigante__${k}`).value = x;
  });
  await page.locator('#sf-md-cadastro-irrigante > .actions .btn:not(.btn-clear)').first().click();
  const texto =
    'Cadastro de Irrigante\n\nSolicitante: Jorge Santos Silva\nTelefone: 12-912345678\nE-mail: jorgesantos@email.com\nRef: Sítio do Pica Pau\nQuem procurar: Jorge';
  await expect(page.locator('#out-nota')).toHaveValue(texto);
  await expect(page.locator('#out-agenda')).toHaveValue(texto);
});
