import { readFile } from 'node:fs/promises';
import { abrirServico, expect, preencherObrigatorios, test } from '../support/pagina.mjs';

const gerarUmTexto = async (page) => {
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  await page.locator('#sf-reativ-virtual > .actions .btn').first().click();
};

test('exportar meus dados gera arquivo com histórico e pendências', async ({ page }) => {
  await gerarUmTexto(page);
  await page.evaluate(() => window.criarPendenciaAuto('isencao', { origem: 'Teste', solicitante: 'Ana', doc: '1', texto: 'x' }));
  await page.click('#btn_historico');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-click="exportarDados()"]')]);
  expect(download.suggestedFilename()).toMatch(/^textos-padroes-meus-dados-\d{4}-\d{2}-\d{2}\.json$/);
  const dados = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(dados.app).toBe('textos-padroes');
  expect(dados.historico).toHaveLength(1);
  expect(dados.pendencias).toHaveLength(1);
});

test('importar junta os dados sem duplicar e recusa arquivo estranho', async ({ page }) => {
  await gerarUmTexto(page);
  const copia = await page.evaluate(() => JSON.stringify({ app: 'textos-padroes', formato: 1, historico: window.histLer(), pendencias: [] }));
  const externo = JSON.stringify({
    app: 'textos-padroes',
    formato: 1,
    historico: [{ id: 'outro1', ts: 1, dia: '2026-01-01', sf: 'sf-lp', servico: 'Ligação Provisória', nota: 'n', agenda: '' }],
    pendencias: [{ id: 'p1', kind: 'refat', origem: 'Refaturamento', contrato: '700', comentario: 'm', abertura: '2026-11-01', status: 'aberta' }],
  });
  expect(await page.evaluate((t) => window.importarTexto(t), copia)).toEqual({ historico: 0, pendencias: 0 });
  expect(await page.evaluate((t) => window.importarTexto(t), externo)).toEqual({ historico: 1, pendencias: 1 });
  expect(await page.evaluate((t) => window.importarTexto(t), externo)).toEqual({ historico: 0, pendencias: 0 });
  expect(await page.evaluate(() => [window.histLer().length, window.pendLer().length])).toEqual([2, 1]);
  expect(await page.evaluate(() => window.importarTexto('{"app":"outro"}'))).toBeNull();
  await expect(page.locator('#toastAviso')).toContainText('não é uma cópia de dados');
});

test('aviso de mudança no endereço antigo', async ({ page }) => {
  await page.evaluate(() => window.mostrarAvisoMudanca(true));
  const aviso = page.locator('.aviso-mudanca');
  await expect(aviso).toContainText('mudou de endereço');
  await expect(aviso.locator('a')).toHaveAttribute('href', 'https://textos-padroes.pages.dev/');
  await expect(aviso.locator('[data-click="exportarDados()"]')).toBeVisible();
});

test('fora do endereço antigo não há aviso', async ({ page }) => {
  await expect(page.locator('.aviso-mudanca')).toHaveCount(0);
});
