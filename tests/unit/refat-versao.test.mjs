import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcDias, calcLerData, calcLerNumero } from '../../src/nucleo/refat.mjs';
import { compararVersoes } from '../../src/nucleo/versao.mjs';

describe('refaturamento', () => {
  it('lê números de leitura', () => {
    assert.equal(calcLerNumero('1.234'), 1234);
    assert.equal(calcLerNumero('1234,5'), 1234.5);
    assert.equal(calcLerNumero(' 99999 '), 99999);
    assert.equal(calcLerNumero(''), null);
    assert.ok(Number.isNaN(calcLerNumero('12a')));
  });
  it('lê datas e conta dias', () => {
    const a = calcLerData('09/04/2025'),
      b = calcLerData('05/08/2025');
    assert.equal(calcDias(a, b), 118);
    assert.equal(calcLerData('31/02/2025'), null);
    assert.equal(calcLerData('2025-04-09'), null);
  });
});

describe('versão', () => {
  it('compara números de versão', () => {
    assert.equal(compararVersoes('2.10.0', '2.9.3'), 1);
    assert.equal(compararVersoes('2.9.3', '2.9.3'), 0);
    assert.equal(compararVersoes('2.8.1', '2.9.0'), -1);
    assert.equal(compararVersoes('3', '2.99.99'), 1);
    assert.equal(compararVersoes('2.9', '2.9.0'), 0);
  });
});

describe('refaturamento — casos de borda', () => {
  it('números', () => {
    assert.equal(calcLerNumero('1 234'), 1234, 'espaços internos');
    assert.equal(calcLerNumero('1.234.567'), 1234567, 'milhar com pontos');
    assert.equal(calcLerNumero('1.234,56'), 1234.56);
    assert.equal(calcLerNumero('-15'), -15);
    assert.equal(calcLerNumero('12.5'), 12.5, 'ponto decimal sem milhar');
    assert.ok(Number.isNaN(calcLerNumero('1234.')), 'ponto solto no fim');
    assert.ok(Number.isNaN(calcLerNumero('1.2.3,4,5')));
    assert.ok(Number.isNaN(calcLerNumero('--1')));
    assert.equal(calcLerNumero(null), null);
    assert.equal(calcLerNumero('   '), null);
  });
  it('datas', () => {
    assert.deepEqual(calcLerData('9/4/2025'), new Date(Date.UTC(2025, 3, 9)), 'dia e mês com 1 dígito');
    assert.deepEqual(calcLerData(' 09 / 04 / 2025 '), new Date(Date.UTC(2025, 3, 9)), 'espaços');
    assert.equal(calcLerData('09/13/2025'), null, 'mês 13');
    assert.equal(calcLerData('00/04/2025'), null, 'dia 0');
    assert.equal(calcLerData('09/04/25'), null, 'ano com 2 dígitos');
    assert.equal(calcLerData('x09/04/2025'), null);
    assert.equal(calcLerData('09/04/2025x'), null);
    assert.equal(calcLerData(undefined), null);
    assert.equal(calcLerData('29/02/2024').getUTCDate(), 29, 'ano bissexto');
  });
  it('dias entre datas', () => {
    assert.equal(calcDias(calcLerData('01/01/2025'), calcLerData('01/01/2026')), 365);
    assert.equal(calcDias(calcLerData('10/01/2025'), calcLerData('01/01/2025')), -9);
  });
});
