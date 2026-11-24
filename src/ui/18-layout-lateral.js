  // === LAYOUT CORPORATIVO: barra lateral ===
  // Topo da barra: usuário, notificações (pendências) e histórico.
  // Meio: navegação entre as áreas, com ícones. Rodapé: tema e data.
  // Os elementos originais são MOVIDOS (mantêm id, eventos e testes).
  var ICONES_NAV = {
    agenda: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    tensao: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2m4 0h2M8 15h2m4 0h2M8 19h2m4 0h2"/>',
    decl: '<path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6"/>',
    pend: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    form: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  };
  var svg = function(corpo) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + corpo + '</svg>';
  };

  (function montarLayoutLateral() {
    var container = document.querySelector('.container');
    var header = container && container.querySelector('header');
    var abas = container && container.querySelector('.nav-tabs');
    if (!container || !header || !abas) return;
    // No endereço antigo (GitHub Pages, até a migração) fica o layout antigo.
    if (typeof ehEnderecoAntigo === 'function' && ehEnderecoAntigo()) return;

    var lateral = document.createElement('aside');
    lateral.className = 'lateral';
    lateral.setAttribute('aria-label', 'Menu principal');

    // marca
    var marca = header.querySelector('.brand-row');
    if (marca) { marca.classList.add('lateral-marca'); lateral.appendChild(marca); }

    // usuário + notificações (canto superior esquerdo)
    var topo = document.createElement('div');
    topo.className = 'lateral-topo';
    var usuario = document.createElement('div');
    usuario.className = 'lateral-usuario';
    usuario.id = 'lateral_usuario';
    topo.appendChild(usuario);
    var atalhos = document.createElement('div');
    atalhos.className = 'lateral-atalhos';
    ['btn_pendencias', 'btn_historico'].forEach(function(id) {
      var b = document.getElementById(id);
      if (b) { b.classList.add('lateral-icone'); atalhos.appendChild(b); }
    });
    topo.appendChild(atalhos);
    lateral.appendChild(topo);

    // navegação
    var nav = document.createElement('nav');
    nav.className = 'lateral-nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-orientation', 'vertical');
    var rot = document.createElement('div');
    rot.className = 'lateral-secao';
    rot.textContent = 'Ferramentas';
    nav.appendChild(rot);
    Array.prototype.slice.call(abas.querySelectorAll('.nav-tab')).forEach(function(t) {
      var aba = t.getAttribute('data-aba');
      var badge = t.querySelector('.pend-badge');
      var texto = t.firstChild && t.firstChild.nodeType === 3 ? t.firstChild.nodeValue : t.textContent;
      t.textContent = '';
      t.insertAdjacentHTML('beforeend', svg(ICONES_NAV[aba] || '<circle cx="12" cy="12" r="3"/>'));
      var nome = document.createElement('span');
      nome.className = 'lateral-nav-nome';
      nome.textContent = texto.trim().toLowerCase().replace(/(^|\s)(\S)/g, function(m, e, l) { return e + l.toUpperCase(); })
        .replace(' E ', ' e ').replace(' De ', ' de ');
      t.appendChild(nome);
      if (badge) t.appendChild(badge);
      nav.appendChild(t);
    });
    lateral.appendChild(nav);
    abas.remove();

    // rodapé: tema e data
    var rodape = document.createElement('div');
    rodape.className = 'lateral-rodape';
    var tema = header.querySelector('.tema-wrap');
    if (tema) rodape.appendChild(tema);
    var data = document.getElementById('data_hoje');
    if (data) rodape.appendChild(data);
    lateral.appendChild(rodape);

    document.body.insertBefore(lateral, container);
    document.body.classList.add('layout-lateral');
  })();
