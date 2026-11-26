// Portaria do site (Cloudflare Pages Functions): nada é entregue sem login.
// Configuração no Cloudflare (Settings → Variables and Secrets / Bindings):
//   USUARIOS       — KV namespace com os usuários (u:<usuario>) e tentativas (t:<usuario>)
//   SEGREDO_SESSAO — segredo aleatório para assinar o cookie de sessão
//   ADMIN_USUARIO  — usuário do administrador (ex.: caique.lopes)
//   ADMIN_SENHA    — senha inicial do administrador (usada só no primeiro acesso)

import { mdTestarModelo, mdValidarModelo } from '../src/nucleo/modelos.mjs';
import { atendimentoDoFormulario, documentoPadrao, resumoAtendimento, validarAtendimento } from './_lib/atendimento-regras.js';
import { listarAuditoria, registrar } from './_lib/auditoria.js';
import {
  BLOQUEIO_SEGUNDOS,
  conferirSenha,
  criarSessao,
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
import { backupDiarioSeNecessario, criarBackup, lerBackup, listarBackups, restaurarBackup, validarConteudo } from './_lib/backups.js';
import {
  atendimentoPublicado,
  criarModelo,
  garantirEsquema,
  lerAtendimento,
  lerModelo,
  lerVersao,
  lerVersaoAtendimento,
  listarModelos,
  listarVersoes,
  listarVersoesAtendimento,
  modelosPublicados,
  mudarArquivamento,
  publicar,
  publicarAtendimento,
  salvarAtendimento,
  salvarRascunho,
} from './_lib/banco.js';
import { avisoVigente, configuracoesDoFormulario, lerConfiguracoes, salvarConfiguracoes, validarConfiguracoes } from './_lib/configuracoes.js';
import { idValido, listarFormularios, nomeDoArquivo, nomeValido, TAMANHO_MAXIMO, tipoDoArquivo } from './_lib/formularios.js';
import { modeloDoFormulario } from './_lib/modelos-form.js';
import { PERFIS, perfilDe, perfisQuePodeCriar, pode, podeGerenciar } from './_lib/permissoes.js';
import { MODELOS_SISTEMA, SERVICOS_EMBUTIDOS } from './_lib/servicos-embutidos.js';
import { listarSugestoes, validarSugestao } from './_lib/sugestoes.js';
import { telaAdmin, telaAuditoria, telaFormularios, telaLogin, telaPainel, telaSugestoes, telaTrocarSenha } from './_lib/telas.js';
import {
  SCRIPTS_ATIVOS,
  telaAtendimento,
  telaBackups,
  telaComparar,
  telaCompararTexto,
  telaConfiguracoes,
  telaEditorModelo,
  telaModelos,
  telaSemBanco,
} from './_lib/telas-modelos.js';

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
// Sessão com a duração definida nas configurações gerais.
async function novaSessao(env, reg) {
  const cfg = await lerConfiguracoes(env.USUARIOS);
  const ms = cfg.sessaoHoras * 3600 * 1000;
  return { token: await criarSessao(env.SEGREDO_SESSAO, reg.usuario, reg.versaoSenha, Date.now(), ms), segundos: ms / 1000 };
}
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
  const s = await novaSessao(env, reg);
  return redirecionar(destino, { 'set-cookie': cookieSessao(s.token, s.segundos) });
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
  const sessao = await novaSessao(env, reg);
  if (obrigatoria) return redirecionar('/', { 'set-cookie': cookieSessao(sessao.token, sessao.segundos) });
  return html(telaTrocarSenha({ usuario: reg.usuario, ok: 'Senha alterada.' }), 200, { 'set-cookie': cookieSessao(sessao.token, sessao.segundos) });
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
  if (enviadas >= (await lerConfiguracoes(env.USUARIOS)).sugestoesDia) return json({ erro: 'Limite de sugestões de hoje atingido. Tente amanhã.' }, 429);
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

// ---- Modelos de texto (D1) ----
async function categoriasEmUso(db) {
  const doc = (await atendimentoPublicado(db)) || documentoPadrao();
  return doc.categorias.map((c) => c.nome);
}

async function adminModelos(request, env, reg, url) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'modelos.ver')) return proibido();
  if (!env.BANCO) return html(telaSemBanco({ usuario: reg.usuario, perfil: meu }));
  const db = env.BANCO;
  await garantirEsquema(db);
  const ctx = { usuario: reg.usuario, perfil: meu };
  const lista = async (msg = {}) =>
    html(
      telaModelos({
        ...ctx,
        categorias: await categoriasEmUso(db),
        modelos: await listarModelos(db),
        filtro: url.searchParams.get('status') || 'todos',
        ...msg,
      }),
      msg.erro ? 400 : 200,
    );
  if (request.method !== 'POST') return lista();
  if (!pode(meu, 'modelos.editar')) return proibido('Seu perfil só pode consultar os modelos.');
  const form = await request.formData();
  const id = String(form.get('id') || '').trim();
  if (form.get('acao') === 'personalizar') {
    // cópia em rascunho do modelo do sistema, com todas as configurações; os atendentes
    // continuam no original até a cópia ser publicada (arquivar a cópia volta ao original)
    const original = MODELOS_SISTEMA.find((m) => m.id === id);
    if (!original) return lista({ erro: 'Modelo do sistema não encontrado.' });
    if (!(await criarModelo(db, structuredClone(original), reg.usuario)))
      return lista({ erro: `Este modelo já foi personalizado: abra ${original.nome} na lista acima.` });
    await registrar(env.USUARIOS, reg.usuario, 'Personalizou o modelo do sistema (rascunho)', id);
    return redirecionar(`/admin/modelos/${id}`);
  }
  const novo = {
    id,
    nome: String(form.get('nome') || '').trim(),
    categoria: String(form.get('categoria') || '').trim(),
    descricao: '',
    avisos: [],
    copiar: 'nota',
    campos: [],
    nota: '',
    agenda: '',
  };
  const erros = mdValidarModelo({ ...novo, nota: '-' });
  if (erros.length) return lista({ erro: erros[0] });
  if (MODELOS_SISTEMA.some((m) => m.id === id)) return lista({ erro: `${id} é um modelo do sistema: use "Personalizar" na lista de modelos do sistema.` });
  if (!(await criarModelo(db, novo, reg.usuario))) return lista({ erro: `Já existe um modelo com o identificador ${id}.` });
  await registrar(env.USUARIOS, reg.usuario, 'Criou o modelo (rascunho)', id);
  return redirecionar(`/admin/modelos/${id}`);
}

