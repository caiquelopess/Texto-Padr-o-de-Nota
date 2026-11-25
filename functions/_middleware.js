// Portaria do site (Cloudflare Pages Functions): nada é entregue sem login.
// Configuração no Cloudflare (Settings → Variables and Secrets / Bindings):
//   USUARIOS       — KV namespace com os usuários (u:<usuario>) e tentativas (t:<usuario>)
//   SEGREDO_SESSAO — segredo aleatório para assinar o cookie de sessão
//   ADMIN_USUARIO  — usuário do administrador (ex.: caique.lopes)
//   ADMIN_SENHA    — senha inicial do administrador (usada só no primeiro acesso)

import { listarAuditoria, registrar } from './_lib/auditoria.js';
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
import { PERFIS, perfilDe, perfisQuePodeCriar, pode, podeGerenciar } from './_lib/permissoes.js';
import { LIMITE_DIA, listarSugestoes, validarSugestao } from './_lib/sugestoes.js';
import { telaAdmin, telaAuditoria, telaFormularios, telaLogin, telaPainel, telaSugestoes, telaTrocarSenha } from './_lib/telas.js';

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

// Gestor geral: o usuário configurado em ADMIN_USUARIO. Só ele lê as sugestões
// e nenhum outro administrador pode removê-lo, desativá-lo ou trocar a senha dele.
const ehGestor = (env, usuario) => usuario === normalizarUsuario(env.ADMIN_USUARIO);

const perfil = (env, reg) => perfilDe(reg, normalizarUsuario(env.ADMIN_USUARIO));
const proibido = (texto = 'Seu perfil não tem acesso a esta área.') =>
  html(`<!doctype html><meta charset="utf-8"><p>${texto}</p><p><a href="/">Voltar ao sistema</a></p>`, 403);

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
    if (reg && tentativas + 1 === MAX_TENTATIVAS) await registrar(env.USUARIOS, usuario, 'Acesso bloqueado por 15 min (senhas erradas)', usuario);
    return falha(reg && !reg.ativo ? 'Usuário desativado. Fale com o responsável.' : 'Usuário ou senha incorretos.');
  }
  await env.USUARIOS.delete(chaveT);
  await registrar(env.USUARIOS, usuario, 'Entrou no sistema', usuario);
  reg.ultimoAcesso = Date.now();
  await gravarUsuario(env, reg);
  const token = await criarSessao(env.SEGREDO_SESSAO, usuario, reg.versaoSenha);
  return redirecionar(destino, { 'set-cookie': cookieSessao(token, DURACAO_SESSAO_MS / 1000) });
}

async function trocarSenha(request, env, reg) {
  const obrigatoria = !!reg.trocarSenha;
  if (request.method !== 'POST') return html(telaTrocarSenha({ usuario: reg.usuario, obrigatoria }));
  const form = await request.formData();
  const [atual, nova, confirma] = ['atual', 'nova', 'confirma'].map((k) => String(form.get(k) || ''));
  const erro = (e) => html(telaTrocarSenha({ usuario: reg.usuario, obrigatoria, erro: e }), 400);
  if (!(await conferirSenha(atual, reg))) return erro('Senha atual incorreta.');
  if (!senhaValida(nova)) return erro('A nova senha precisa ter no mínimo 4 caracteres.');
  if (nova !== confirma) return erro('A confirmação não é igual à nova senha.');
  if (nova === atual) return erro('A nova senha precisa ser diferente da senha atual.');
  Object.assign(reg, await gerarHash(nova), { versaoSenha: reg.versaoSenha + 1 });
  delete reg.trocarSenha;
  await registrar(env.USUARIOS, reg.usuario, obrigatoria ? 'Criou a própria senha (primeiro acesso)' : 'Trocou a própria senha', reg.usuario);
  await gravarUsuario(env, reg);
  const token = await criarSessao(env.SEGREDO_SESSAO, reg.usuario, reg.versaoSenha);
  if (obrigatoria) return redirecionar('/', { 'set-cookie': cookieSessao(token, DURACAO_SESSAO_MS / 1000) });
  return html(telaTrocarSenha({ usuario: reg.usuario, ok: 'Senha alterada.' }), 200, { 'set-cookie': cookieSessao(token, DURACAO_SESSAO_MS / 1000) });
}

