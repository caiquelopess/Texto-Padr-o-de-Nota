  // === BALÕES INFORMATIVOS (#12) ===
  // Ao parar o mouse (ou focar pelo teclado) num elemento com data-dica ou title,
  // aparece um balão explicando o que ele faz. O "title" nativo é convertido para
  // não aparecer duas vezes.
  var DICAS = {
    '[data-aba="agenda"]': 'Gerar textos de Agenda e Nota para o SAP',
    '[data-aba="tensao"]': 'Consultar a tensão de fornecimento por município',
    '[data-aba="calc"]': 'Calcular a leitura esperada para refaturamento',
    '[data-aba="decl"]': 'Montar a declaração de ligação para impressão',
    '[data-aba="pend"]': 'Atendimentos guardados para terminar depois',
    '[data-aba="form"]': 'Buscar, ver e imprimir formulários',
    '#btn_alternar_servicos': 'Mostrar ou esconder a lista completa de serviços',
    '#busca_servico': 'Digite parte do nome do serviço (atalho: tecla /)',
    '.copy-btn': 'Copia o texto para colar no SAP',
    '.subform > .actions .btn:not(.btn-clear):not(.btn-edit)': 'Gera o texto e já copia (atalho: Ctrl+Enter)',
    '.subform > .actions .btn-clear': 'Apaga tudo o que foi preenchido neste serviço',
    '#btn_usuario': 'Sua conta: tema, sugestões, senha e sair',
  };
  function aplicarDicas(raiz) {
    Object.keys(DICAS).forEach(function(sel) {
      (raiz || document).querySelectorAll(sel).forEach(function(el) {
        if (!el.hasAttribute('data-dica')) el.setAttribute('data-dica', DICAS[sel]);
      });
    });
  }
  var balao = document.createElement('div');
  balao.className = 'balao-dica';
  balao.id = 'balao_dica';
  balao.setAttribute('role', 'tooltip');
  document.body.appendChild(balao);
  var dicaTimer = null, dicaAlvo = null;

  function alvoComDica(el) {
    while (el && el !== document.body) {
      if (el.nodeType === 1) {
        if (el.hasAttribute('title') && el.getAttribute('title')) {
          el.setAttribute('data-dica', el.getAttribute('title'));
          el.removeAttribute('title');
        }
        if (el.hasAttribute('data-dica')) return el;
      }
      el = el.parentNode;
    }
    return null;
  }
  function mostrarDica(el) {
    dicaAlvo = el;
    balao.textContent = el.getAttribute('data-dica');
    balao.classList.add('visivel');
    el.setAttribute('aria-describedby', 'balao_dica');
    var r = el.getBoundingClientRect(), b = balao.getBoundingClientRect();
    // na barra lateral (computador), o balão fica à direita para não cobrir os outros itens
    if (el.closest('.lateral') && window.innerWidth > 900 && r.right + b.width + 12 < window.innerWidth) {
      balao.classList.remove('abaixo');
      balao.style.left = r.right + 10 + 'px';
      balao.style.top = r.top + r.height / 2 - b.height / 2 + 'px';
      return;
    }
    var x = Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 8);
    var y = r.top - b.height - 8;
    balao.classList.toggle('abaixo', y < 8);
    if (y < 8) y = r.bottom + 8;
    balao.style.left = x + 'px';
    balao.style.top = y + 'px';
  }
  function esconderDica() {
    clearTimeout(dicaTimer);
    if (dicaAlvo) dicaAlvo.removeAttribute('aria-describedby');
    dicaAlvo = null;
    balao.classList.remove('visivel');
  }
  document.addEventListener('mouseover', function(ev) {
    var el = alvoComDica(ev.target);
    if (el === dicaAlvo) return;
    esconderDica();
    if (el) dicaTimer = setTimeout(function() { mostrarDica(el); }, 450);
  });
  document.addEventListener('focusin', function(ev) {
    var el = alvoComDica(ev.target);
    esconderDica();
    if (el && ev.target.matches(':focus-visible')) mostrarDica(el);
  });
  document.addEventListener('focusout', esconderDica);
  document.addEventListener('mousedown', esconderDica);
  document.addEventListener('keydown', function(ev) { if (ev.key === 'Escape') esconderDica(); });
  window.addEventListener('scroll', esconderDica, true);
  aplicarDicas();
