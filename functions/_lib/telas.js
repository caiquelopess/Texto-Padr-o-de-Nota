// Telas de login, troca de senha e administração (HTML gerado no servidor).

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ESTILO = `
:root{--bg:#05060d;--card:rgba(18,20,34,.72);--borda:rgba(255,255,255,.09);--txt:#e6e9f5;--muted:#8a90a8;--neon:#22e5ff;--neon2:#ff3df2;--perigo:#ff5c8a;--ok:#3dffa8;--aviso:#ffd166;--lateral:rgba(14,16,26,.85);--realce:rgba(34,229,255,.1);--botao-txt:#05060d}
:root[data-base=claro]{--bg:#f3f6f4;--card:#fff;--borda:rgba(15,23,42,.1);--txt:#16211b;--muted:#5b6b62;--neon:#15803d;--neon2:#0e7490;--perigo:#c2263b;--ok:#15803d;--aviso:#8a5a00;--lateral:#fff;--realce:rgba(21,128,61,.09);--botao-txt:#fff}
:root[data-base=claro] body{background:var(--bg)}
:root[data-paleta=logos]{--neon:#e8174e;--neon2:#ff6b8b;--realce:rgba(232,23,78,.12);--botao-txt:#fff}
:root[data-paleta=ardosia]{--bg:#161c25;--card:#1f2732;--lateral:#1b222c;--neon:#93b4d6;--neon2:#c2d4e8;--realce:rgba(147,180,214,.12)}
:root[data-paleta=sepia]{--bg:#efe6d2;--card:#fbf6ea;--lateral:#f6eedc;--txt:#3b2f20;--muted:#7a6a55;--neon:#8a5a2b;--neon2:#a8763f;--realce:rgba(138,90,43,.1)}
:root[data-paleta=contraste]{--bg:#000;--card:#000;--lateral:#000;--borda:#fff;--txt:#fff;--muted:#e5e5e5;--neon:#ffe600;--neon2:#ffe600;--realce:rgba(255,230,0,.15)}
*{box-sizing:border-box;font-family:Inter,-apple-system,"Segoe UI",system-ui,sans-serif}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;color:var(--txt);
 background:radial-gradient(900px 600px at 8% -10%,rgba(34,229,255,.16),transparent 60%),radial-gradient(800px 600px at 105% 10%,rgba(255,61,242,.14),transparent 60%),var(--bg)}
.cartao{width:100%;max-width:420px;background:var(--card);border:1px solid var(--borda);border-radius:20px;padding:28px;backdrop-filter:blur(22px);box-shadow:0 30px 80px -40px rgba(0,0,0,.6);animation:entra .28s cubic-bezier(.16,1,.3,1)}
.largo{max-width:900px}
@keyframes entra{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
h1{margin:0 0 2px;font-size:22px;letter-spacing:-.02em}
.sub{margin:0 0 20px;color:var(--muted);font-size:13px}
.linha-neon{height:1px;margin:0 0 20px;background:linear-gradient(90deg,transparent,var(--neon),var(--neon2),transparent)}
label{display:block;font-size:13px;margin:14px 0 6px;color:var(--txt);font-weight:500}
input,select{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--borda);background:rgba(255,255,255,.04);color:var(--txt);font-size:15px}
input:focus{outline:none;border-color:var(--neon);box-shadow:0 0 0 3px rgba(34,229,255,.1)}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;padding:12px;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:15px;color:#05060d;text-decoration:none;
 background:var(--neon);color:var(--botao-txt);box-shadow:0 8px 24px -12px var(--neon);transition:filter .15s}
button:hover{filter:brightness(1.08)}
button[disabled]{opacity:.7;cursor:progress}
.carregando::after{content:"";width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:gira .7s linear infinite}
@keyframes gira{to{transform:rotate(360deg)}}
.secundario{background:transparent;color:var(--txt);border:1px solid var(--borda);box-shadow:none}
.aviso{margin:16px 0 0;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.5;border:1px solid rgba(255,209,102,.3);background:rgba(255,209,102,.07);color:var(--aviso)}
.erro{margin:0 0 6px;padding:10px 12px;border-radius:10px;font-size:13px;border:1px solid rgba(255,92,138,.35);background:rgba(255,92,138,.08);color:var(--perigo)}
.okmsg{margin:0 0 6px;padding:10px 12px;border-radius:10px;font-size:13px;border:1px solid rgba(61,255,168,.3);background:rgba(61,255,168,.07);color:var(--ok)}
.rodape{margin-top:18px;font-size:12px;color:var(--muted);text-align:center}
.rodape a{color:var(--neon)}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
th,td{text-align:left;padding:9px 8px;border-bottom:1px solid var(--borda);vertical-align:middle}
th{color:var(--muted);font-weight:500}
td form{display:inline}
td button{width:auto;margin:0 4px 0 0;padding:6px 10px;font-size:12px}
.perigo{background:transparent;color:var(--perigo);border:1px solid rgba(255,92,138,.4);box-shadow:none}
.grade{display:grid;grid-template-columns:1fr 1fr auto auto;gap:10px;align-items:end}
.grade button{margin-top:0;width:auto;padding:11px 16px}
.check{display:flex;gap:6px;align-items:center;font-size:13px;margin:0 0 12px}
.check input{width:auto}
.topo{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.topo a{color:var(--neon);font-size:13px}
@media (max-width:640px){.grade{grid-template-columns:1fr}.cartao{padding:20px}}
`;

