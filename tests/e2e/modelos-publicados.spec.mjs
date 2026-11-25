import { expect, test } from '../support/pagina.mjs';

const MODELO = {
  id: 'modelo-teste-painel',
  nome: 'Cadastro de Irrigante',
  categoria: 'Titularidade e Cadastro',
  avisos: ['Confira a outorga de uso da água'],
  copiar: 'nota',
  campos: [
    { id: 'tipo', rotulo: 'Tipo', tipo: 'opcao', obrigatorio: true, opcoes: ['Novo', 'Renovação'] },
    { id: 'outorga', rotulo: 'Nº da outorga', tipo: 'texto', obrigatorio: true, mostrarSe: { campo: 'tipo', igual: 'Renovação' } },
    { id: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
  ],
  nota: 'Cadastrar irrigante\nTipo: {{tipo}}\n{{#se outorga}}\nOutorga: {{outorga}}\n{{/se}}\nNome: {{nome}}',
  agenda: '',
};

test('modelo publicado vira serviço; sem servidor, continua pela cópia guardada', async ({ page }) => {
  await page.route('**/api/modelos', (r) => r.fulfill({ json: { geral: 1, modelos: [MODELO, { id: 'quebrado', nome: '', campos: [] }] } }));
  await page.reload();
  const btn = page.locator('#service_nav .sub-btn[data-modelo="modelo-teste-painel"]');
  await expect(btn).toHaveText('Cadastro de Irrigante');
  await expect(page.locator('#service_nav .sub-btn[data-modelo="quebrado"]')).toHaveCount(0); // modelo com defeito é ignorado
  await page.evaluate(() => window.trocarAba('sf-md-modelo-teste-painel', document.querySelector('[data-modelo="modelo-teste-painel"]')));
  await expect(page.locator('#sf-md-modelo-teste-painel .alert-box')).toHaveText('Confira a outorga de uso da água');
  // "mostrar se": outorga só aparece em Renovação
  await expect(page.locator('#md_modelo_teste_painel__outorga')).toBeHidden();
  await page.selectOption('#md_modelo_teste_painel__tipo', 'Renovação');
  await expect(page.locator('#md_modelo_teste_painel__outorga')).toBeVisible();
  await page.fill('#md_modelo_teste_painel__outorga', 'OUT-123');
  await page.fill('#md_modelo_teste_painel__nome', 'Maria Teste');
  await page.locator('#sf-md-modelo-teste-painel .actions .btn').first().click();
  await expect(page.locator('#out-nota')).toHaveValue('Cadastrar irrigante\nTipo: Renovação\nOutorga: OUT-123\nNome: Maria Teste');
  await expect(page.locator('#hist_contador_hoje')).toHaveText('1');

  // servidor fora do ar: o serviço continua disponível pela cópia guardada no navegador
  await page.unroute('**/api/modelos');
  await page.route('**/api/modelos', (r) => r.fulfill({ status: 503, body: '{}' }));
  await page.reload();
  await expect(page.locator('#service_nav .sub-btn[data-modelo="modelo-teste-painel"]')).toHaveCount(1);
  // os serviços embutidos nunca dependem dos modelos
  expect(await page.locator('#service_nav .sub-btn').count()).toBeGreaterThanOrEqual(47);

  // modelo retirado (arquivado) some na próxima atualização
  await page.unroute('**/api/modelos');
  await page.route('**/api/modelos', (r) => r.fulfill({ json: { geral: 2, modelos: [] } }));
  await page.reload();
  await expect(page.locator('#service_nav .sub-btn[data-modelo="modelo-teste-painel"]')).toHaveCount(0);
  await expect(page.locator('#sf-md-modelo-teste-painel')).toHaveCount(0);
});
