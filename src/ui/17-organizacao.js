  // === ORGANIZAÇÃO DA INTERFACE (#17) ===
  // Agrupa os serviços por categoria, mostra os "mais usados" deste computador,
  // junta as opções da conta num menu e adiciona atalhos de teclado.
  // Os botões continuam dentro de #service_nav: nada muda para o resto do sistema.
  var CATEGORIAS = [
    ['Ligação e Reativação', /^(Liga[çc][aã]o|Reativa|Religa|Inspe[çc][aã]o e liga|Desligamento)/i],
    ['Titularidade e Cadastro', /^(Troca de Titularidade|Atualiza[çc][aã]o Cadastral|Modifica[çc][aã]o Contratual|Cadastro de Parceiro|BPC)/i],
    ['Faturamento e Débitos', /^(Conta Paga|DATA BOA|D[ée]bito autom|Isen[çc][aã]o de D[ée]bitos|Resposta da An[aá]lise de Isen|Restitui|Estorno|TR DE PARTIDAS|Tarefa NEO|Bloqueio de Cobran|Defesa Adm)/i],
    ['Parcelamento', /Parcelamento/i],
    ['Ressarcimento', /^Ressarcimento/i],
    ['Medição e Rede', /^(Aferi|Medidor|Selagem|Verifica[çc][aã]o de Equip|Reforma Padr|Reloca|Servi[çc]o no Ramal|Tele grava)/i],
    ['Reclamações e Outros', /./],
  ];

  function categoriaDe(nome) {
    for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i][1].test(nome)) return CATEGORIAS[i][0];
    return CATEGORIAS[CATEGORIAS.length - 1][0];
  }

  (function agruparServicos() {
    var nav = document.getElementById('service_nav');
    if (!nav) return;
    var grupos = {};
    CATEGORIAS.forEach(function(c) {
      var g = document.createElement('div');
      g.className = 'svc-grupo';
      var h = document.createElement('div');
      h.className = 'svc-grupo-titulo';
      h.textContent = c[0];
      g.appendChild(h);
      grupos[c[0]] = g;
    });
    Array.prototype.slice.call(nav.querySelectorAll('.sub-btn')).forEach(function(b) {
      grupos[categoriaDe(b.textContent.trim())].appendChild(b);
    });
    CATEGORIAS.forEach(function(c) {
      if (grupos[c[0]].children.length > 1) nav.appendChild(grupos[c[0]]);
    });
  })();

  // ---- Mais usados (últimos 30 dias do histórico deste computador) ----
  function botaoServicoPorNome(nome, sf) {
    var btns = document.querySelectorAll('#service_nav .sub-btn');
    var porSf = null;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].textContent.trim() === nome) return btns[i];
      if (!porSf && (btns[i].getAttribute('data-click') || '').indexOf("'" + sf + "'") >= 0) porSf = btns[i];
    }
    return porSf;
  }

  function renderMaisUsados() {
    var caixa = document.getElementById('mais_usados');
    if (!caixa || typeof histLer !== 'function') return;
    var contagem = {};
    histLer().forEach(function(h) {
      var nome = String(h.servico || '').split(' — ')[0];
      var b = botaoServicoPorNome(nome, h.sf);
      if (!b) return;
      var chave = b.getAttribute('data-click');
      contagem[chave] = contagem[chave] || { botao: b, n: 0 };
      contagem[chave].n++;
    });
    var top = Object.keys(contagem).map(function(k) { return contagem[k]; })
      .sort(function(a, b) { return b.n - a.n; }).slice(0, 6);
    caixa.innerHTML = '';
    caixa.style.display = top.length ? '' : 'none';
    if (!top.length) return;
    var rot = document.createElement('span');
    rot.className = 'mais-usados-rotulo';
    rot.textContent = 'Mais usados';
    caixa.appendChild(rot);
    top.forEach(function(it) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip-servico';
      chip.textContent = it.botao.textContent.trim();
      chip.addEventListener('click', function() { it.botao.click(); });
      caixa.appendChild(chip);
    });
  }
  renderMaisUsados();
  if (typeof salvarNoHistorico === 'function') {
    var salvarNoHistoricoOriginal = salvarNoHistorico;
    salvarNoHistorico = function() {
      salvarNoHistoricoOriginal.apply(null, arguments);
      renderMaisUsados();
    };
  }

  // ---- Atalhos de teclado ----
  //   /           → busca de serviço
  //   Ctrl+Enter  → gera o texto do serviço aberto
  document.addEventListener('keydown', function(ev) {
    var alvo = ev.target;
    var digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable);
    if (ev.key === '/' && !digitando && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      var busca = document.getElementById('busca_servico');
      var painel = document.getElementById('painel_agenda');
      if (busca && painel && painel.style.display !== 'none') { ev.preventDefault(); busca.focus(); busca.select(); }
      return;
    }
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      var aberto = document.querySelector('.subform.active');
      if (!aberto || (document.getElementById('painel_agenda') || {}).style.display === 'none') return;
      var gerar = aberto.querySelector(':scope > .actions .btn:not(.btn-clear):not(.btn-edit)');
      if (gerar) { ev.preventDefault(); gerar.click(); }
    }
  });