async function admin(request, env, reg) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'usuarios.ver')) return proibido();
  const gestor = normalizarUsuario(env.ADMIN_USUARIO);
  const tela = async (msg = {}) =>
    html(
      telaAdmin({
        usuario: reg.usuario,
        gestor,
        perfil: meu,
        criaveis: pode(meu, 'usuarios.gerenciar') ? perfisQuePodeCriar(meu) : [],
        usuarios: (await listarUsuarios(env)).map((u) => ({
          ...u,
          perfil: perfilDe(u, gestor),
          gerenciavel: u.usuario !== reg.usuario && pode(meu, 'usuarios.gerenciar') && podeGerenciar(meu, perfilDe(u, gestor)),
        })),
        ...msg,
      }),
      msg.erro ? 400 : 200,
    );
  if (request.method !== 'POST') return tela();
  if (!pode(meu, 'usuarios.gerenciar')) return proibido('Seu perfil só pode consultar os usuários.');
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  const alvo = normalizarUsuario(form.get('usuario'));
  const senha = String(form.get('senha') || '');
  if (!usuarioValido(alvo)) return tela({ erro: 'Usuário inválido: use o padrão nome.sobrenome (só letras, sem acento; número no fim se houver homônimo).' });
  const existente = await lerUsuario(env, alvo);

  if (acao === 'criar') {
    // compatível com o formulário antigo (caixa "admin")
    const novoPerfil = String(form.get('perfil') || (form.get('admin') === '1' ? 'administrador' : 'atendente'));
    if (existente) return tela({ erro: `O usuário ${alvo} já existe.` });
    if (!perfisQuePodeCriar(meu).includes(novoPerfil)) return tela({ erro: 'Seu perfil não pode criar usuários com esse perfil.' });
    if (!senhaValida(senha)) return tela({ erro: 'A senha provisória precisa ter no mínimo 4 caracteres.' });
    await gravarUsuario(env, {
      usuario: alvo,
      ...(await gerarHash(senha)),
      perfil: novoPerfil,
      admin: novoPerfil === 'administrador',
      ativo: true,
      versaoSenha: 1,
      criado: Date.now(),
      criadoPor: reg.usuario,
      trocarSenha: true,
    });
    await registrar(env.USUARIOS, reg.usuario, `Criou acesso de ${PERFIS[novoPerfil].toLowerCase()}`, alvo);
    return tela({ ok: `Usuário ${alvo} criado.` });
  }
  if (!existente) return tela({ erro: `O usuário ${alvo} não existe.` });
  if (alvo === reg.usuario) return tela({ erro: 'Para a sua própria conta, use "Trocar senha".' });
  if (ehGestor(env, alvo)) return tela({ erro: 'O gestor geral do sistema não pode ser alterado por outros administradores.' });
  const perfilAlvo = perfilDe(existente, gestor);
  if (!podeGerenciar(meu, perfilAlvo)) return tela({ erro: `Seu perfil não pode alterar usuários com perfil ${PERFIS[perfilAlvo]}.` });
  if (acao === 'perfil') {
    const novoPerfil = String(form.get('perfil') || '');
    if (!perfisQuePodeCriar(meu).includes(novoPerfil)) return tela({ erro: 'Seu perfil não pode atribuir esse perfil.' });
    if (novoPerfil === perfilAlvo) return tela({ ok: `O perfil de ${alvo} já é ${PERFIS[novoPerfil]}.` });
    Object.assign(existente, { perfil: novoPerfil, admin: novoPerfil === 'administrador' });
    await gravarUsuario(env, existente);
    await registrar(env.USUARIOS, reg.usuario, `Mudou o perfil: ${PERFIS[perfilAlvo]} → ${PERFIS[novoPerfil]}`, alvo);
    return tela({ ok: `Perfil de ${alvo} alterado para ${PERFIS[novoPerfil]}.` });
  }
  if (acao === 'redefinir') {
    if (!senhaValida(senha)) return tela({ erro: 'A senha provisória precisa ter no mínimo 4 caracteres.' });
    Object.assign(existente, await gerarHash(senha), { versaoSenha: existente.versaoSenha + 1, trocarSenha: true });
    await gravarUsuario(env, existente);
    await env.USUARIOS.delete(`t:${alvo}`);
    await registrar(env.USUARIOS, reg.usuario, 'Redefiniu a senha', alvo);
    return tela({ ok: `Senha de ${alvo} redefinida. As sessões abertas dele foram encerradas.` });
  }
  if (acao === 'desativar' || acao === 'ativar') {
    existente.ativo = acao === 'ativar';
    existente.versaoSenha += 1;
    await gravarUsuario(env, existente);
    await registrar(env.USUARIOS, reg.usuario, existente.ativo ? 'Ativou o acesso' : 'Desativou o acesso', alvo);
    return tela({ ok: `Usuário ${alvo} ${existente.ativo ? 'ativado' : 'desativado'}.` });
  }
  if (acao === 'remover') {
    await env.USUARIOS.delete(`u:${alvo}`);
    await registrar(env.USUARIOS, reg.usuario, 'Removeu o acesso', alvo);
    return tela({ ok: `Usuário ${alvo} removido.` });
  }
  return tela({ erro: 'Ação desconhecida.' });
}