async function adminModelo(request, env, reg, id, url) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'modelos.ver')) return proibido();
  if (!env.BANCO) return html(telaSemBanco({ usuario: reg.usuario, perfil: meu }));
  const db = env.BANCO;
  await garantirEsquema(db);
  const ctx = { usuario: reg.usuario, perfil: meu };
  let registro = await lerModelo(db, id);
  if (!registro) return html('<!doctype html><meta charset="utf-8"><p>Modelo não encontrado.</p><p><a href="/admin/modelos">Voltar</a></p>', 404);
  const tela = async (msg = {}) =>
    html(
      telaEditorModelo({ ...ctx, categorias: await categoriasEmUso(db), registro: msg.registro || registro, versoes: await listarVersoes(db, id), ...msg }),
      msg.erro || msg.problemas?.length ? 400 : 200,
    );

  if (url.pathname.endsWith('/comparar')) {
    const lado = async (v) =>
      v === 'rascunho' ? { rotulo: 'rascunho', m: registro.rascunho } : { rotulo: `v${v}`, m: (await lerVersao(db, id, Number(v)))?.conteudo };
    const a = await lado(url.searchParams.get('a'));
    const b = await lado(url.searchParams.get('b') || 'rascunho');
    if (!a.m || !b.m) return tela({ erro: 'Versão não encontrada ou com falha de integridade.' });
    return html(telaComparar({ ...ctx, id, rotuloA: a.rotulo, rotuloB: b.rotulo, a: a.m, b: b.m }));
  }
  if (request.method !== 'POST') return tela();
  if (!pode(meu, 'modelos.editar')) return proibido('Seu perfil só pode consultar os modelos.');
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  const revisao = Number(form.get('revisao'));
  const conflito = 'Outro administrador alterou este modelo enquanto você editava. Suas mudanças não foram salvas: recarregue a página e confira.';
  const exigePublicar = ['publicar', 'republicar', 'arquivar', 'desarquivar'].includes(acao);
  if (exigePublicar && !pode(meu, 'modelos.publicar')) return proibido('Seu perfil pode editar rascunhos, mas a publicação é feita por um administrador.');

  if (acao === 'salvar' || acao === 'testar' || acao === 'enviar' || acao === 'publicar') {
    if (registro.status === 'arquivado') return tela({ erro: 'Desarquive o modelo para editar.' });
    const modelo = modeloDoFormulario(form, id, registro.rascunho);
    if (acao === 'testar') {
      const t = mdTestarModelo(modelo);
      return tela({ registro: { ...registro, rascunho: modelo }, problemas: t.erros, exemplos: t.ok ? t.exemplos : [] });
    }
    if (acao === 'publicar') {
      const r = await publicar(db, id, revisao, modelo, reg.usuario);
      if (!r.ok) return tela({ registro: { ...registro, rascunho: modelo }, problemas: r.erros });
      await registrar(env.USUARIOS, reg.usuario, `Publicou o modelo (v${r.versao})`, id);
      registro = await lerModelo(db, id);
      return tela({ ok: `Publicado como versão ${r.versao}. Os atendentes passam a usar esta versão.` });
    }
    if (!(await salvarRascunho(db, id, revisao, modelo, reg.usuario, acao === 'enviar')))
      return tela({ registro: { ...registro, rascunho: modelo }, erro: conflito });
    await registrar(env.USUARIOS, reg.usuario, acao === 'enviar' ? 'Enviou o modelo para publicação' : 'Salvou o rascunho do modelo', id);
    registro = await lerModelo(db, id);
    return tela({
      ok: acao === 'enviar' ? 'Rascunho salvo e enviado para um administrador publicar.' : 'Rascunho salvo. Os atendentes continuam usando a versão publicada.',
    });
  }
  if (acao === 'arquivar' || acao === 'desarquivar') {
    if (!(await mudarArquivamento(db, id, revisao, acao === 'arquivar', reg.usuario))) return tela({ erro: conflito });
    await registrar(env.USUARIOS, reg.usuario, acao === 'arquivar' ? 'Arquivou o modelo' : 'Desarquivou o modelo', id);
    registro = await lerModelo(db, id);
    return tela({ ok: acao === 'arquivar' ? 'Modelo arquivado: saiu do atendimento (nada foi apagado).' : 'Modelo desarquivado.' });
  }
  if (acao === 'duplicar') {
    const novoId = String(form.get('novo_id') || '').trim();
    // a cópia é um serviço novo: não leva os ids originais do formulário (sf, elementoId, id dos avisos)
    const { sf: _sf, ...base } = structuredClone(registro.rascunho);
    const copia = {
      ...base,
      id: novoId,
      nome: `${registro.rascunho.nome} (cópia)`,
      campos: (base.campos || []).map(({ elementoId: _e, ...c }) => c),
      avisos: (base.avisos || []).map((a) => (a && typeof a === 'object' ? (({ id: _i, ...r }) => r)(a) : a)),
    };
    const erros = mdValidarModelo({ ...copia, nota: copia.nota || '-' });
    if (erros.length) return tela({ erro: erros[0] });
    if (!(await criarModelo(db, copia, reg.usuario))) return tela({ erro: `Já existe um modelo com o identificador ${novoId}.` });
    await registrar(env.USUARIOS, reg.usuario, `Duplicou o modelo ${id}`, novoId);
    return redirecionar(`/admin/modelos/${novoId}`);
  }
  if (acao === 'usar_versao' || acao === 'republicar') {
    const v = await lerVersao(db, id, Number(form.get('versao')));
    if (!v) return tela({ erro: 'Versão não encontrada ou com falha de integridade.' });
    if (acao === 'usar_versao') {
      if (!(await salvarRascunho(db, id, revisao, v.conteudo, reg.usuario))) return tela({ erro: conflito });
      await registrar(env.USUARIOS, reg.usuario, `Trouxe a versão v${v.versao} para o rascunho`, id);
      registro = await lerModelo(db, id);
      return tela({ ok: `Versão ${v.versao} copiada para o rascunho. Confira e publique quando quiser.` });
    }
    const r = await publicar(db, id, revisao, v.conteudo, reg.usuario);
    if (!r.ok) return tela({ problemas: r.erros });
    await registrar(env.USUARIOS, reg.usuario, `Restaurou a versão v${v.versao} (publicada como v${r.versao})`, id);
    registro = await lerModelo(db, id);
    return tela({ ok: `Versão ${v.versao} restaurada: os atendentes já usam o conteúdo dela (nova versão ${r.versao}).` });
  }
  return tela({ erro: 'Ação desconhecida.' });
}

