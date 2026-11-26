import { expect, test } from '../support/pagina.mjs';

// Respostas da Análise de Isenção (Texto Padrão Lojas): serviço próprio e resposta da pendência.
// Dados fictícios.
const CABECALHO = 'Caro Cliente, a Neoenergia Coelba informa:\n\nSeu protocolo de atendimento é: 2026000111.';

test('serviço: um motivo sai com o texto padrão', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.selectOption('#rsp_res', 'Indeferido');
  await page.fill('#rsp_prot', '2026000111');
  await page.check('.rsp_mot[value="processo_fraude"]');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#out-agenda')).toHaveValue(
    `Título: TROCA DE TITULARIDADE INDEFERIDA – PROCESSO DE FRAUDE\n\n${CABECALHO}\n\nInformamos que após análise, verificamos que existe um processo de emissão de fatura de cobrança de fraude/irregularidade em andamento, portanto, o seu pedido não pôde ser realizado.\n\nSolicitamos que a troca de titularidade seja solicitada após a conclusão/emissão da fatura de fraude ou irregularidade para que possamos prosseguir com a sua Troca de Titularidade.`,
  );
});

test('serviço: vários motivos são combinados e o documento é pedido', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.selectOption('#rsp_res', 'Indeferido');
  await page.selectOption('#rsp_serv', 'Reativação');
  await page.fill('#rsp_prot', '2026000111');
  await expect(page.locator('#rsp_doc_box')).toBeHidden();
  await page.check('.rsp_mot[value="documentacao_incompleta"]');
  await page.check('.rsp_mot[value="cpf_invalido"]');
  await expect(page.locator('#rsp_doc_box')).toBeVisible();
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#toastAviso')).toContainText('Informe qual documento não foi identificado.');
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
  await expect(page.locator(`#${px}aviso_end`)).toBeVisible();
  await page.locator('#painel_pend button', { hasText: 'Confirmar e copiar resposta' }).click();
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

test('deferimento parcial pede o período/valor isento', async ({ page }) => {
  await page.evaluate(() => window.trocarAba('sf-resposta-isencao', document.querySelector(`[data-click*="'sf-resposta-isencao'"]`)));
  await page.fill('#rsp_prot', '2026000111');
  await expect(page.locator('#rsp_ind_box')).toBeHidden();
  await page.selectOption('#rsp_def', 'parcial');
  await page.fill('#rsp_det', 'faturas de 01/2025 a 03/2025');
  await page.locator('#sf-resposta-isencao > .actions .btn:not(.btn-clear)').click();
  await expect(page.locator('#out-agenda')).toHaveValue(
    `Título: TROCA DE TITULARIDADE – ISENÇÃO DE DÉBITOS DEFERIDA PARCIALMENTE\n\n${CABECALHO}\n\nInformamos que após análise, a sua solicitação de isenção de débitos foi deferida parcialmente. Período/valor isento: faturas de 01/2025 a 03/2025. Os demais débitos permanecem sob responsabilidade do(a) solicitante para que o seu pedido de Troca de Titularidade possa seguir.`,
  );
});