const pagina = (titulo, corpo, largo = false) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(titulo)} — Textos Padrões</title><style>${ESTILO}</style></head>
<body><main class="cartao${largo ? ' largo' : ''}">${corpo}</main>
<script>document.querySelectorAll('form[data-carrega]').forEach(f=>f.addEventListener('submit',()=>{const b=f.querySelector('button[type=submit]');if(b){b.disabled=true;b.classList.add('carregando');}}));</script>
</body></html>`;

const AVISO_SENHA = '<p class="aviso">⚠️ <b>Não use sua senha real de acesso aos sistemas corporativos.</b></p>';

export function telaLogin({ erro = '', destino = '/', usuario = '' } = {}) {
  return pagina(
    'Entrar',
    `<h1>Textos Padrões</h1><p class="sub">Neoenergia · Logos — acesso restrito</p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}
<form method="post" action="/entrar" data-carrega>
<input type="hidden" name="destino" value="${esc(destino)}">
<label for="usuario">Usuário</label><input id="usuario" name="usuario" autocomplete="username" placeholder="nome.sobrenome" value="${esc(usuario)}" required autofocus>
<label for="senha">Senha</label><input id="senha" name="senha" type="password" autocomplete="current-password" minlength="4" required>
<button type="submit">Entrar</button></form>${AVISO_SENHA}
<p class="rodape">Esqueceu a senha? Fale com o responsável pelo sistema.</p>`,
  );
}

export function telaTrocarSenha({ usuario, obrigatoria = false, erro = '', ok = '' }) {
  return pagina(
    'Trocar senha',
    `<div class="topo"><h1>${obrigatoria ? 'Crie sua senha' : 'Trocar senha'}</h1>${obrigatoria ? '<a href="/sair">Sair</a>' : '<a href="/">← Voltar ao sistema</a>'}</div><p class="sub">${esc(usuario)}</p><div class="linha-neon"></div>
${obrigatoria ? '<p class="aviso" style="margin:0 0 6px">Primeiro acesso: você entrou com uma <b>senha provisória</b>. Crie a sua senha para começar a usar o sistema.</p>' : ''}
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<form method="post" action="/trocar-senha" data-carrega>
<label for="atual">${obrigatoria ? 'Senha provisória (recebida do administrador)' : 'Senha atual'}</label><input id="atual" name="atual" type="password" autocomplete="current-password" required>
<label for="nova">Nova senha (mínimo 4 caracteres)</label><input id="nova" name="nova" type="password" autocomplete="new-password" minlength="4" required>
<label for="confirma">Repita a nova senha</label><input id="confirma" name="confirma" type="password" autocomplete="new-password" minlength="4" required>
<button type="submit">Salvar nova senha</button></form>${AVISO_SENHA}`,
  );
}

const data = (ms) => (ms ? new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'short', timeStyle: 'short' }) : '—');

export function telaAdmin({ usuario, gestor = '', usuarios = [], erro = '', ok = '' }) {
  const linhas = usuarios
    .map(
      (
        u,
      ) => `<tr><td><b>${esc(u.usuario)}</b>${u.usuario === gestor ? ' <span style="color:var(--neon2)">(gestor geral)</span>' : u.admin ? ' <span style="color:var(--neon)">(admin)</span>' : ''}</td>