// ---- Categorias e serviços do atendimento ----
async function adminAtendimento(request, env, reg, url) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'modelos.ver')) return proibido();
  if (!env.BANCO) return html(telaSemBanco({ usuario: reg.usuario, perfil: meu }));
  const db = env.BANCO;
  await garantirEsquema(db);
  const ctx = { usuario: reg.usuario, perfil: meu };
  let registro = await lerAtendimento(db);
  const nomes = Object.fromEntries(SERVICOS_EMBUTIDOS.map((s) => [s.id, s.nome]));
  const tela = async (msg = {}) =>
    html(
      telaAtendimento({
        ...ctx,
        registro,
        doc: msg.doc || registro.rascunho || documentoPadrao(),
        servicos: SERVICOS_EMBUTIDOS,
        versoes: await listarVersoesAtendimento(db),
        ...msg,
      }),
      msg.erro || msg.problemas?.length ? 400 : 200,
    );
  if (url.pathname.endsWith('/comparar')) {
    const lado = async (v) =>
      v === 'rascunho'
        ? { rotulo: 'rascunho', d: registro.rascunho || documentoPadrao() }
        : { rotulo: `v${v}`, d: (await lerVersaoAtendimento(db, Number(v)))?.conteudo };
    const a = await lado(url.searchParams.get('a'));
    const b = await lado(url.searchParams.get('b') || 'rascunho');
    if (!a.d || !b.d) return tela({ erro: 'Versão não encontrada ou com falha de integridade.' });
    return html(
      telaCompararTexto({
        ...ctx,
        voltar: '/admin/atendimento',
        titulo: 'Atendimento',
        rotuloA: a.rotulo,
        rotuloB: b.rotulo,
        a: resumoAtendimento(a.d, nomes),
        b: resumoAtendimento(b.d, nomes),
      }),
    );
  }
  if (request.method !== 'POST') return tela();
  if (!pode(meu, 'modelos.editar')) return proibido('Seu perfil só pode consultar esta configuração.');
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  const revisao = Number(form.get('revisao'));
  const conflito = 'Outro administrador alterou esta configuração enquanto você editava. Nada foi salvo: recarregue a página e confira.';
  if ((acao === 'publicar' || acao === 'republicar') && !pode(meu, 'modelos.publicar'))
    return proibido('Seu perfil pode editar o rascunho, mas a publicação é feita por um administrador.');
  if (acao === 'republicar') {
    const v = await lerVersaoAtendimento(db, Number(form.get('versao')));
    if (!v) return tela({ erro: 'Versão não encontrada ou com falha de integridade.' });
    const nova = await publicarAtendimento(db, revisao, v.conteudo, reg.usuario);
    if (!nova) return tela({ erro: conflito });
    await registrar(env.USUARIOS, reg.usuario, `Restaurou a configuração do atendimento v${v.versao} (publicada como v${nova})`, 'atendimento');
    registro = await lerAtendimento(db);
    return tela({ ok: `Versão ${v.versao} restaurada para os atendentes (nova versão ${nova}).` });
  }
  const doc = atendimentoDoFormulario(form, SCRIPTS_ATIVOS);
  // scripts ocultos: preserva o que já estiver salvo
  if (!SCRIPTS_ATIVOS) doc.scripts = registro.rascunho?.scripts || {};
  const problemas = validarAtendimento(doc);
  if (problemas.length) return tela({ doc, problemas });
  if (acao === 'publicar') {
    const nova = await publicarAtendimento(db, revisao, doc, reg.usuario);
    if (!nova) return tela({ doc, erro: conflito });
    await registrar(env.USUARIOS, reg.usuario, `Publicou categorias e serviços (v${nova})`, 'atendimento');
    registro = await lerAtendimento(db);
    return tela({ ok: `Publicado como versão ${nova}. Os atendentes já veem a nova organização.` });
  }
  if (acao !== 'salvar' && acao !== 'enviar') return tela({ erro: 'Ação desconhecida.' });
  if (!(await salvarAtendimento(db, revisao, doc, reg.usuario, acao === 'enviar'))) return tela({ doc, erro: conflito });
  await registrar(
    env.USUARIOS,
    reg.usuario,
    acao === 'enviar' ? 'Enviou categorias e serviços para publicação' : 'Salvou o rascunho de categorias e serviços',
    'atendimento',
  );
  registro = await lerAtendimento(db);
  return tela({
    ok: acao === 'enviar' ? 'Rascunho salvo e enviado para um administrador publicar.' : 'Rascunho salvo. Os atendentes continuam com a versão publicada.',
  });
}

