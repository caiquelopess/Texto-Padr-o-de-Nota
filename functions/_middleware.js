// Portaria do site (Cloudflare Pages Functions): nada é entregue sem login.
// Configuração no Cloudflare (Settings → Variables and Secrets / Bindings):
//   USUARIOS       — KV namespace com os usuários (u:<usuario>) e tentativas (t:<usuario>)
//   SEGREDO_SESSAO — segredo aleatório para assinar o cookie de sessão
//   ADMIN_USUARIO  — usuário do administrador (ex.: caique.lopes)
//   ADMIN_SENHA    — senha inicial do administrador (usada só no primeiro acesso)
import {
  BLOQUEIO_SEGUNDOS,
  conferirSenha,
  criarSessao,
  DURACAO_SESSAO_MS,
  destinoSeguro,
  gerarHash,
  iguais,
  lerCookie,
  lerSessao,
  MAX_TENTATIVAS,
  normalizarUsuario,
  senhaValida,
  usuarioValido,
} from './_lib/autenticacao.js';
import { idValido, listarFormularios, nomeDoArquivo, nomeValido, TAMANHO_MAXIMO, tipoDoArquivo } from './_lib/formularios.js';
import { telaAdmin, telaFormularios, telaLogin, telaTrocarSenha } from './_lib/telas.js';

const COOKIE = '__Host-tp_sessao';
const SEGURANCA = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000',
};

const html = (corpo, status = 200, extras = {}) =>
  new Response(corpo, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SEGURANCA, ...extras } });
