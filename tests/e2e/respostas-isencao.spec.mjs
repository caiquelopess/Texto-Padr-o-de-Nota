import { expect, test } from '../support/pagina.mjs';

// Respostas da Análise de Isenção (Texto Padrão Lojas): serviço próprio e resposta da pendência.
// Dados fictícios.
const CABECALHO = 'Caro Cliente, a Neoenergia Coelba informa:\n\nSeu protocolo de atendimento é: 2026000111.';

test('serviço: um motivo sai com o texto padrão', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.fill('#rsp_prot', '2026000111');
  await page.check('.rsp_mot[value="processo_fraude"]');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#out-agenda')).toHaveValue(
    `Título: TROCA DE TITULARIDADE INDEFERIDA – PROCESSO DE FRAUDE\n\n${CABECALHO}\n\nInformamos que após análise, verificamos que existe um processo de emissão de fatura de cobrança de fraude/irregularidade em andamento, portanto, o seu pedido não pôde ser realizado.\n\nSolicitamos que a troca de titularidade seja solicitada após a conclusão/emissão da fatura de fraude ou irregularidade para que possamos prosseguir com a sua Troca de Titularidade.`,
  );
});

test('serviço: vários motivos são combinados e o documento é pedido', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.selectOption('#rsp_serv', 'Reativação');
  await page.fill('#rsp_prot', '2026000111');
  await expect(page.locator('#rsp_doc_box')).toBeHidden();
  await page.check('.rsp_mot[value="documentacao_incompleta"]');
  await page.check('.rsp_mot[value="cpf_invalido"]');
  await expect(page.locator('#rsp_doc_box')).toBeVisible();
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#toastAviso')).toContainText('Informe qual documento não foi identificado ou está ilegível.');
  await page.fill('#rsp_doc', 'RG');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  const t = await page.locator('#out-agenda').inputValue();
  expect(t.startsWith('Título: REATIVAÇÃO INDEFERIDA – DOCUMENTAÇÃO DO CLIENTE INCOMPLETA / CPF/CNPJ INVÁLIDO')).toBe(true);
  expect(t).toContain(
    'Informamos que após análise, verificamos que:\n1. não conseguimos identificar a presença do documento RG anexado em sua solicitação;\n2. o documento CPF/CNPJ se encontra anulado',
  );
  expect(t).toContain('Portanto, o seu pedido de Reativação não pôde ser realizado.');
  expect(
    t.endsWith(
      'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua Reativação.',
    ),
  ).toBe(true);
  expect(t.match(/Solicitamos/g)).toHaveLength(1);
});

test('pendência de isenção: responder com dois motivos gera e guarda a resposta', async ({ page }) => {
  await page.evaluate(() => {
    window.criarPendenciaAuto('isencao', {
      origem: 'Troca de Titularidade com Análise de Isenção de Débitos',
      solicitante: 'Maria Teste',
      cc: '7000000001',
      doc: '12345678901',
      texto: 'x',
    });
    window.mostrarAbaPrincipal('pend');
    window.renderPendencias();
  });
  await page.locator('#painel_pend button', { hasText: 'Responder' }).first().click();
  const px = await page.evaluate(() => document.querySelector('[id^="pres_"][id$="_res"]').id.replace(/res$/, ''));
  await page.selectOption(`#${px}res`, 'Indeferido');
  await page.fill(`#${px}prot`, '2026000111');
  await page.check(`.${px}mot[value="debito_outra_uc"]`);
  await page.check(`.${px}mot[value="endereco_divergente"]`);
  await expect(page.locator(`#${px}aviso_endereco_divergente`)).toBeVisible();
  await page.locator('#painel_pend button', { hasText: 'Confirmar resposta' }).click();
  await expect(page.locator('#toastAviso')).toContainText('Pendência respondida: Indeferido');
  const pd = await page.evaluate(() => window.pendLer()[0]);
  expect(pd.status).toBe('concluida');
  expect(pd.motivo).toBe('CPF/CNPJ com débito em outra UC + Endereço do documento do imóvel divergente no sistema comercial');
  expect(pd.respostaTexto).toContain(
    'TROCA DE TITULARIDADE INDEFERIDA – CPF/CNPJ COM DÉBITO EM OUTRA UC / ENDEREÇO DO DOCUMENTO DO IMÓVEL DIVERGENTE NO SISTEMA COMERCIAL',
  );
  await page.click('#pend_concl_tit');
  await expect(page.locator('#pend_concl button', { hasText: 'Copiar resposta' })).toBeVisible();
});

test('pendência deferida: registra sem texto de resposta (serviço segue com o texto padrão)', async ({ page }) => {
  await page.evaluate(() => {
    window.criarPendenciaAuto('isencao', {
      origem: 'Reativação com Análise de Isenção de Débitos',
      solicitante: 'João Teste',
      cc: '7000000002',
      doc: '12345678901',
      texto: 'x',
    });
    window.mostrarAbaPrincipal('pend');
    window.renderPendencias();
  });
  await page.locator('#painel_pend button', { hasText: 'Responder' }).first().click();
  const px = await page.evaluate(() => document.querySelector('[id^="pres_"][id$="_res"]').id.replace(/res$/, ''));
  await expect(page.locator(`#${px}def_info`)).toContainText('Execute o serviço');
  await expect(page.locator(`#${px}prot`)).toBeHidden();
  await page.locator('#painel_pend button', { hasText: 'Confirmar resposta' }).click();
  await expect(page.locator('#toastAviso')).toContainText('Pendência respondida: Deferido');
  const pd = await page.evaluate(() => window.pendLer()[0]);
  expect(pd.resultado).toBe('Deferido');
  expect(pd.respostaTexto).toBe('');
});

test('serviço avulso: só indeferimento (sem escolha de resultado)', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await expect(page.locator('#rsp_res')).toHaveValue('Indeferido');
  await expect(page.locator('#sf-resposta-isencao select#rsp_res')).toHaveCount(0);
});

test('débito de responsabilidade: orientações e confirmação obrigatória', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.fill('#rsp_prot', '2026000111');
  await expect(page.locator('#rsp_aviso_debito_responsabilidade')).toBeHidden();
  await page.check('.rsp_mot[value="debito_responsabilidade"]');
  await expect(page.locator('#rsp_aviso_debito_responsabilidade')).toContainText('NÃO use só porque o solicitante é parente');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#toastAviso')).toContainText('Confirme que há comprovação');
  await page.check('#rsp_conf');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#out-agenda')).toHaveValue(/TROCA DE TITULARIDADE INDEFERIDA – DÉBITO DE RESPONSABILIDADE DO SOLICITANTE/);
  await expect(page.locator('#out-agenda')).toHaveValue(/os débitos deverão ser quitados ou negociados/);
});

test('nome divergente na Receita sozinho sai como pendência do cliente, não como indeferimento', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.fill('#rsp_prot', '2026000111');
  await page.check('.rsp_mot[value="nome_divergente_receita"]');
  await expect(page.locator('#rsp_aviso_nome_divergente_receita')).toBeVisible();
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  const t = await page.locator('#out-agenda').inputValue();
  expect(t.startsWith('Título: TROCA DE TITULARIDADE NÃO CONCLUÍDA – PENDÊNCIA CADASTRAL')).toBe(true);
  expect(t).not.toContain('INDEFERIDA');
});