<td>${u.ativo ? 'Ativo' : '<span style="color:var(--perigo)">Desativado</span>'}</td><td>${data(u.criado)}</td><td>${esc(u.criadoPor || '—')}</td><td>${data(u.ultimoAcesso)}</td>
<td>${
        u.usuario === usuario
          ? '<a href="/trocar-senha" style="color:var(--neon)">trocar minha senha</a>'
          : u.usuario === gestor
            ? '<span style="color:var(--muted)">protegido</span>'
            : `<form method="post" action="/admin" onsubmit="var s=prompt('Nova senha provisória para ${esc(u.usuario)} (mínimo 4 caracteres):');if(!s)return false;this.senha.value=s;">
<input type="hidden" name="acao" value="redefinir"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><input type="hidden" name="senha"><button type="submit" class="secundario">Redefinir senha</button></form>
<form method="post" action="/admin"><input type="hidden" name="acao" value="${u.ativo ? 'desativar' : 'ativar'}"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><button type="submit" class="secundario">${u.ativo ? 'Desativar' : 'Ativar'}</button></form>
<form method="post" action="/admin" onsubmit="return confirm('Remover ${esc(u.usuario)}? Esta ação não pode ser desfeita.')"><input type="hidden" name="acao" value="remover"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><button type="submit" class="perigo">Remover</button></form>`
      }</td></tr>`,
    )
    .join('');
  return paginaAdmin(
    'Administração',
    'usuarios',
    { usuario, gestor },
    `<h1>Usuários</h1><p class="sub">Crie acessos para os atendentes e gerencie os existentes.</p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<form method="post" action="/admin" data-carrega><input type="hidden" name="acao" value="criar">
<div class="grade"><div><label for="nu">Novo usuário</label><input id="nu" name="usuario" placeholder="nome.sobrenome" required></div>
<div><label for="ns">Senha provisória (mín. 4)</label><input id="ns" name="senha" minlength="4" required></div>
<label class="check" style="margin:0 0 12px"><input type="checkbox" name="admin" value="1"> admin</label>
<button type="submit">Criar</button></div></form>
<p class="aviso">Passe a senha provisória ao atendente e peça para ele trocar em "Trocar senha". ⚠️ Não usar a senha real dos sistemas corporativos.</p>
<table><thead><tr><th>Usuário</th><th>Situação</th><th>Criado em</th><th>Criado por</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>${linhas || '<tr><td colspan="6">Nenhum usuário ainda.</td></tr>'}</tbody></table>`,
  );
}

const tamanho = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function telaFormularios({ usuario, gestor = '', formularios = [], erro = '', ok = '' }) {
  const linhas = formularios
    .map(
      (
        f,
      ) => `<tr><td><b>${esc(f.nome)}</b></td><td>${esc((f.tipo || '').split('/')[1]?.toUpperCase())}</td><td>${tamanho(f.tamanho || 0)}</td><td>${data(f.criado)}</td><td>${esc(f.por || '—')}</td>
<td><a href="/api/formularios/${esc(f.id)}" target="_blank" rel="noopener" style="color:var(--neon);margin-right:8px">ver</a>
<form method="post" action="/admin/formularios" onsubmit="return confirm('Remover o formulário ${esc(f.nome).replace(/&#39;/g, '')}?')"><input type="hidden" name="acao" value="remover"><input type="hidden" name="id" value="${esc(f.id)}"><button type="submit" class="perigo">Remover</button></form></td></tr>`,
    )
    .join('');
  return paginaAdmin(
    'Formulários',
    'formularios',
    { usuario, gestor },
    `<h1>Formulários para impressão</h1><p class="sub">Os atendentes encontram pelo nome na aba Formulários do sistema.</p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<form method="post" action="/admin/formularios" enctype="multipart/form-data" data-carrega><input type="hidden" name="acao" value="enviar">
