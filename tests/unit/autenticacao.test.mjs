import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  conferirSenha,
  criarSessao,
  DURACAO_SESSAO_MS,
  destinoSeguro,
  gerarHash,
  iguais,
  lerCookie,
  lerSessao,
  normalizarUsuario,
  senhaValida,
  usuarioValido,
} from '../../functions/_lib/autenticacao.js';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

describe('usuário e senha', () => {
  it('normaliza e valida nome.sobrenome', () => {
    assert.equal(normalizarUsuario('  João.Souza '), 'joao.souza');
    assert.equal(normalizarUsuario(undefined), '');
    for (const u of ['maria.silva', 'ana.maria.souza', 'maria.silva2']) assert.ok(usuarioValido(u), u);
    for (const u of ['maria', 'maria silva', 'maria..silva', '.silva', 'maria.', 'maria.silva!', '2maria.silva', `${'a'.repeat(40)}.${'b'.repeat(30)}`])
      assert.ok(!usuarioValido(u), u);
  });
  it('senha: mínimo 4 caracteres, qualquer tipo', () => {
    for (const s of ['1234', 'abcd', '!@#$', 'a1!B']) assert.ok(senhaValida(s), s);
    for (const s of ['123', '', null, 'a\tbc', 'x'.repeat(129)]) assert.ok(!senhaValida(s), String(s));
    assert.ok(senhaValida('x'.repeat(128)));
  });
});

describe('hash de senha', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const reg = await gerarHash('a!b@');
    assert.equal(reg.alg, 'pbkdf2-sha256');
    assert.ok(!JSON.stringify(reg).includes('a!b@'), 'nunca guarda a senha');
    assert.equal(await conferirSenha('a!b@', reg), true);
    assert.equal(await conferirSenha('a!b#', reg), false);
    assert.equal(await conferirSenha('a!b@', null), false);
    assert.equal(await conferirSenha('a!b@', { sal: reg.sal }), false);
  });
  it('sal diferente a cada cadastro', async () => {
    const [a, b] = await Promise.all([gerarHash('1234'), gerarHash('1234')]);
    assert.notEqual(a.hash, b.hash);
  });
  it('comparação de tamanho fixo', () => {
    assert.equal(iguais('abc', 'abc'), true);
    assert.equal(iguais('abc', 'abd'), false);
    assert.equal(iguais('abc', 'abcd'), false);
  });
});

describe('sessão', () => {
  it('assina, lê e expira', async () => {
    const agora = 1_700_000_000_000;
    const t = await criarSessao(SEGREDO, 'maria.silva', 3, agora);
    assert.deepEqual(await lerSessao(SEGREDO, t, agora + 1000), { usuario: 'maria.silva', versaoSenha: 3, expira: agora + DURACAO_SESSAO_MS });
    assert.equal(await lerSessao(SEGREDO, t, agora + DURACAO_SESSAO_MS), null, 'expirada');
    assert.equal(await lerSessao('outro-segredo-com-mais-de-32-caracteres', t, agora), null, 'segredo errado');
  });
  it('recusa sessão adulterada ou malformada', async () => {
    const t = await criarSessao(SEGREDO, 'maria.silva', 1);
    assert.equal(await lerSessao(SEGREDO, t.replace('maria.silva', 'admin.teste')), null);
    assert.equal(await lerSessao(SEGREDO, t.replace('~1~', '~2~')), null);
    assert.equal(await lerSessao(SEGREDO, 'a~b~c'), null);
    assert.equal(await lerSessao(SEGREDO, null), null);
  });
});

describe('cookies e redirecionamento', () => {
  it('lê o cookie certo', () => {
    assert.equal(lerCookie('a=1; __Host-tp_sessao=x%7Ey; b=2', '__Host-tp_sessao'), 'x~y');
    assert.equal(lerCookie('a=1', '__Host-tp_sessao'), null);
    assert.equal(lerCookie(null, 'a'), null);
  });
  it('só volta para caminhos do próprio site', () => {
    assert.equal(destinoSeguro('/teste/?x=1'), '/teste/?x=1');
    for (const d of ['//mal.com', '/\\mal.com', 'https://mal.com', '', null]) assert.equal(destinoSeguro(d), '/', String(d));
  });
});
