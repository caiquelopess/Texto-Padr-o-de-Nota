// Telas de login, troca de senha e administração (HTML gerado no servidor).

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ESTILO = `
:root{--bg:#05060d;--card:rgba(18,20,34,.72);--borda:rgba(255,255,255,.09);--txt:#e6e9f5;--muted:#8a90a8;--neon:#22e5ff;--neon2:#ff3df2;--perigo:#ff5c8a;--ok:#3dffa8;--aviso:#ffd166}
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
label{display:block;font-size:13px;margin:14px 0 6px;color:#c9cee0}
input,select{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--borda);background:rgba(255,255,255,.04);color:var(--txt);font-size:15px}
input:focus{outline:none;border-color:var(--neon);box-shadow:0 0 0 3px rgba(34,229,255,.1)}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;padding:12px;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:15px;color:#05060d;text-decoration:none;
 background:linear-gradient(135deg,var(--neon),#7ab6ff);box-shadow:0 8px 24px -10px rgba(34,229,255,.6);transition:filter .15s}
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

export function telaTrocarSenha({ usuario, erro = '', ok = '' }) {
  return pagina(
    'Trocar senha',
    `<div class="topo"><h1>Trocar senha</h1><a href="/">← Voltar ao sistema</a></div><p class="sub">${esc(usuario)}</p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<form method="post" action="/trocar-senha" data-carrega>
<label for="atual">Senha atual</label><input id="atual" name="atual" type="password" autocomplete="current-password" required>
<label for="nova">Nova senha (mínimo 4 caracteres)</label><input id="nova" name="nova" type="password" autocomplete="new-password" minlength="4" required>
<label for="confirma">Repita a nova senha</label><input id="confirma" name="confirma" type="password" autocomplete="new-password" minlength="4" required>
<button type="submit">Salvar nova senha</button></form>${AVISO_SENHA}`,
  );
}

const data = (ms) => (ms ? new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'short', timeStyle: 'short' }) : '—');

export function telaAdmin({ usuario, usuarios = [], erro = '', ok = '' }) {
  const linhas = usuarios
    .map(
      (u) => `<tr><td><b>${esc(u.usuario)}</b>${u.admin ? ' <span style="color:var(--neon)">(admin)</span>' : ''}</td>
<td>${u.ativo ? 'Ativo' : '<span style="color:var(--perigo)">Desativado</span>'}</td><td>${data(u.criado)}</td><td>${data(u.ultimoAcesso)}</td>
<td>${
        u.usuario === usuario
          ? '<a href="/trocar-senha" style="color:var(--neon)">trocar minha senha</a>'
          : `<form method="post" action="/admin" onsubmit="var s=prompt('Nova senha provisória para ${esc(u.usuario)} (mínimo 4 caracteres):');if(!s)return false;this.senha.value=s;">
<input type="hidden" name="acao" value="redefinir"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><input type="hidden" name="senha"><button type="submit" class="secundario">Redefinir senha</button></form>
<form method="post" action="/admin"><input type="hidden" name="acao" value="${u.ativo ? 'desativar' : 'ativar'}"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><button type="submit" class="secundario">${u.ativo ? 'Desativar' : 'Ativar'}</button></form>
<form method="post" action="/admin" onsubmit="return confirm('Remover ${esc(u.usuario)}? Esta ação não pode ser desfeita.')"><input type="hidden" name="acao" value="remover"><input type="hidden" name="usuario" value="${esc(u.usuario)}"><button type="submit" class="perigo">Remover</button></form>`
      }</td></tr>`,
    )
    .join('');
  return pagina(
    'Administração',
    `<div class="topo"><h1>Administração de usuários</h1><a href="/">← Voltar ao sistema</a></div><p class="sub">Conectado como ${esc(usuario)} · <a href="/sair" style="color:var(--neon)">Sair</a></p><div class="linha-neon"></div>
${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}
<form method="post" action="/admin" data-carrega><input type="hidden" name="acao" value="criar">
<div class="grade"><div><label for="nu">Novo usuário</label><input id="nu" name="usuario" placeholder="nome.sobrenome" required></div>
<div><label for="ns">Senha provisória (mín. 4)</label><input id="ns" name="senha" minlength="4" required></div>
<label class="check" style="margin:0 0 12px"><input type="checkbox" name="admin" value="1"> admin</label>
<button type="submit">Criar</button></div></form>
<p class="aviso">Passe a senha provisória ao atendente e peça para ele trocar em "Trocar senha". ⚠️ Não usar a senha real dos sistemas corporativos.</p>
<table><thead><tr><th>Usuário</th><th>Situação</th><th>Criado em</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>${linhas || '<tr><td colspan="5">Nenhum usuário ainda.</td></tr>'}</tbody></table>`,
    true,
  );
}