async function painel(env, reg) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'painel.ver')) return proibido();
  const gestor = normalizarUsuario(env.ADMIN_USUARIO);
  const usuarios = await listarUsuarios(env);
  const semana = Date.now() - 7 * 86400000;
  const porPerfil = {};
  for (const u of usuarios) {
    const p = perfilDe(u, gestor);
    porPerfil[p] = (porPerfil[p] || 0) + 1;
  }
  const sugestoes = pode(meu, 'sugestoes.ver') ? (await listarSugestoes(env.USUARIOS)).filter((x) => x.status !== 'concluida').length : null;
  return html(
    telaPainel({
      usuario: reg.usuario,
      perfil: meu,
      numeros: {
        usuarios: usuarios.length,
        ativos: usuarios.filter((u) => u.ativo).length,
        acessaramSemana: usuarios.filter((u) => (u.ultimoAcesso || 0) >= semana).length,
        primeiroAcesso: usuarios.filter((u) => u.trocarSenha).length,
        formularios: (await listarFormularios(env.USUARIOS)).length,
        sugestoes,
      },
      porPerfil,
      recentes: pode(meu, 'auditoria.ver') ? await listarAuditoria(env.USUARIOS, 8) : [],
    }),
  );
}

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...SEGURANCA } });

async function adminFormularios(request, env, reg) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'formularios.ver')) return proibido();
  const tela = async (msg = {}) =>
    html(
      telaFormularios({
        usuario: reg.usuario,
        perfil: meu,
        podeEnviar: pode(meu, 'formularios.gerenciar'),
        formularios: await listarFormularios(env.USUARIOS),
        ...msg,
      }),
      msg.erro ? 400 : 200,
    );
  if (request.method !== 'POST') return tela();
  if (!pode(meu, 'formularios.gerenciar')) return proibido('Seu perfil só pode consultar os formulários.');
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  if (acao === 'remover') {
    const id = String(form.get('id') || '');
    if (!idValido(id)) return tela({ erro: 'Formulário inválido.' });
    const antigo = await env.USUARIOS.get(`f:${id}`, 'json');
    await env.USUARIOS.delete(`f:${id}`);
    await env.USUARIOS.delete(`fa:${id}`);
    if (antigo) await registrar(env.USUARIOS, reg.usuario, 'Removeu o formulário', antigo.nome);
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
  await registrar(env.USUARIOS, reg.usuario, 'Enviou o formulário', nome);
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

async function receberSugestao(request, env, reg) {
  if (request.method !== 'POST') return json({ erro: 'use POST' }, 405);
  let dados;
  try {
    dados = await request.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  const v = validarSugestao(dados);
  if (v.erro) return json({ erro: v.erro }, 400);
  const chaveLimite = `sl:${reg.usuario}:${new Date().toISOString().slice(0, 10)}`;
  const enviadas = Number((await env.USUARIOS.get(chaveLimite)) || 0);
  if (enviadas >= LIMITE_DIA) return json({ erro: 'Limite de sugestões de hoje atingido. Tente amanhã.' }, 429);
  const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await env.USUARIOS.put(`s:${id}`, JSON.stringify({ id, usuario: reg.usuario, tipo: v.tipo, texto: v.texto, criado: Date.now() }));
  await env.USUARIOS.put(chaveLimite, String(enviadas + 1), { expirationTtl: 172800 });
  return json({ ok: true });
}

async function adminSugestoes(request, env, reg) {
  if (!pode(perfil(env, reg), 'sugestoes.ver')) return proibido('Acesso restrito ao gestor geral do sistema.');
  const url = new URL(request.url);
  let ver = url.searchParams.get('ver') === 'concluidas' ? 'concluidas' : 'pendentes';
  let ok = '';
  let erro = '';
  if (request.method === 'POST') {
    const form = await request.formData();
    const id = String(form.get('id') || '');
    const acao = String(form.get('acao') || 'concluir');
    const sug = /^[a-z0-9-]{6,40}$/.test(id) ? await env.USUARIOS.get(`s:${id}`, 'json') : null;
    if (!sug) erro = 'Sugestão não encontrada.';
    else if (acao === 'concluir') {
      Object.assign(sug, { status: 'concluida', concluidaEm: Date.now(), concluidaPor: reg.usuario });
      await env.USUARIOS.put(`s:${id}`, JSON.stringify(sug));
      await registrar(env.USUARIOS, reg.usuario, 'Concluiu a sugestão', `${sug.usuario}: ${sug.texto.slice(0, 60)}`);
      ok = 'Sugestão marcada como concluída. Ela continua na aba "Concluídas".';
    } else if (acao === 'reabrir') {
      sug.status = 'pendente';
      delete sug.concluidaEm;
      delete sug.concluidaPor;
      await env.USUARIOS.put(`s:${id}`, JSON.stringify(sug));
      await registrar(env.USUARIOS, reg.usuario, 'Reabriu a sugestão', `${sug.usuario}: ${sug.texto.slice(0, 60)}`);
      ok = 'Sugestão reaberta.';
      ver = 'pendentes';
    } else if (acao === 'excluir') {
      await env.USUARIOS.delete(`s:${id}`);
      await registrar(env.USUARIOS, reg.usuario, 'Excluiu a sugestão', `${sug.usuario}: ${sug.texto.slice(0, 60)}`);
      ok = 'Sugestão excluída.';
    } else erro = 'Ação desconhecida.';
  }
  const todas = await listarSugestoes(env.USUARIOS);
  const concluidas = todas.filter((s) => s.status === 'concluida');
  const pendentes = todas.filter((s) => s.status !== 'concluida');
  return html(
    telaSugestoes({
      usuario: reg.usuario,
      ver,
      sugestoes: ver === 'concluidas' ? concluidas : pendentes,
      total: { pendentes: pendentes.length, concluidas: concluidas.length },
      ok,
      erro,
    }),
    erro ? 400 : 200,
  );
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
  if (caminho === '/sair') {
    const quem = await sessaoAtual(request, env);
    if (quem) await registrar(env.USUARIOS, quem.usuario, 'Saiu do sistema', quem.usuario);
    return redirecionar('/entrar', { 'set-cookie': cookieSessao('', 0) });
  }

  const reg = await sessaoAtual(request, env);
  if (!reg) {
    // pedidos de fundo (ex.: versao.json) recebem 401; navegação vai para a tela de login
    if (caminho.endsWith('.json') || caminho.startsWith('/api/'))
      return new Response('{"erro":"sem sessao"}', { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    return redirecionar(`/entrar?destino=${encodeURIComponent(caminho + url.search)}`);
  }
  if (caminho === '/trocar-senha') return trocarSenha(request, env, reg);
  // Senha provisória: até criar a própria senha, o usuário só acessa "Trocar senha" e "Sair".
  if (reg.trocarSenha) {
    if (caminho.endsWith('.json') || caminho.startsWith('/api/')) return json({ erro: 'troque a senha provisória' }, 403);
    return redirecionar('/trocar-senha');
  }
  if (caminho === '/admin') return admin(request, env, reg);
  if (caminho === '/admin/painel') return painel(env, reg);
  if (caminho === '/admin/auditoria') {
    if (!pode(perfil(env, reg), 'auditoria.ver')) return proibido('Acesso restrito ao gestor geral do sistema.');
    return html(telaAuditoria({ usuario: reg.usuario, registros: await listarAuditoria(env.USUARIOS) }));
  }
  if (caminho === '/admin/sugestoes') return adminSugestoes(request, env, reg);
  if (caminho === '/api/sugestoes') return receberSugestao(request, env, reg);
  if (caminho === '/admin/formularios') return adminFormularios(request, env, reg);
  if (caminho === '/api/formularios') {
    const lista = await listarFormularios(env.USUARIOS);
    return json(lista.map(({ id, nome, tipo, tamanho }) => ({ id, nome, tipo, tamanho })));
  }
  if (caminho.startsWith('/api/formularios/')) return entregarFormulario(env, caminho.slice(17), url.searchParams.has('baixar'));
  if (caminho === '/api/sessao') {
    return new Response(
      JSON.stringify({ usuario: reg.usuario, perfil: perfil(env, reg), admin: pode(perfil(env, reg), 'painel.ver'), gestor: ehGestor(env, reg.usuario) }),
      {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      },
    );
  }

  const resposta = await next();
  const r = new Response(resposta.body, resposta);
  for (const [k, v] of Object.entries(SEGURANCA)) r.headers.set(k, v);
  r.headers.set('cache-control', 'no-store');
  return r;
}
