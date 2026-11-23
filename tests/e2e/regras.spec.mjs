import { test, expect } from '../support/pagina.mjs';

// Funções puras usadas pelos geradores (rodam dentro da página).
test('telefone no padrão da nota', async ({ page }) => {
  expect(await page.evaluate(() => window.telefonesPadraoNota('(71) 99350-1519'))).toBe('71-993501519');
  expect(await page.evaluate(() => window.telefonesPadraoNota('71993501519 / 7132345678'))).toBe('71-993501519 / 71-32345678');
});

test('CPF e CNPJ formatados; tamanho errado é recusado', async ({ page }) => {
  expect(await page.evaluate(() => window.declFormatarDoc('12345678901'))).toBe('123.456.789-01');
  expect(await page.evaluate(() => window.declFormatarDoc('12345678000195'))).toBe('12.345.678/0001-95');
  expect(await page.evaluate(() => window.declFormatarDoc('123'))).toBeNull();
});

test('dias úteis pulam fim de semana e feriados (20/11, Sexta Santa, 2 de Julho)', async ({ page }) => {
  const r = await page.evaluate(() => [
    window.pSomarUteis('2026-11-13', 5), window.pSomarUteis('2026-11-17', 5),
    window.pSomarUteis('2027-03-24', 5), window.pSomarUteis('2027-06-30', 2),
  ]);
  expect(r).toEqual(['2026-11-23', '2026-11-25', '2027-04-01', '2027-07-05']);
});

test('nota da Reativação Virtual com e sem leitura', async ({ page }) => {
  expect(await page.evaluate(() => window.notaReativVirtual('123', '456'))).toBe('TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° 123 / LEITURA 456');
  expect(await page.evaluate(() => window.notaReativVirtual('123', ''))).toBe('TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° 123 / NAO INFORMOU LEITURA');
});

test('comparação de versões', async ({ page }) => {
  expect(await page.evaluate(() => [window.compararVersoes('2.10.0', '2.9.3'), window.compararVersoes('2.9.3', '2.9.3'), window.compararVersoes('2.8.1', '2.9.0')])).toEqual([1, 0, -1]);
});
