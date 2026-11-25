import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PERFIS, perfilDe, perfisQuePodeCriar, pode, podeGerenciar } from '../../functions/_lib/permissoes.js';

test('perfil efetivo: gestor, perfil salvo e cadastros antigos', () => {
  assert.equal(perfilDe({ usuario: 'ana.gestora', perfil: 'atendente' }, 'ana.gestora'), 'gestor');
  assert.equal(perfilDe({ usuario: 'b.c', perfil: 'supervisor' }, 'ana.gestora'), 'supervisor');
  assert.equal(perfilDe({ usuario: 'b.c', perfil: 'gestor' }, 'ana.gestora'), 'atendente');
  assert.equal(perfilDe({ usuario: 'b.c', admin: true }, 'ana.gestora'), 'administrador');
  assert.equal(perfilDe({ usuario: 'b.c' }, 'ana.gestora'), 'atendente');
  assert.equal(perfilDe({ usuario: 'b.c', perfil: 'inexistente', admin: true }, 'x'), 'administrador');
  assert.equal(perfilDe(null, 'x'), null);
  assert.equal(Object.keys(PERFIS).length, 5);
});

test('matriz de permissões por perfil', () => {
  for (const op of ['auditoria.ver', 'sugestoes.ver', 'configuracoes.gerenciar', 'modelos.publicar']) assert.ok(pode('gestor', op));
  assert.ok(!pode('administrador', 'auditoria.ver'));
  assert.ok(pode('administrador', 'modelos.publicar'));
  assert.ok(pode('supervisor', 'modelos.editar'));
  assert.ok(!pode('supervisor', 'modelos.publicar'));
  assert.ok(!pode('supervisor', 'formularios.gerenciar'));
  assert.ok(pode('consulta', 'atendimento.usar'));
  assert.ok(pode('consulta', 'painel.ver'));
  assert.ok(!pode('consulta', 'usuarios.gerenciar'));
  assert.ok(!pode('consulta', 'modelos.editar'));
  assert.ok(pode('atendente', 'atendimento.usar'));
  assert.ok(!pode('atendente', 'painel.ver'));
  assert.ok(!pode('atendente', 'operacao.desconhecida'));
});

test('quem pode criar e gerenciar quem', () => {
  assert.deepEqual(perfisQuePodeCriar('supervisor'), ['atendente', 'consulta']);
  assert.deepEqual(perfisQuePodeCriar('atendente'), []);
  assert.deepEqual(perfisQuePodeCriar('consulta'), []);
  assert.ok(podeGerenciar('administrador', 'administrador'));
  assert.ok(podeGerenciar('supervisor', 'atendente'));
  assert.ok(!podeGerenciar('supervisor', 'administrador'));
  assert.ok(!podeGerenciar('supervisor', 'supervisor'));
  assert.ok(!podeGerenciar('administrador', 'gestor'));
  assert.ok(!podeGerenciar('gestor', 'gestor'));
  assert.ok(podeGerenciar('gestor', 'administrador'));
});
