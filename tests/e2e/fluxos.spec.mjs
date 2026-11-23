import { abrirServico, expect, preencherObrigatorios, test } from '../support/pagina.mjs';

test('texto gerado vai para o histórico', async ({ page }) => {
  await abrirServico(page, 'sf-reativ-virtual');
  await preencherObrigatorios(page, 'sf-reativ-virtual');
  await page.locator('#sf-reativ-virtual > .actions .btn').first().click();
  await page.click('#btn_historico');
  await expect(page.locator('#hist_lista .hist-item')).toHaveCount(1);
  await expect(page.locator('#hist_lista .hist-serv')).toHaveText('Reativação Virtual');
});

test('calculadora de refat: leitura esperada', async ({ page }) => {
  await page.click('[data-aba="calc"]');
  for (const [k, v] of Object.entries({
    calc_lt_ant: '1000',
    calc_dt_ant: '09/04/2025',
    calc_lt_cli: '1118',
    calc_dt_cli: '05/08/2025',
    calc_dt_esp: '12/05/2025',
  }))
    await page.fill(`#${k}`, v);
  await expect(page.locator('#calc_r_leitura')).toHaveText('1033');
  await expect(page.locator('#ru_leitura')).toHaveValue('1118');
});

test('pendência de serviço: salvar, lembrar, retomar e concluir', async ({ page }) => {
  await page.click('[data-aba="pend"]');
  await page.evaluate(() => {
    const s = document.getElementById('pend_servico');
    s.value = 'sf-reativ-virtual';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.click('#btn_pend_abrir');
  await expect(page.locator('#sf-reativ-virtual #pend_box')).toBeVisible();
  await page.fill('#rtv_solic', 'Maria Teste');
  await page.fill('#pendc_coment', 'Complementar nota 300123456');
  await page.click('[data-click="salvarPendenciaServico()"]');
  await expect(page.locator('#pend_lista .pend-item')).toHaveCount(1);
  // antes da data: sem alerta; depois da data: alerta grave
  await page.evaluate(() => {
    window.verificarLembretes();
  });
  await expect(page.locator('#pend_lembrete')).toBeHidden();
  await page.evaluate(() => {
    const l = window.pendLer();
    l[0].lembrete = '2020-01-01';
    l[0].ultimoLembrete = 0;
    window.pendGravar(l);
    window.verificarLembretes();
  });
  await expect(page.locator('#pend_lembrete')).toHaveClass(/urgente/);
  await page.click('[data-click="fecharLembrete()"]');
  await page.locator('#pend_lista [data-click^="retomarPendencia"]').click();
  await expect(page.locator('#rtv_solic')).toHaveValue('Maria Teste');
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('#sf-reativ-virtual input[required]')) if (!el.value) el.value = /tel/.test(el.id) ? '71993501519' : 'Teste';
  });
  await page.click('#pendc_concluir');
  await expect.poll(() => page.evaluate(() => window.pendLer()[0].status)).toBe('concluida');
});

test('pendência de refaturamento: sem data e sem alerta', async ({ page }) => {
  await page.click('[data-aba="pend"]');
  await page.fill('#pref_contrato', '7001234567');
  await page.fill('#pref_motivo', 'Leitura divergente');
  await page.click('#btn_pend_refat');
  await expect(page.locator('#pend_lista .pend-item .pend-status')).toHaveText('Sem data — aguardando refaturamento');
  await page.evaluate(() => {
    const l = window.pendLer();
    l[0].ultimoLembrete = 0;
    window.pendGravar(l);
    window.verificarLembretes();
  });
  await expect(page.locator('#pend_lembrete')).toBeHidden();
});

test('tema escolhido fica salvo', async ({ page }) => {
  await page.click('#btn_tema');
  await page.click('.tema-opcao[data-tema="contraste"]');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-paleta', 'contraste');
});

test('declaração de ligação: contrato encerrado', async ({ page }) => {
  await page.click('[data-aba="decl"]');
  for (const [k, v] of Object.entries({
    decl_cliente: 'Maria Teste',
    decl_codigo: '0070123',
    decl_doc: '12345678901',
    decl_end: 'Rua A, 1',
    decl_bairro: 'Centro',
    decl_mun: 'Camaçari',
    decl_inicio: '15/03/2024',
    decl_cidade: 'Camaçari',
  }))
    await page.fill(`#${k}`, v);
  await page.evaluate(() => {
    const s = document.getElementById('decl_situacao');
    s.value = 'encerrado';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.fill('#decl_fim', '20/10/2026');
  await page.click('[data-click="gerarDeclaracao()"]');
  await expect(page.locator('#decl_folha')).toContainText('em 15/03/2024, sendo o mesmo encerrado em 20/10/2026.');
});
