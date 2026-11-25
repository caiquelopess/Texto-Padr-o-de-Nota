import { readFile } from 'node:fs/promises';
import { abrirServico, expect, fecharTextoGerado, preencherObrigatorios, test } from '../support/pagina.mjs';

const gerarUmTexto = async (page) => {
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  await page.locator('#sf-reativ-virtual > .actions .btn').first().click();
  await fecharTextoGerado(page);
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
  await expect(aviso).toContainText('funciona normalmente até 25/11/2026');
  // é um balão flutuante: dá para minimizar e reabrir
  await aviso.locator('.aviso-mudanca-fechar').click();
  await expect(aviso).toBeHidden();
  await page.click('.aviso-mudanca-mini');
  await expect(aviso).toBeVisible();
});

test('fora do endereço antigo não há aviso', async ({ page }) => {
  await expect(page.locator('.aviso-mudanca')).toHaveCount(0);
});

test('endereço antigo: layout antigo, aviso em balão e sistema usável', async ({ browser }) => {
  const { readFileSync } = await import('node:fs');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://caiquelopess.github.io/**', (r) => {
    const caminho = new URL(r.request().url()).pathname.replace('/Texto-Padr-o-de-Nota/', '') || 'index.html';
    try {
      r.fulfill({ body: readFileSync(caminho), contentType: caminho.endsWith('.json') ? 'application/json' : 'text/html' });
    } catch {
      r.fulfill({ status: 404, body: '' });
    }
  });
  // data fixa antes do redirecionamento (26/11/2026)
  await page.addInitScript(() => {
    const D = Date;
    const agora = D.UTC(2026, 10, 24, 12);
    window.Date = class extends D {
      constructor(...a) {
        super(...(a.length ? a : [agora]));
      }
      static now() {
        return agora;
      }
    };
  });
  await page.goto('https://caiquelopess.github.io/Texto-Padr-o-de-Nota/');
  await expect(page.locator('.aviso-mudanca')).toBeVisible();
  await expect(page.locator('.lateral')).toHaveCount(0);
  await expect(page.locator('.nav-tabs .nav-tab')).toHaveCount(6);
  expect((await page.locator('.container').boundingBox()).width).toBeGreaterThan(900);
  await page.click('#btn_alternar_servicos');
  await page.click('#service_nav .sub-btn >> text="Religação"');
  await expect(page.locator('#sf-relig')).toHaveClass(/active/);
  await page.close();
});
