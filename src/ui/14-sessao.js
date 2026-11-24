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
        var caixa = document.createElement('span');
        caixa.className = 'sessao-usuario';
        var nome = document.createElement('span');
        nome.className = 'badge';
        nome.title = 'Usuário conectado';
        nome.textContent = s.usuario;
        caixa.appendChild(nome);
        var links = [['/trocar-senha', 'Trocar senha']];
        if (s.admin) links.unshift(['/admin', 'Administração']);
        links.push(['/sair', 'Sair']);
        links.forEach(function(l) {
          var a = document.createElement('a');
          a.className = 'theme-toggle sessao-link';
          a.href = l[0];
          a.textContent = l[1];
          caixa.appendChild(a);
        });
        acoes.appendChild(caixa);
      })
      .catch(function() {});
  })();
