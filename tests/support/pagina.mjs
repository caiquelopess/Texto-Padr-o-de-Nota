import { test as base, expect } from '@playwright/test';

// Abre a página sem internet externa (fontes etc.) e falha o teste em qualquer erro de JavaScript.
export const test = base.extend({
  page: async ({ page }, use) => {
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.route(/^https:\/\//, (r) => r.abort());
    await page.goto('./');
    await page.waitForFunction(() => typeof window.trocarAba === 'function');
    await use(page);
    expect(erros, 'erros de JavaScript na página').toEqual([]);
  },
});
export { expect };

export const abrirServico = (page, id) =>
  page.evaluate((i) => window.trocarAba(i, document.querySelector(`#service_nav .sub-btn[data-click*="'${i}'"]`)), id);

// Preenche todos os campos obrigatórios visíveis com valores fictícios coerentes com o tipo do campo.
export async function preencherObrigatorios(page, sf) {
  await page.evaluate((sf) => {
    for (const el of document.querySelectorAll(`#${sf} input[required], #${sf} textarea[required]`)) {
      if (el.offsetParent === null || el.disabled) continue;
      const id = el.id || '';
      let v = 'Teste';
      if (/tel/.test(id)) v = '71993501519';
      else if (/email/.test(id)) v = 'teste@email.com';
      else if (/cpf|_doc$|cnpj/.test(id)) v = '12345678901';
      else if (/hora/.test(id)) v = '10/11/2026 14:30';
      else if (/dt_|data|venc|_de$|_ate$|inicio|_fim$/.test(id) || /dd\/mm\/aaaa/.test(el.placeholder)) v = '10/11/2026';
      else if (/valor|deb_total|carga|leitura|medidor|numero|qtd|_cc|contrato|nota/.test(id)) v = '123';
      el.value = v;
    }
  }, sf);
}
