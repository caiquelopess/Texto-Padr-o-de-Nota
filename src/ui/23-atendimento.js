  // === CATEGORIAS, SERVIÇOS OCULTOS E SCRIPTS (publicados pelo painel) ===
  // Aplica a configuração publicada em /api/atendimento: ordem e nome das categorias,
  // em que categoria cada serviço aparece, serviços ocultos e o roteiro (falas +
  // checklist) de cada serviço. Sem servidor, usa a cópia guardada; sem cópia, a
  // organização padrão continua valendo.
  // Scripts (falas + checklist) prontos, mas ocultos por decisão do responsável.
  var SCRIPTS_ATIVOS = false;
  var ATENDIMENTO_CHAVE = AMBIENTE_TESTE ? 'tp_teste_atendimento_v1' : 'tp_atendimento_v1';
  var atendimentoAtual = null;

  function idDoBotao(b) {
    var m = /trocarAba\('([^']+)'/.exec(b.getAttribute('data-click') || '');
    return m ? m[1] : '';
  }

  function aplicarAtendimentoAtual() {
    var doc = atendimentoAtual;
    var nav = document.getElementById('service_nav');
    if (!doc || !nav) return;
    var ocultos = document.getElementById('servicos_ocultos');
    if (!ocultos) {
      ocultos = document.createElement('div');
      ocultos.id = 'servicos_ocultos';
      ocultos.hidden = true;
      nav.parentNode.insertBefore(ocultos, nav.nextSibling);
    }
    var botoes = Array.prototype.slice.call(document.querySelectorAll('#service_nav .sub-btn, #servicos_ocultos .sub-btn'));
    botoes.forEach(function(b) {
      if (!b.hasAttribute('data-cat-original')) {
        var g = b.closest('.svc-grupo');
        b.setAttribute('data-cat-original', g ? g.querySelector('.svc-grupo-titulo').textContent : 'Reclamações e Outros');
      }
    });
    var ordem = (doc.categorias || []).map(function(c) { return c.nome; });
    var grupos = {};
    var criarGrupo = function(nome) {
      var g = document.createElement('div');
      g.className = 'svc-grupo';
      var t = document.createElement('div');
      t.className = 'svc-grupo-titulo';
      t.textContent = nome;
      g.appendChild(t);
      grupos[nome] = g;
      return g;
    };
    ordem.forEach(criarGrupo);
    botoes.forEach(function(b) {
      var id = idDoBotao(b);
      var conf = (doc.servicos || {})[id] || {};
      if (conf.oculto) { ocultos.appendChild(b); return; }
      var cat = conf.categoria || b.getAttribute('data-cat-original');
      (grupos[cat] || criarGrupo(cat)).appendChild(b);
    });
    nav.querySelectorAll('.svc-grupo').forEach(function(g) { g.remove(); });
    Object.keys(grupos).forEach(function(nome) { if (grupos[nome].children.length > 1) nav.appendChild(grupos[nome]); });
    var n = nav.querySelectorAll('.sub-btn').length;
    var cont = document.getElementById('svc_count');
    if (cont) cont.textContent = n + (n === 1 ? ' serviço' : ' serviços');
    var ativo = document.querySelector('.subform.active');
    if (ativo) mostrarRoteiro(ultimoServicoEscolhido || ativo.id);
  }

  // ---- roteiro (falas) e checklist do serviço aberto ----
  var ultimoServicoEscolhido = '';
  function mostrarRoteiro(id) {
    if (!SCRIPTS_ATIVOS) return;
    ultimoServicoEscolhido = id;
    var sf = document.getElementById(String(id).split('|')[0]);
    if (!sf) return;
    var caixa = sf.querySelector(':scope > .roteiro');
    var sc = atendimentoAtual && (atendimentoAtual.scripts || {})[id];
    if (!sc || (!(sc.falas || []).length && !(sc.checklist || []).length)) { if (caixa) caixa.remove(); return; }
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.className = 'roteiro';
      sf.insertBefore(caixa, sf.firstChild);
    }
    caixa.innerHTML = '';
    if ((sc.falas || []).length) {
      var t1 = document.createElement('div');
      t1.className = 'roteiro-titulo';
      t1.textContent = 'Roteiro de atendimento';
      caixa.appendChild(t1);
      var ol = document.createElement('ol');
      ol.className = 'roteiro-falas';
      sc.falas.forEach(function(f) { var li = document.createElement('li'); li.textContent = f; ol.appendChild(li); });
      caixa.appendChild(ol);
    }
    if ((sc.checklist || []).length) {
      var t2 = document.createElement('div');
      t2.className = 'roteiro-titulo';
      t2.textContent = 'Checklist antes de gerar';
      caixa.appendChild(t2);
      sc.checklist.forEach(function(item, i) {
        var lab = document.createElement('label');
        lab.className = 'roteiro-check';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'chk_' + sf.id + '_' + i;
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(' ' + item));
        caixa.appendChild(lab);
      });
    }
  }
  document.addEventListener('click', function(ev) {
    var b = ev.target.closest && ev.target.closest('#service_nav .sub-btn, #busca_sugestoes .sug-item');
    if (!b) return;
    var id = idDoBotao(b) || (/selecionarSugestaoBusca\('([^']+)'/.exec(b.getAttribute('data-click') || '') || [])[1];
    if (id) setTimeout(function() { mostrarRoteiro(id); }, 0);
  });

  function carregarAtendimento() {
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(ATENDIMENTO_CHAVE) || 'null'); } catch (e) { guardado = null; }
    if (guardado && guardado.categorias) { atendimentoAtual = guardado; aplicarAtendimentoAtual(); }
    if (!NA_WEB || !window.fetch) return;
    fetch('/api/atendimento', { cache: 'no-store', credentials: 'same-origin' })
      .then(function(r) {
        var ct = r.headers.get('content-type') || '';
        if (!r.ok || ct.indexOf('json') < 0) throw new Error('indisponível');
        return r.json();
      })
      .then(function(d) {
        if (!d || !d.documento || !d.documento.categorias) return;
        try { localStorage.setItem(ATENDIMENTO_CHAVE, JSON.stringify(d.documento)); } catch (e) {}
        atendimentoAtual = d.documento;
        aplicarAtendimentoAtual();
      })
      .catch(function() { /* sem servidor: segue com a cópia guardada ou a organização padrão */ });
  }
  carregarAtendimento();
