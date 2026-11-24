import { readFileSync } from 'node:fs';
import { expect, test } from '../support/pagina.mjs';

const PDF = readFileSync(new URL('../support/formulario-exemplo.pdf', import.meta.url));
// PDF.js vem do cdnjs no site; no teste é servido a partir do node_modules
const pdfjsLocal = (page) =>
  page.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/*', (r) =>
    r.fulfill({ path: `node_modules/pdfjs-dist/build/${r.request().url().split('/').pop()}`, contentType: 'text/javascript' }),
  );
const LISTA = [
  { id: '11111111-1111-4111-8111-111111111111', nome: 'Declaração de Residência', tipo: 'application/pdf', tamanho: PDF.length },
  { id: '22222222-2222-4222-8222-222222222222', nome: 'Procuração Simples', tipo: 'application/pdf', tamanho: PDF.length },
];

test('sem login (endereço de teste) a aba explica onde encontrar', async ({ page }) => {
  await page.click('[data-aba="form"]');
  await expect(page.locator('#titulo_principal')).toHaveText('Formulários');
  await expect(page.locator('#form_lista')).toContainText('disponíveis no endereço com login');
});

test('busca pelo nome (sem acento) e mostra a prévia', async ({ page }) => {
  await page.route('**/api/formularios', (r) => r.fulfill({ json: LISTA }));
  await page.route('**/api/formularios/*', (r) => r.fulfill({ body: PDF, contentType: 'application/pdf' }));
  await pdfjsLocal(page);
  await page.click('[data-aba="form"]');
  await expect(page.locator('#form_lista .form-item')).toHaveCount(2);
  await page.fill('#busca_form', 'declaracao');
  await expect(page.locator('#form_lista .form-item')).toHaveCount(1);
  // único resultado já abre a prévia
  // o PDF é desenhado como imagem (funciona em qualquer navegador, inclusive celular)
  await expect(page.locator('#form_previa canvas')).toHaveCount(1);
  await expect(page.locator('#form_previa .btn-clear')).toHaveAttribute('href', `/api/formularios/${LISTA[0].id}?baixar=1`);
  await expect(page.locator('#btn_form_imprimir')).toBeVisible();
  await page.fill('#busca_form', 'xyz');
  await expect(page.locator('#form_lista')).toContainText('Nenhum formulário com esse nome');
});

test('sem acesso ao PDF.js, a prévia usa o leitor do navegador', async ({ page }) => {
  await page.route('**/api/formularios', (r) => r.fulfill({ json: LISTA }));
  await page.route('**/api/formularios/*', (r) => r.fulfill({ body: PDF, contentType: 'application/pdf' }));
  await page.click('[data-aba="form"]');
  await page.fill('#busca_form', 'procuracao');
  await expect(page.locator('#form_previa iframe')).toHaveAttribute('src', `/api/formularios/${LISTA[1].id}`);
});
