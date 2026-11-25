  // === INTERFACE DE CELULAR ===
  // Em telas pequenas o sistema vira um app: barra no topo (conta + título),
  // barra de navegação embaixo, botão "Gerar" sempre à mão, texto gerado numa
  // folha que sobe de baixo e menus como folhas (bottom sheets).
  // Os elementos originais são MOVIDOS (mantêm id, eventos e testes).
  var EH_CELULAR = window.matchMedia && window.matchMedia('(max-width: 760px)').matches &&
    !(typeof ehEnderecoAntigo === 'function' && ehEnderecoAntigo());

  var ICONES_CEL = {
    agenda: ICONES_NAV.agenda, pend: ICONES_NAV.pend, form: ICONES_NAV.form,
    hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    mais: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };

  function criarFolha(id, titulo) {
    var fundo = document.createElement('div');
    fundo.className = 'folha-fundo';
    fundo.id = id;
    fundo.style.display = 'none';
    var folha = document.createElement('div');
    folha.className = 'folha';
    folha.setAttribute('role', 'dialog');
    folha.setAttribute('aria-modal', 'true');
    folha.setAttribute('aria-label', titulo);
    folha.innerHTML = '<div class="folha-alca" aria-hidden="true"></div><div class="folha-topo"><b>' + titulo + '</b>' +
      '<button type="button" class="folha-fechar" aria-label="Fechar">✕</button></div><div class="folha-corpo"></div>';
    fundo.appendChild(folha);
    fundo.addEventListener('click', function(ev) { if (ev.target === fundo) fecharFolha(id); });
    folha.querySelector('.folha-fechar').addEventListener('click', function() { fecharFolha(id); });
    document.body.appendChild(fundo);
    return folha.querySelector('.folha-corpo');
  }
  function abrirFolha(id) {
    var f = document.getElementById(id);
    if (!f) return;
    f.style.display = '';
    requestAnimationFrame(function() { f.classList.add('aberta'); });
  }
  function fecharFolha(id) {
    var f = document.getElementById(id);
    if (!f) return;
    f.classList.remove('aberta');
    f.style.display = 'none';
  }
  document.addEventListener('keydown', function(ev) {
    if (ev.key !== 'Escape') return;
    document.querySelectorAll('.folha-fundo.aberta').forEach(function(f) { fecharFolha(f.id); });
  });

  (function montarCelular() {
    if (!EH_CELULAR) return;
    document.body.classList.add('celular');

    // --- barra do topo: conta (avatar) · título da área · busca ---
    var topo = document.createElement('div');
    topo.setAttribute('role', 'banner');
    topo.className = 'app-topo';
    var conta = document.getElementById('lateral_usuario');
    if (conta) topo.appendChild(conta);
    var titulo = document.createElement('span');
    titulo.className = 'app-titulo';
    titulo.id = 'app_titulo';
    var tituloOrig = document.getElementById('titulo_principal');
    var copiarTitulo = function() { titulo.textContent = tituloOrig ? tituloOrig.textContent : 'Textos Padrões'; };
    copiarTitulo();
    if (tituloOrig && window.MutationObserver) new MutationObserver(copiarTitulo).observe(tituloOrig, { childList: true, characterData: true, subtree: true });
    topo.appendChild(titulo);
    var buscar = document.createElement('button');
    buscar.type = 'button';
    buscar.className = 'app-icone';
    buscar.id = 'btn_cel_buscar';
    buscar.setAttribute('aria-label', 'Buscar serviço');
    buscar.innerHTML = svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
    buscar.addEventListener('click', function() {
      var aba = document.querySelector('[data-aba="agenda"]');
      if (aba) aba.click();
      var b = document.getElementById('busca_servico');
      if (b) { b.scrollIntoView({ block: 'center' }); b.focus(); }
    });
    topo.appendChild(buscar);
    document.body.insertBefore(topo, document.body.firstChild);

    // --- navegação embaixo: Textos · Pendências · Formulários · Histórico · Mais ---
    var baixo = document.createElement('nav');
    baixo.className = 'app-baixo';
    baixo.setAttribute('aria-label', 'Navegação');
    var rotulos = { agenda: 'Textos', pend: 'Pendências', form: 'Formulários' };
    ['agenda', 'pend', 'form'].forEach(function(aba) {
      var t = document.querySelector('.nav-tab[data-aba="' + aba + '"]');
      if (!t) return;
      var nome = t.querySelector('.lateral-nav-nome');
      if (nome) nome.textContent = rotulos[aba];
      baixo.appendChild(t);
    });
    var hist = document.getElementById('btn_historico');
    if (hist) {
      hist.className = 'app-baixo-item';
      hist.innerHTML = svg(ICONES_CEL.hist) + '<span class="lateral-nav-nome">Histórico</span><span class="hist-contador" id="hist_contador_hoje"></span>';
      baixo.appendChild(hist);
      if (typeof atualizarContadorHistorico === 'function') atualizarContadorHistorico();
    }
    var mais = document.createElement('button');
    mais.type = 'button';
    mais.className = 'app-baixo-item';
    mais.id = 'btn_mais';
    mais.innerHTML = svg(ICONES_CEL.mais) + '<span class="lateral-nav-nome">Mais</span>';
    mais.addEventListener('click', function() { abrirFolha('folha_mais'); });
    baixo.appendChild(mais);
    document.body.appendChild(baixo);

    // --- folha "Mais": outras ferramentas e tema ---
    var corpoMais = criarFolha('folha_mais', 'Mais ferramentas');
    ['tensao', 'calc', 'decl'].forEach(function(aba) {
      var t = document.querySelector('.nav-tab[data-aba="' + aba + '"]');
      if (!t) return;
      t.addEventListener('click', function() { fecharFolha('folha_mais'); });
      corpoMais.appendChild(t);
    });
    var tema = document.querySelector('.tema-wrap');
    if (tema) corpoMais.appendChild(tema);

    // --- texto gerado: folha que sobe depois de gerar ---
    var saida = document.querySelector('#painel_agenda .result-section');
    if (saida) {
      var corpoSaida = criarFolha('folha_saida', 'Texto gerado');
      corpoSaida.appendChild(saida);
      var aviso = document.createElement('p');
      aviso.className = 'folha-dica';
      aviso.textContent = 'O texto já foi copiado. É só colar no SAP.';
      corpoSaida.insertBefore(aviso, saida);
      if (typeof finalizarGeracao === 'function') {
        var finalizarOriginal = finalizarGeracao;
        finalizarGeracao = function(containerId) {
          finalizarOriginal.apply(null, arguments);
          if (document.getElementById(containerId) && document.getElementById(containerId).closest('#painel_agenda')) abrirFolha('folha_saida');
        };
      }
      // botão para rever o último texto
      var rever = document.createElement('button');
      rever.type = 'button';
      rever.className = 'app-rever';
      rever.id = 'btn_cel_rever';
      rever.textContent = 'Ver último texto gerado';
      rever.addEventListener('click', function() { abrirFolha('folha_saida'); });
      var painel = document.getElementById('painel_agenda');
      if (painel) painel.appendChild(rever);
    }

    // --- ao escolher um serviço: fecha a lista e mostra o formulário ---
    var mostrarFormularioEscolhido = function() {
      setTimeout(function() {
        var lista = document.getElementById('painel_servicos');
        var botao = document.getElementById('btn_alternar_servicos');
        if (lista && lista.style.display !== 'none' && botao && typeof alternarServicos === 'function') alternarServicos(botao);
        var form = document.querySelector('.subform.active');
        if (form) window.scrollTo({ top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 70), behavior: 'auto' });
      }, 0);
    };
    document.addEventListener('click', function(ev) {
      if (ev.target.closest && ev.target.closest('#service_nav .sub-btn, #mais_usados .chip-servico, #busca_sugestoes .sug-item')) mostrarFormularioEscolhido();
    });
    var busca = document.getElementById('busca_servico');
    if (busca) busca.setAttribute('placeholder', 'Buscar serviço... ex: religação');

    // --- teclado certo para cada campo ---
    document.querySelectorAll('input[id*="tel"]').forEach(function(i) { i.setAttribute('inputmode', 'tel'); i.setAttribute('autocomplete', 'off'); });
    document.querySelectorAll('input[id*="email"]').forEach(function(i) { i.setAttribute('inputmode', 'email'); i.setAttribute('autocapitalize', 'off'); });
  })();
