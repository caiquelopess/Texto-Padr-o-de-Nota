import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { pBR, pData, pDeBR, pDiasCorridos, pFeriados, pHoje, pIso, pSomarUteis, pUteisAte, pUtil } from '../../src/nucleo/datas.mjs';

describe('datas', () => {
  it('converte entre dd/mm/aaaa e aaaa-mm-dd', () => {
    assert.equal(pDeBR('05/03/2026'), '2026-03-05');
    assert.equal(pDeBR('31/02/2026'), null);
    assert.equal(pDeBR('5/3/2026'), null);
    assert.equal(pDeBR(''), null);
    assert.equal(pBR('2026-03-05'), '05/03/2026');
    assert.equal(pBR(''), '');
    assert.equal(pIso(pData('2026-12-31')), '2026-12-31');
    assert.equal(pDiasCorridos('2026-11-17', '2026-11-20'), 3);
  });
  it('feriados nacionais, 2 de Julho e Sexta-feira Santa', () => {
    const f = pFeriados(2027);
    for (const d of [
      '2027-01-01',
      '2027-04-21',
      '2027-05-01',
      '2027-07-02',
      '2027-09-07',
      '2027-10-12',
      '2027-11-02',
      '2027-11-15',
      '2027-11-20',
      '2027-12-25',
      '2027-03-26',
    ])
      assert.ok(f[d], d);
    assert.equal(f['2027-03-25'], undefined);
    assert.equal(pFeriados(2027), f, 'usa o cache');
    assert.ok(pFeriados(2026)['2026-04-03'], 'Sexta Santa 2026');
  });
  it('dia útil', () => {
    assert.equal(pUtil('2026-11-17'), true);
    assert.equal(pUtil('2026-11-21'), false, 'sábado');
    assert.equal(pUtil('2026-11-22'), false, 'domingo');
    assert.equal(pUtil('2026-11-20'), false, 'feriado');
  });
  it('soma dias úteis', () => {
    assert.equal(pSomarUteis('2026-11-13', 5), '2026-11-23');
    assert.equal(pSomarUteis('2026-11-17', 5), '2026-11-25');
    assert.equal(pSomarUteis('2026-11-17', 0), '2026-11-17');
    assert.equal(pSomarUteis('2027-06-30', 2), '2027-07-05');
  });
  it('dias úteis até o prazo (relativo a hoje)', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 17, 10) });
    try {
      assert.equal(pHoje(), '2026-11-17');
      assert.equal(pUteisAte('2026-11-17'), 0);
      assert.equal(pUteisAte('2026-11-25'), 5);
      assert.equal(pUteisAte('2026-11-16'), -1);
      assert.equal(pUteisAte('2026-11-12'), -3);
      assert.equal(pUteisAte('2026-11-15'), -2, 'prazo no domingo: vencida há segunda e terça');
    } finally {
      mock.timers.reset();
    }
  });
});