<div class="grade"><div><label for="fn">Nome do formulário (é por ele que os atendentes buscam)</label><input id="fn" name="nome" placeholder="ex.: Declaração de Residência" minlength="2" maxlength="120" required></div>
<div><label for="fa">Arquivo (PDF, PNG ou JPG, até 10 MB)</label><input id="fa" name="arquivo" type="file" accept="application/pdf,image/png,image/jpeg" required></div>
<span></span><button type="submit">Enviar</button></div></form>
<p class="aviso">Os formulários ficam visíveis para todos os usuários com login. ⚠️ Envie só modelos em branco — nunca documentos com dados de clientes.</p>
<table><thead><tr><th>Nome</th><th>Tipo</th><th>Tamanho</th><th>Enviado em</th><th>Enviado por</th><th>Ações</th></tr></thead><tbody>${linhas || '<tr><td colspan="6">Nenhum formulário ainda.</td></tr>'}</tbody></table>`,
  );
}

export function telaSugestoes({ usuario, ver = 'pendentes', sugestoes = [], total = { pendentes: 0, concluidas: 0 }, ok = '', erro = '' }) {
  const concl = ver === 'concluidas';
  const botao = (s, acao, rotulo, classe, confirmar = '') =>
    `<form method="post" action="/admin/sugestoes?ver=${ver}"${confirmar ? ` onsubmit="return confirm('${confirmar}')"` : ''}><input type="hidden" name="id" value="${esc(s.id)}"><input type="hidden" name="acao" value="${acao}"><button type="submit" class="${classe}">${rotulo}</button></form>`;
  const itens = sugestoes
    .map(
      (
        s,
      ) => `<tr><td style="white-space:nowrap">${data(s.criado)}</td><td><b>${esc(s.usuario)}</b></td><td>${esc(s.tipo)}</td><td style="white-space:pre-wrap">${esc(s.texto)}${concl ? `<br><small style="color:var(--muted)">Concluída em ${data(s.concluidaEm)} por ${esc(s.concluidaPor)}</small>` : ''}</td>
<td style="white-space:nowrap">${concl ? botao(s, 'reabrir', 'Reabrir', 'secundario') : botao(s, 'concluir', 'Concluída', 'secundario')}${botao(s, 'excluir', 'Excluir', 'perigo', 'Excluir esta sugestão de vez? Não dá para desfazer.')}</td></tr>`,
    )
    .join('');
  const aba = (chave, rotulo, n) =>
    `<a href="/admin/sugestoes?ver=${chave}" class="aba${ver === chave ? ' ativa' : ''}"${ver === chave ? ' aria-current="page"' : ''}>${rotulo} <span>${n}</span></a>`;
  return paginaAdmin(
    'Sugestões',
    'sugestoes',
    { usuario, gestor: usuario },
    `<h1>Sugestões recebidas</h1><p class="sub">Enviadas pelos atendentes no menu do usuário. Visível só para o gestor geral.</p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<nav class="abas">${aba('pendentes', 'Pendentes', total.pendentes)}${aba('concluidas', 'Concluídas', total.concluidas)}</nav>
