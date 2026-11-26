import { expect, test } from '../support/pagina.mjs';

const MODELO = {
  id: 'cadastro-irrigante',
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
  const btn = page.locator('#service_nav .sub-btn[data-modelo="cadastro-irrigante"]');
  await expect(btn).toHaveText('Cadastro de Irrigante');
  await expect(page.locator('#service_nav .sub-btn[data-modelo="quebrado"]')).toHaveCount(0); // modelo com defeito é ignorado
  await page.evaluate(() => window.trocarAba('sf-md-cadastro-irrigante', document.querySelector('[data-modelo="cadastro-irrigante"]')));
  await expect(page.locator('#sf-md-cadastro-irrigante .alert-box')).toHaveText('Confira a outorga de uso da água');
  // "mostrar se": outorga só aparece em Renovação
  await expect(page.locator('#md_cadastro_irrigante__outorga')).toBeHidden();
  await page.selectOption('#md_cadastro_irrigante__tipo', 'Renovação');
  await expect(page.locator('#md_cadastro_irrigante__outorga')).toBeVisible();
  await page.fill('#md_cadastro_irrigante__outorga', 'OUT-123');
  await page.fill('#md_cadastro_irrigante__nome', 'Maria Teste');
  await page.locator('#sf-md-cadastro-irrigante .actions .btn').first().click();
  await expect(page.locator('#out-nota')).toHaveValue('Cadastrar irrigante\nTipo: Renovação\nOutorga: OUT-123\nNome: Maria Teste');
  await expect(page.locator('#hist_contador_hoje')).toHaveText('1');

  // servidor fora do ar: o serviço continua disponível pela cópia guardada no navegador
  await page.unroute('**/api/modelos');
  await page.route('**/api/modelos', (r) => r.fulfill({ status: 503, body: '{}' }));
  await page.reload();
  await expect(page.locator('#service_nav .sub-btn[data-modelo="cadastro-irrigante"]')).toHaveCount(1);
  // os serviços embutidos nunca dependem dos modelos
  expect(await page.locator('#service_nav .sub-btn').count()).toBeGreaterThanOrEqual(47);

  // modelo retirado (arquivado) some na próxima atualização
  await page.unroute('**/api/modelos');
  await page.route('**/api/modelos', (r) => r.fulfill({ json: { geral: 2, modelos: [] } }));
  await page.reload();
  await expect(page.locator('#service_nav .sub-btn[data-modelo="cadastro-irrigante"]')).toHaveCount(0);
  await expect(page.locator('#sf-md-cadastro-irrigante')).toHaveCount(0);
});

test('versão nova do modelo chega com o serviço aberto: o formulário continua aberto e o que foi digitado fica', async ({ page }) => {
  await page.evaluate(() => {
    window.trocarAba('sf-tt|com_assuncao', document.querySelector(`#service_nav .sub-btn[data-click*="'sf-tt|com_assuncao'"]`));
    document.getElementById('tt_solic').value = 'Maria Teste';
    // chega uma versão publicada do mesmo modelo (ex.: personalização feita no painel)
    const m = window.MODELOS_EMBUTIDOS.find((x) => x.id === 'troca-titularidade');
    window.mdAplicar([{ ...JSON.parse(JSON.stringify(m)), nota: m.nota.replace('Solicitante: {{solic}}', 'Titular: {{solic}}') }]);
  });
  await expect(page.locator('#sf-tt')).toBeVisible();
  await expect(page.locator('#tt_solic')).toHaveValue('Maria Teste');
  await expect(page.locator('#tt_tipo')).toHaveValue('com_assuncao');
  await expect(page.locator('#service_nav .sub-btn.active')).toHaveText('Troca de Titularidade com Assunção de Débitos');
});
