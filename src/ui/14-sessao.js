  // === SESSÃO (login no Cloudflare) ===
  // Com login ativo, mostra no topo quem está conectado, "Trocar senha", "Sair"
  // e, para o responsável, "Administração". Sem login (GitHub Pages), nada aparece.
  (function mostrarSessao() {
    if (!NA_WEB || !window.fetch) return;
    fetch('/api/sessao', { cache: 'no-store', credentials: 'same-origin' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(s) {
        if (!s || !s.usuario) return;
        if (s.aviso && s.aviso.texto) mostrarAvisoGeral(s.aviso);
        var acoes = document.getElementById('lateral_usuario') || document.querySelector('.header-actions');
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
        var info = document.createElement('span');
        info.className = 'menu-usuario-info';
        info.appendChild(nome);
        var papel = document.createElement('small');
        papel.textContent = { gestor: 'Gestor geral', administrador: 'Administrador', supervisor: 'Supervisor', atendente: 'Atendente', consulta: 'Consulta' }[s.perfil] || 'Atendente';
        info.appendChild(papel);
        botao.appendChild(info);
        var menu = document.createElement('div');
        menu.className = 'tema-menu menu-usuario-lista';
        menu.setAttribute('role', 'menu');
        menu.style.display = 'none';
        var links = [['/trocar-senha', 'Trocar senha']];
        if (s.admin) links.unshift(['/admin/painel', 'Painel administrativo']);
        links.push(['/sair', 'Sair']);
        // Tema: abre a lista de temas dentro do próprio card do usuário
        var temaMenu = document.getElementById('tema_menu');
        if (temaMenu && typeof abrirTemas === 'function') {
          var itemTema = document.createElement('button');
          itemTema.type = 'button';
          itemTema.className = 'tema-opcao sessao-link';
          itemTema.id = 'btn_usuario_tema';
          itemTema.setAttribute('role', 'menuitem');
          var lbl = document.getElementById('lbl_tema');
          itemTema.textContent = 'Tema' + (lbl && lbl.textContent ? ': ' + lbl.textContent : '');
          itemTema.addEventListener('click', function(ev) {
            ev.stopPropagation();
            abrir(false);
            abrirTemas();
          });
          menu.appendChild(itemTema);
          caixa.appendChild(temaMenu);
          temaMenu.classList.add('tema-menu-usuario');
          document.body.classList.add('tema-no-usuario');
        }
        var itemSug = document.createElement('button');
        itemSug.type = 'button';
        itemSug.className = 'tema-opcao sessao-link';
        itemSug.id = 'btn_usuario_sugestao';
        itemSug.setAttribute('role', 'menuitem');
        itemSug.textContent = 'Enviar sugestão';
        itemSug.addEventListener('click', function() { abrir(false); abrirSugestao(); });
        menu.appendChild(itemSug);
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

  // Aviso geral definido pelo gestor (Configurações). Some ao fechar, até o próximo login.
  function mostrarAvisoGeral(aviso) {
    var chave = 'tp_aviso_fechado';
    try { if (sessionStorage.getItem(chave) === aviso.texto) return; } catch (e) {}
    var faixa = document.createElement('div');
    faixa.className = 'aviso-geral aviso-geral-' + (aviso.tipo === 'alerta' ? 'alerta' : 'info');
    faixa.id = 'aviso_geral';
    faixa.setAttribute('role', aviso.tipo === 'alerta' ? 'alert' : 'status');
    var txt = document.createElement('span');
    txt.textContent = aviso.texto;
    var fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'aviso-geral-fechar';
    fechar.setAttribute('aria-label', 'Fechar aviso');
    fechar.textContent = '✕';
    fechar.addEventListener('click', function() {
      faixa.remove();
      try { sessionStorage.setItem(chave, aviso.texto); } catch (e) {}
    });
    faixa.appendChild(txt);
    faixa.appendChild(fechar);
    var cont = document.querySelector('.container');
    if (cont) cont.insertBefore(faixa, cont.firstChild);
  }