// ---- Backups ----
async function adminBackups(request, env, reg, url) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'backups.gerenciar')) return proibido();
  if (!env.BANCO) return html(telaSemBanco({ usuario: reg.usuario, perfil: meu }));
  const db = env.BANCO;
  const ctx = { usuario: reg.usuario, perfil: meu };
  const m = /^\/admin\/backups\/(\d+)\/baixar$/.exec(url.pathname);
  if (m) {
    const b = await lerBackup(db, Number(m[1]));
    if (!b) return html('<!doctype html><meta charset="utf-8"><p>Backup não encontrado.</p>', 404);
    await registrar(env.USUARIOS, reg.usuario, `Baixou o backup #${b.id}`, 'backups');
    return new Response(b.conteudo, {
      headers: {
        ...SEGURANCA,
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="textos-padroes-backup-${b.id}.json"`,
        'cache-control': 'no-store',
      },
    });
  }
  const tela = async (msg = {}) => html(telaBackups({ ...ctx, backups: await listarBackups(db), ...msg }), msg.erro || msg.problemas?.length ? 400 : 200);
  if (request.method !== 'POST') return tela();
  const form = await request.formData();
  const acao = String(form.get('acao') || '');
  const id = Number(form.get('id'));
  if (acao === 'criar') {
    const novo = await criarBackup(db, env.USUARIOS, 'manual', reg.usuario);
    await registrar(env.USUARIOS, reg.usuario, `Fez o backup #${novo}`, 'backups');
    return tela({ ok: `Backup #${novo} criado e validado.` });
  }
  if (acao === 'validar') {
    const b = await lerBackup(db, id);
    if (!b) return tela({ erro: 'Backup não encontrado.' });
    const problemas = await validarConteudo(b.conteudo, b.checksum);
    await registrar(env.USUARIOS, reg.usuario, `Validou o backup #${id}: ${problemas.length ? 'com problemas' : 'íntegro'}`, 'backups');
    return problemas.length ? tela({ problemas }) : tela({ ok: `Backup #${id} íntegro: checksum e todas as versões conferidos.` });
  }
  if (acao === 'restaurar') {
    if (!pode(meu, 'backups.restaurar')) return proibido('Restaurar backups é exclusivo do gestor geral.');
    const r = await restaurarBackup(db, env.USUARIOS, id, reg.usuario, { perfis: form.get('perfis') === '1' });
    if (!r.ok) return tela({ problemas: r.problemas });
    await registrar(
      env.USUARIOS,
      reg.usuario,
      `Restaurou o backup #${id} (backup do estado anterior: #${r.antes}${r.perfisAplicados ? `; ${r.perfisAplicados} perfis` : ''})`,
      'backups',
    );
    return tela({
      ok: `Backup #${id} restaurado. O estado anterior ficou guardado no backup #${r.antes}.${r.perfisAplicados ? ` Perfis ajustados: ${r.perfisAplicados}.` : ''}`,
    });
  }
  return tela({ erro: 'Ação desconhecida.' });
}

// Backup diário automático: checado no máximo uma vez por hora por instância, em segundo plano.
let proximaChecagemBackup = 0;
function agendarBackupDiario(context) {
  const { env } = context;
  if (!env.BANCO || Date.now() < proximaChecagemBackup) return;
  proximaChecagemBackup = Date.now() + 3600 * 1000;
  const tarefa = backupDiarioSeNecessario(env.BANCO, env.USUARIOS)
    .then((id) => (id ? registrar(env.USUARIOS, 'sistema', `Backup automático #${id}`, 'backups') : null))
    .catch(() => {
      proximaChecagemBackup = 0; // tenta de novo no próximo acesso
    });
  if (context.waitUntil) context.waitUntil(tarefa);
}

// ---- Configurações gerais (só o gestor geral) ----
async function adminConfiguracoes(request, env, reg) {
  const meu = perfil(env, reg);
  if (!pode(meu, 'configuracoes.gerenciar')) return proibido('As configurações gerais são exclusivas do gestor geral.');
  const ctx = { usuario: reg.usuario, perfil: meu };
  const tela = async (msg = {}) =>
    html(telaConfiguracoes({ ...ctx, cfg: msg.cfg || (await lerConfiguracoes(env.USUARIOS)), ...msg }), msg.erro || msg.problemas?.length ? 400 : 200);
  if (request.method !== 'POST') return tela();
  const form = await request.formData();
  const revisao = Number(form.get('revisao'));
  const cfg = configuracoesDoFormulario(form);
  const problemas = validarConfiguracoes(cfg);
  if (problemas.length) return tela({ cfg: { ...cfg, revisao }, problemas });
  if (!(await salvarConfiguracoes(env.USUARIOS, revisao, cfg, reg.usuario)))
    return tela({ erro: 'Outra pessoa alterou as configurações enquanto você editava. Nada foi salvo: confira e salve de novo.' });
  await registrar(
    env.USUARIOS,
    reg.usuario,
    `Alterou as configurações gerais (sessão ${cfg.sessaoHoras}h; sugestões ${cfg.sugestoesDia}/dia; aviso ${cfg.avisoTexto ? 'ligado' : 'desligado'})`,
    'configuracoes',
  );
  return tela({ ok: 'Configurações salvas. A duração da sessão vale para os próximos logins.' });
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
  agendarBackupDiario(context);
  if (caminho === '/admin') return admin(request, env, reg);
  if (caminho === '/admin/painel') return painel(env, reg);
  if (caminho === '/admin/backups' || caminho.startsWith('/admin/backups/')) return adminBackups(request, env, reg, url);
  if (caminho === '/admin/configuracoes') return adminConfiguracoes(request, env, reg);
  if (caminho === '/admin/modelos') return adminModelos(request, env, reg, url);
  if (caminho === '/admin/atendimento' || caminho === '/admin/atendimento/comparar') return adminAtendimento(request, env, reg, url);
  if (caminho === '/api/atendimento') {
    if (!env.BANCO) return json({ documento: null });
    try {
      await garantirEsquema(env.BANCO);
      return json({ documento: await atendimentoPublicado(env.BANCO) });
    } catch {
      return json({ erro: 'configuração indisponível' }, 503);
    }
  }
  if (caminho.startsWith('/admin/modelos/')) {
    const id = caminho.slice('/admin/modelos/'.length).replace(/\/comparar$/, '');
    if (!/^[a-z0-9][a-z0-9-]{2,59}$/.test(id)) return html('<!doctype html><meta charset="utf-8"><p>Modelo não encontrado.</p>', 404);
    return adminModelo(request, env, reg, id, url);
  }
  if (caminho === '/api/modelos') {
    // Falha no banco nunca derruba o atendimento: o site usa a cópia guardada no navegador.
    if (!env.BANCO) return json({ geral: 0, modelos: [] });
    try {
      await garantirEsquema(env.BANCO);
      return json(await modelosPublicados(env.BANCO));
    } catch {
      return json({ erro: 'modelos indisponíveis' }, 503);
    }
  }
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
      JSON.stringify({
        usuario: reg.usuario,
        perfil: perfil(env, reg),
        admin: pode(perfil(env, reg), 'painel.ver'),
        gestor: ehGestor(env, reg.usuario),
        aviso: avisoVigente(await lerConfiguracoes(env.USUARIOS), new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bahia' })),
      }),
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