const redirecionar = (local, extras = {}) => new Response(null, { status: 303, headers: { location: local, 'cache-control': 'no-store', ...extras } });
const cookieSessao = (valor, maxAge) => `${COOKIE}=${encodeURIComponent(valor)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const lerUsuario = async (env, u) => (u ? env.USUARIOS.get(`u:${u}`, 'json') : null);
const gravarUsuario = (env, reg) => env.USUARIOS.put(`u:${reg.usuario}`, JSON.stringify(reg));

async function listarUsuarios(env) {
  const lista = [];
  let cursor;
  do {
    const r = await env.USUARIOS.list({ prefix: 'u:', cursor });
    for (const k of r.keys) {
      const reg = await env.USUARIOS.get(k.name, 'json');
      if (reg) lista.push(reg);
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return lista.sort((a, b) => a.usuario.localeCompare(b.usuario));
}

function configurado(env) {
  return env.USUARIOS && env.SEGREDO_SESSAO && env.SEGREDO_SESSAO.length >= 32 && env.ADMIN_USUARIO && env.ADMIN_SENHA;
}

// POST só do próprio site (proteção extra contra envio de formulário a partir de outro site)
function mesmaOrigem(request) {
  const origem = request.headers.get('origin');
  return !origem || origem === new URL(request.url).origin;
}

async function sessaoAtual(request, env) {
  const s = await lerSessao(env.SEGREDO_SESSAO, lerCookie(request.headers.get('cookie'), COOKIE));
  if (!s) return null;
  const reg = await lerUsuario(env, s.usuario);
  if (!reg?.ativo || reg.versaoSenha !== s.versaoSenha) return null;
  return reg;
}

async function entrar(request, env) {
  const form = await request.formData();
  const usuario = normalizarUsuario(form.get('usuario'));
  const senha = String(form.get('senha') || '');
  const destino = destinoSeguro(form.get('destino'));
  const falha = (erro, status = 401) => html(telaLogin({ erro, destino, usuario }), status);

  if (!usuarioValido(usuario) || !senhaValida(senha)) return falha('Usuário ou senha incorretos.');
  const chaveT = `t:${usuario}`;
  const tentativas = Number((await env.USUARIOS.get(chaveT)) || 0);
  if (tentativas >= MAX_TENTATIVAS) return falha('Muitas tentativas erradas. Aguarde 15 minutos ou peça ao responsável para redefinir sua senha.', 429);

  let reg = await lerUsuario(env, usuario);
  // Primeiro acesso do administrador: cria o cadastro a partir da senha inicial configurada no Cloudflare.
  if (!reg && usuario === normalizarUsuario(env.ADMIN_USUARIO) && iguais(senha, String(env.ADMIN_SENHA))) {
    reg = { usuario, ...(await gerarHash(senha)), admin: true, ativo: true, versaoSenha: 1, criado: Date.now() };
    await gravarUsuario(env, reg);
  } else if (!reg?.ativo || !(await conferirSenha(senha, reg))) {
    await env.USUARIOS.put(chaveT, String(tentativas + 1), { expirationTtl: BLOQUEIO_SEGUNDOS });
    return falha(reg && !reg.ativo ? 'Usuário desativado. Fale com o responsável.' : 'Usuário ou senha incorretos.');
  }
  await env.USUARIOS.delete(chaveT);
  reg.ultimoAcesso = Date.now();
  await gravarUsuario(env, reg);
  const token = await criarSessao(env.SEGREDO_SESSAO, usuario, reg.versaoSenha);
  return redirecionar(destino, { 'set-cookie': cookieSessao(token, DURACAO_SESSAO_MS / 1000) });
}

async function trocarSenha(request, env, reg) {
  if (request.method !== 'POST') return html(telaTrocarSenha({ usuario: reg.usuario }));
  const form = await request.formData();
  const [atual, nova, confirma] = ['atual', 'nova', 'confirma'].map((k) => String(form.get(k) || ''));
  const erro = (e) => html(telaTrocarSenha({ usuario: reg.usuario, erro: e }), 400);
  if (!(await conferirSenha(atual, reg))) return erro('Senha atual incorreta.');
  if (!senhaValida(nova)) return erro('A nova senha precisa ter no mínimo 4 caracteres.');
  if (nova !== confirma) return erro('A confirmação não é igual à nova senha.');
  Object.assign(reg, await gerarHash(nova), { versaoSenha: reg.versaoSenha + 1 });
  await gravarUsuario(env, reg);
  const token = await criarSessao(env.SEGREDO_SESSAO, reg.usuario, reg.versaoSenha);
  return html(telaTrocarSenha({ usuario: reg.usuario, ok: 'Senha alterada.' }), 200, { 'set-cookie': cookieSessao(token, DURACAO_SESSAO_MS / 1000) });
}

async function admin(request, env, reg) {
  if (!reg.admin) return html('<!doctype html><meta charset="utf-8"><p>Acesso restrito ao responsável.</p>', 403);
  const tela = async (msg = {}) => html(telaAdmin({ usuario: reg.usuario, usuarios: await listarUsuarios(env), ...msg }), msg.erro ? 400 : 200);
  if (request.method !== 'POST') return tela();
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  const alvo = normalizarUsuario(form.get('usuario'));
  const senha = String(form.get('senha') || '');
  if (!usuarioValido(alvo)) return tela({ erro: 'Usuário inválido: use o padrão nome.sobrenome (só letras, sem acento; número no fim se houver homônimo).' });
  const existente = await lerUsuario(env, alvo);

  if (acao === 'criar') {
    if (existente) return tela({ erro: `O usuário ${alvo} já existe.` });
    if (!senhaValida(senha)) return tela({ erro: 'A senha provisória precisa ter no mínimo 4 caracteres.' });
    await gravarUsuario(env, { usuario: alvo, ...(await gerarHash(senha)), admin: form.get('admin') === '1', ativo: true, versaoSenha: 1, criado: Date.now() });
    return tela({ ok: `Usuário ${alvo} criado.` });
  }
  if (!existente) return tela({ erro: `O usuário ${alvo} não existe.` });
  if (alvo === reg.usuario) return tela({ erro: 'Para a sua própria conta, use "Trocar senha".' });
  if (acao === 'redefinir') {
    if (!senhaValida(senha)) return tela({ erro: 'A senha provisória precisa ter no mínimo 4 caracteres.' });
    Object.assign(existente, await gerarHash(senha), { versaoSenha: existente.versaoSenha + 1 });
    await gravarUsuario(env, existente);
    await env.USUARIOS.delete(`t:${alvo}`);
    return tela({ ok: `Senha de ${alvo} redefinida. As sessões abertas dele foram encerradas.` });
  }
  if (acao === 'desativar' || acao === 'ativar') {
    existente.ativo = acao === 'ativar';
    existente.versaoSenha += 1;
    await gravarUsuario(env, existente);
    return tela({ ok: `Usuário ${alvo} ${existente.ativo ? 'ativado' : 'desativado'}.` });
  }
  if (acao === 'remover') {
    await env.USUARIOS.delete(`u:${alvo}`);
    return tela({ ok: `Usuário ${alvo} removido.` });
  }
  return tela({ erro: 'Ação desconhecida.' });
}

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...SEGURANCA } });

async function adminFormularios(request, env, reg) {
  if (!reg.admin) return html('<!doctype html><meta charset="utf-8"><p>Acesso restrito ao responsável.</p>', 403);
  const tela = async (msg = {}) =>
    html(telaFormularios({ usuario: reg.usuario, formularios: await listarFormularios(env.USUARIOS), ...msg }), msg.erro ? 400 : 200);
  if (request.method !== 'POST') return tela();
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  if (acao === 'remover') {
    const id = String(form.get('id') || '');
    if (!idValido(id)) return tela({ erro: 'Formulário inválido.' });
    await env.USUARIOS.delete(`f:${id}`);
    await env.USUARIOS.delete(`fa:${id}`);
    return tela({ ok: 'Formulário removido.' });
  }
  if (acao !== 'enviar') return tela({ erro: 'Ação desconhecida.' });
  const nome = nomeValido(form.get('nome'));
  const arquivo = form.get('arquivo');
  if (!nome) return tela({ erro: 'Dê um nome ao formulário (2 a 120 caracteres).' });
  if (!arquivo || typeof arquivo === 'string' || !arquivo.size) return tela({ erro: 'Escolha o arquivo.' });
  if (arquivo.size > TAMANHO_MAXIMO) return tela({ erro: 'O arquivo passa de 10 MB.' });
  const bytes = await arquivo.arrayBuffer();
  const tipo = tipoDoArquivo(bytes);
  if (!tipo) return tela({ erro: 'Só são aceitos PDF, PNG ou JPG.' });
  const id = crypto.randomUUID();
  await env.USUARIOS.put(`fa:${id}`, bytes);
  await env.USUARIOS.put(`f:${id}`, JSON.stringify({ id, nome, tipo, tamanho: bytes.byteLength, criado: Date.now(), por: reg.usuario }));
  return tela({ ok: `Formulário "${nome}" enviado.` });
}

async function entregarFormulario(env, id, baixar) {
  if (!idValido(id)) return json({ erro: 'não encontrado' }, 404);
  const meta = await env.USUARIOS.get(`f:${id}`, 'json');
  const bytes = meta && (await env.USUARIOS.get(`fa:${id}`, 'arrayBuffer'));
  if (!bytes) return json({ erro: 'não encontrado' }, 404);
  return new Response(bytes, {
    headers: {
      ...SEGURANCA,
      // a prévia abre dentro do próprio site (iframe), então aqui o site pode emoldurar
      'x-frame-options': 'SAMEORIGIN',
      'content-type': meta.tipo,
      'content-disposition': `${baixar ? 'attachment' : 'inline'}; filename="${nomeDoArquivo(meta.nome, meta.tipo)}"`,
      'cache-control': 'private, max-age=300',
    },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const caminho = url.pathname;

  if (!configurado(env)) {
    return html(
      '<!doctype html><meta charset="utf-8"><p>Login ainda não configurado no Cloudflare (USUARIOS, SEGREDO_SESSAO, ADMIN_USUARIO, ADMIN_SENHA).</p>',
      503,
    );
  }
  if (request.method === 'POST' && !mesmaOrigem(request)) return html('Origem não permitida.', 403);

  if (caminho === '/entrar') {
    if (request.method === 'POST') return entrar(request, env);
    return html(telaLogin({ destino: destinoSeguro(url.searchParams.get('destino')) }));
  }
  if (caminho === '/sair') return redirecionar('/entrar', { 'set-cookie': cookieSessao('', 0) });

  const reg = await sessaoAtual(request, env);
  if (!reg) {
    // pedidos de fundo (ex.: versao.json) recebem 401; navegação vai para a tela de login
    if (caminho.endsWith('.json') || caminho.startsWith('/api/'))
      return new Response('{"erro":"sem sessao"}', { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    return redirecionar(`/entrar?destino=${encodeURIComponent(caminho + url.search)}`);
  }
  if (caminho === '/trocar-senha') return trocarSenha(request, env, reg);
  if (caminho === '/admin') return admin(request, env, reg);
  if (caminho === '/admin/formularios') return adminFormularios(request, env, reg);
  if (caminho === '/api/formularios') {
    const lista = await listarFormularios(env.USUARIOS);
    return json(lista.map(({ id, nome, tipo, tamanho }) => ({ id, nome, tipo, tamanho })));
  }
  if (caminho.startsWith('/api/formularios/')) return entregarFormulario(env, caminho.slice(17), url.searchParams.has('baixar'));
  if (caminho === '/api/sessao') {
    return new Response(JSON.stringify({ usuario: reg.usuario, admin: !!reg.admin }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  const resposta = await next();
  const r = new Response(resposta.body, resposta);
  for (const [k, v] of Object.entries(SEGURANCA)) r.headers.set(k, v);
  r.headers.set('cache-control', 'no-store');
  return r;
}