<table><thead><tr><th>Quando</th><th>Quem</th><th>Tipo</th><th>Mensagem</th><th></th></tr></thead><tbody>${itens || `<tr><td colspan="5">${concl ? 'Nenhuma sugestão concluída.' : 'Nenhuma sugestão pendente.'}</td></tr>`}</tbody></table>`,
  );
}

// ---- Layout das telas de administração (mesmo padrão do sistema: barra lateral) ----
const ESTILO_ADMIN = `
body.adm{display:grid;grid-template-columns:248px minmax(0,1fr);align-items:start;padding:0;min-height:100vh}
.adm-lateral{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:14px;padding:18px 14px;background:var(--lateral);border-right:1px solid var(--borda)}
.adm-marca{font-weight:700;font-size:15px;padding:4px 8px}.adm-marca small{display:block;font-weight:500;font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
.adm-usuario{display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--borda);border-radius:12px;background:var(--realce)}
.adm-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--neon);color:var(--botao-txt);font-weight:700;font-size:12px;flex:none}
.adm-usuario b{display:block;font-size:13px}.adm-usuario small{color:var(--muted);font-size:11px}
.adm-nav{display:flex;flex-direction:column;gap:2px}.adm-secao{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);padding:6px 10px}
.adm-nav a{display:flex;gap:10px;align-items:center;padding:9px 12px;border-radius:8px;border-left:3px solid transparent;color:var(--muted);text-decoration:none;font-size:13.5px;font-weight:500}
.adm-nav a:hover{background:var(--realce);color:var(--txt)}.adm-nav a.ativo{background:var(--realce);color:var(--txt);font-weight:600;border-left-color:var(--neon)}
.adm-rodape{margin-top:auto}
.abas{display:flex;gap:6px;margin:4px 0 6px;border-bottom:1px solid var(--borda)}.abas .aba{padding:9px 14px;color:var(--muted);text-decoration:none;font-weight:600;font-size:13.5px;border-bottom:2px solid transparent;margin-bottom:-1px}.abas .aba.ativa{color:var(--txt);border-bottom-color:var(--neon)}.abas .aba span{display:inline-block;min-width:20px;padding:0 6px;margin-left:4px;border-radius:999px;background:var(--realce);font-size:11.5px;text-align:center}
.adm-principal{padding:28px;max-width:1080px;width:100%;margin:0 auto}
.adm-principal .cartao{max-width:none}
.adm-principal h1{font-size:22px}
@media (max-width:860px){body.adm{display:block}.adm-lateral{position:static;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center}.adm-marca{display:none}.adm-usuario{flex:1 1 auto}.adm-nav{flex:1 1 100%;flex-direction:row;overflow-x:auto}.adm-secao{display:none}.adm-nav a{white-space:nowrap;border-left:0}.adm-rodape{display:none}.adm-principal{padding:14px}}
`;

// Aplica o mesmo tema escolhido no sistema (guardado neste navegador)
const SCRIPT_TEMA = `<script>(function(){try{var t=localStorage.getItem('tp_tema')||'branco-verde';var m={'neon-escuro':'ardosia','preto-vermelho':'ardosia','preto-azul':'ardosia','preto-verde':'ardosia','neon-claro':'branco-verde','branco-vermelho':'branco-verde','branco-azul':'branco-verde'};t=m[t]||t;var r=document.documentElement;r.setAttribute('data-paleta',t);if(t==='branco-verde'||t==='sepia')r.setAttribute('data-base','claro');}catch(e){document.documentElement.setAttribute('data-base','claro');}})();</script>`;

const iniciais = (u) =>
  String(u)
    .split('.')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

function paginaAdmin(titulo, ativo, { usuario, gestor }, corpo) {
  const ehGestor = usuario === gestor;
  const item = (href, nome, chave) => `<a href="${href}"${chave === ativo ? ' class="ativo" aria-current="page"' : ''}>${nome}</a>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(titulo)} — Textos Padrões</title>${SCRIPT_TEMA}<style>${ESTILO}${ESTILO_ADMIN}</style></head>
<body class="adm"><aside class="adm-lateral" aria-label="Menu da administração">
<div class="adm-marca">Textos Padrões<small>Administração</small></div>
<div class="adm-usuario"><span class="adm-avatar">${esc(iniciais(usuario))}</span><span><b>${esc(usuario)}</b><small>${ehGestor ? 'Gestor geral' : 'Administrador'}</small></span></div>
<nav class="adm-nav"><div class="adm-secao">Gestão</div>${item('/admin', 'Usuários', 'usuarios')}${item('/admin/formularios', 'Formulários', 'formularios')}${ehGestor ? item('/admin/sugestoes', 'Sugestões', 'sugestoes') + item('/admin/auditoria', 'Auditoria', 'auditoria') : ''}
<div class="adm-secao">Conta</div>${item('/', '← Voltar ao sistema', '')}${item('/trocar-senha', 'Trocar senha', '')}${item('/sair', 'Sair', '')}</nav>
</aside><main class="adm-principal"><div class="cartao largo">${corpo}</div></main>
<script>document.querySelectorAll('form[data-carrega]').forEach(f=>f.addEventListener('submit',()=>{const b=f.querySelector('button[type=submit]');if(b){b.disabled=true;b.classList.add('carregando');}}));</script>
</body></html>`;
}

export function telaAuditoria({ usuario, registros = [] }) {
  const linhas = registros
    .map((r) => `<tr><td style="white-space:nowrap">${data(r.quando)}</td><td><b>${esc(r.quem)}</b></td><td>${esc(r.acao)}</td><td>${esc(r.alvo)}</td></tr>`)
    .join('');
  return paginaAdmin(
    'Auditoria',
    'auditoria',
    { usuario, gestor: usuario },
    `<h1>Auditoria</h1><p class="sub">Quem criou acessos, redefiniu senhas, ativou, desativou ou removeu usuários e quem enviou ou removeu formulários. Últimos 300 registros, guardados por 1 ano. Visível só para o gestor geral.</p><div class="linha-neon"></div>
<table><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Sobre</th></tr></thead><tbody>${linhas || '<tr><td colspan="4">Nenhum registro ainda.</td></tr>'}</tbody></table>`,
  );
}
