import { abrirServico, expect, test } from '../support/pagina.mjs';

// Conta Paga e Não Baixada: faturas em linhas (vencimento e valor), como na Reclamação. Dados fictícios.
const DADOS = {
  cpnb_solic: 'Maria',
  cpnb_motivo: 'Paga e não baixada',
  cpnb_ref: 'Mercado',
  cpnb_tel: '71993501519',
  cpnb_email: 'm@e.com',
  cpnb_neg: 'Não',
};
const linhas = (page) => page.locator('#cpnb_fatura .fatura-row');

async function preencher(page) {
  await abrirServico(page, 'sf-cpnb');
  await page.evaluate(() => window.limparForm('sf-cpnb'));
  for (const [id, v] of Object.entries(DADOS)) await page.locator(`#${id}`).fill(v);
}
const gerar = (page) => page.locator('#sf-cpnb > .actions .btn:not(.btn-clear):not(.btn-edit)').first().click();

test('duas faturas saem no texto como na Reclamação', async ({ page }) => {
  await preencher(page);
  await expect(linhas(page)).toHaveCount(1);
  await linhas(page)
    .nth(0)
    .locator('.md-fat-venc')
    .evaluate((e) => (e.value = '1/2/2026'));
  await linhas(page).nth(0).locator('.md-fat-valor').fill('150,00');
  await page.locator('#sf-cpnb .btn-add').click();
  await linhas(page).nth(1).locator('.md-fat-venc').fill('05032026');
  await expect(linhas(page).nth(1).locator('.md-fat-venc')).toHaveValue('05/03/2026'); // máscara de data
  await linhas(page).nth(1).locator('.md-fat-valor').fill('89,90');
  await gerar(page);
  await expect(page.locator('#out-nota')).toHaveValue(
    'Solicitante: Maria\nMotivo : Paga e não baixada\nFatura (vencimento e valor) : vencimento 01/02/2026 R$ 150,00; vencimento 05/03/2026 R$ 89,90\nPontos de Referência : Mercado\nTelefone : (71) 99350-1519\nE-mail: : m@e.com\nInforme se o cliente está negativado: Não\nSe houver reclamação anterior, informe o n° da reclamação anterior : N/A\nModalidade de resposta: E-mail\nPrazo que deverá informado e verbalizado ao cliente é de 5 dias úteis para uma primeira análise.',
  );
  // o vencimento digitado sem zero é corrigido no campo
  await expect(linhas(page).nth(0).locator('.md-fat-venc')).toHaveValue('01/02/2026');
});

test('fatura obrigatória, vencimento inválido barrado, remover e limpar', async ({ page }) => {
  await preencher(page);
  await gerar(page);
  await expect(page.locator('#toastAviso')).toContainText('Preencha o campo: Fatura (vencimento e valor) :');
  await linhas(page).nth(0).locator('.md-fat-venc').fill('31022026');
  await linhas(page).nth(0).locator('.md-fat-valor').fill('10,00');
  await gerar(page);
  await expect(page.locator('#toastAviso')).toContainText('O vencimento da fatura deve ser uma data real, no formato dd/mm/aaaa.');
  // remover: com uma linha só, o ✕ apenas limpa
  await page.locator('#sf-cpnb .btn-add').click();
  await expect(linhas(page)).toHaveCount(2);
  await linhas(page).nth(1).locator('.btn-del').click();
  await expect(linhas(page)).toHaveCount(1);
  await linhas(page).nth(0).locator('.btn-del').click();
  await expect(linhas(page)).toHaveCount(1);
  await expect(linhas(page).nth(0).locator('.md-fat-valor')).toHaveValue('');
  // limpar tudo volta para uma linha vazia
  await page.locator('#sf-cpnb .btn-add').click();
  await page.evaluate(() => window.limparForm('sf-cpnb'));
  await expect(linhas(page)).toHaveCount(1);
});
