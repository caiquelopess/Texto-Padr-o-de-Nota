  // === SESSÃO (login no Cloudflare) ===
  // Com login ativo, mostra no topo quem está conectado, "Trocar senha", "Sair"
  // e, para o responsável, "Administração". Sem login (GitHub Pages), nada aparece.
  (function mostrarSessao() {
    if (!NA_WEB || !window.fetch) return;
    fetch('/api/sessao', { cache: 'no-store', credentials: 'same-origin' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(s) {
        if (!s || !s.usuario) return;
        var acoes = document.querySelector('.header-actions');
        if (!acoes) return;
        // Menu do usuário: o nome no topo abre Administração, Trocar senha e Sair.
        var caixa = document.createElement('span');
        caixa.className = 'sessao-usuario menu-usuario';
        var botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'theme-toggle';
        botao.id = 'btn_usuario';
        botao.setAttribute('aria-haspopup', 'true');
        botao.setAttribute('aria-expanded', 'false');
        botao.title = 'Usuário conectado';
        var ini = document.createElement('span');
        ini.className = 'avatar-iniciais';
        ini.textContent = s.usuario.split('.').map(function(p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
        var nome = document.createElement('span');
        nome.className = 'menu-usuario-nome';
        nome.textContent = s.usuario;
        botao.appendChild(ini);
        botao.appendChild(nome);
        var menu = document.createElement('div');
        menu.className = 'tema-menu menu-usuario-lista';
        menu.setAttribute('role', 'menu');
        menu.style.display = 'none';
        var links = [['/trocar-senha', 'Trocar senha']];
        if (s.admin) links.unshift(['/admin', 'Administração'], ['/admin/formularios', 'Formulários (enviar)']);
        links.push(['/sair', 'Sair']);
        links.forEach(function(l) {
          var a = document.createElement('a');
          a.className = 'tema-opcao sessao-link';
          a.setAttribute('role', 'menuitem');
          a.href = l[0];
          a.textContent = l[1];
          menu.appendChild(a);
        });
        var abrir = function(sim) {
          menu.style.display = sim ? '' : 'none';
          botao.setAttribute('aria-expanded', sim ? 'true' : 'false');
        };
        botao.addEventListener('click', function(ev) { ev.stopPropagation(); abrir(menu.style.display === 'none'); });
        document.addEventListener('click', function(ev) { if (!caixa.contains(ev.target)) abrir(false); });
        document.addEventListener('keydown', function(ev) { if (ev.key === 'Escape') abrir(false); });
        caixa.appendChild(botao);
        caixa.appendChild(menu);
        acoes.appendChild(caixa);
      })
      .catch(function() {});
  })();
