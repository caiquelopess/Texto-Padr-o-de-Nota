import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  avisoVigente,
  configuracoesDoFormulario,
  lerConfiguracoes,
  PADRAO,
  salvarConfiguracoes,
  validarConfiguracoes,
} from '../../functions/_lib/configuracoes.js';

test('validação das configurações', () => {
  assert.deepEqual(validarConfiguracoes(PADRAO), []);
  assert.deepEqual(validarConfiguracoes({ avisoTexto: 'x'.repeat(301), avisoTipo: 'grito', avisoAte: '25/11/2026', sessaoHoras: 0, sugestoesDia: 101 }), [
    'O aviso geral pode ter até 300 caracteres.',
    'Tipo de aviso inválido.',
    'Data final do aviso inválida.',
    'A sessão deve durar de 1 a 24 horas.',
    'Limite de sugestões por dia: de 0 a 100.',
  ]);
  assert.deepEqual(validarConfiguracoes({ ...PADRAO, sessaoHoras: 24, sugestoesDia: 0 }), []);
  assert.ok(validarConfiguracoes({ ...PADRAO, sessaoHoras: 25 }).length === 1);
  assert.ok(validarConfiguracoes({ ...PADRAO, sessaoHoras: 2.5 }).length === 1);
  assert.ok(validarConfiguracoes({ ...PADRAO, sugestoesDia: -1 }).length === 1);
});

test('formulário e aviso vigente', () => {
  const f = new FormData();
  f.append('avisoTexto', '  Sistema SAP fora do ar até 14h  ');
  f.append('avisoTipo', 'alerta');
  f.append('avisoAte', '2026-11-30');
  f.append('sessaoHoras', '8');
  f.append('sugestoesDia', '5');
  const c = configuracoesDoFormulario(f);
  assert.deepEqual(c, { avisoTexto: 'Sistema SAP fora do ar até 14h', avisoTipo: 'alerta', avisoAte: '2026-11-30', sessaoHoras: 8, sugestoesDia: 5 });
  assert.deepEqual(avisoVigente(c, '2026-11-30'), { texto: 'Sistema SAP fora do ar até 14h', tipo: 'alerta' });
  assert.equal(avisoVigente(c, '2026-12-01'), null);
  assert.deepEqual(avisoVigente({ ...c, avisoAte: '' }, '2030-01-01'), { texto: 'Sistema SAP fora do ar até 14h', tipo: 'alerta' });
  assert.equal(avisoVigente(PADRAO, '2026-11-25'), null);
  assert.equal(avisoVigente(null, '2026-11-25'), null);
  assert.equal(configuracoesDoFormulario(new FormData()).avisoTipo, 'info');
});

test('salvar com controle de conflito', async () => {
  const mapa = new Map();
  const kv = { get: async (k) => (mapa.has(k) ? JSON.parse(mapa.get(k)) : null), put: async (k, v) => mapa.set(k, v) };
  assert.equal((await lerConfiguracoes(kv)).sessaoHoras, 12);
  assert.equal(await salvarConfiguracoes(kv, 0, { ...PADRAO, sessaoHoras: 8 }, 'ana.gestora'), true);
  const lido = await lerConfiguracoes(kv);
  assert.equal(lido.sessaoHoras, 8);
  assert.equal(lido.revisao, 1);
  assert.equal(lido.alteradoPor, 'ana.gestora');
  assert.equal(await salvarConfiguracoes(kv, 0, { ...PADRAO }, 'outro'), false); // alguém salvou antes
});
