import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { declFormatarDoc, formatarTelefones, notaCaps, notaReativVirtual, telefonesPadraoNota, valorReais } from '../../src/nucleo/formatos.mjs';

describe('formatos', () => {
  it('telefones (agenda) com DDD', () => {
    assert.equal(formatarTelefones('71993501519'), '(71) 99350-1519');
    assert.equal(formatarTelefones('7132345678'), '(71) 3234-5678');
    assert.equal(formatarTelefones('71993501519 / 7132345678'), '(71) 99350-1519 / (71) 3234-5678');
    assert.equal(formatarTelefones('71993501519;7132345678'), '(71) 99350-1519 / (71) 3234-5678');
    assert.equal(formatarTelefones('123'), null);
    assert.equal(formatarTelefones(''), null);
  });
  it('telefones no padrão da nota', () => {
    assert.equal(telefonesPadraoNota('(71) 99350-1519'), '71-993501519');
    assert.equal(telefonesPadraoNota('71993501519 / 7132345678'), '71-993501519 / 71-32345678');
    assert.equal(telefonesPadraoNota('12345'), '12345');
    assert.equal(telefonesPadraoNota(''), '');
  });
  it('CPF e CNPJ', () => {
    assert.equal(declFormatarDoc('123.456.789-01'), '123.456.789-01');
    assert.equal(declFormatarDoc('12345678000195'), '12.345.678/0001-95');
    assert.equal(declFormatarDoc('1234567890'), null);
    assert.equal(declFormatarDoc(''), null);
  });
  it('nota em maiúsculas sem espaços duplos', () => {
    assert.equal(notaCaps('  ln  mono  n° 77 '), 'LN MONO N° 77');
    assert.equal(notaCaps(undefined), '');
  });
  it('nota da Reativação Virtual', () => {
    assert.equal(notaReativVirtual('123', '456'), 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° 123 / LEITURA 456');
    assert.equal(notaReativVirtual('123', ''), 'TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° 123 / NAO INFORMOU LEITURA');
  });
  it('valores em reais', () => {
    assert.equal(valorReais('R$ 12.300,50'), 12300.5);
    assert.equal(valorReais('150'), 150);
    assert.equal(valorReais('1500.75'), 1500.75);
    assert.equal(valorReais('abc'), null);
  });
});
