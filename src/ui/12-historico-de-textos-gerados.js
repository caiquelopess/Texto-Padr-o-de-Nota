  // === HISTÓRICO DE TEXTOS GERADOS ===
  // Cada texto gerado (NOTA + AGENDA) é guardado no localStorage deste
  // navegador, com data/hora e serviço. Fica só nesta máquina; mantém os
  // últimos 90 dias (no máximo 5000 registros).
  var HIST_CHAVE = AMBIENTE_TESTE ? 'tp_teste_historico_v1' : 'tp_historico_v1';
  var HIST_DIAS = 90, HIST_MAX = 5000;

  function histLer() {
    try { var a = JSON.parse(localStorage.getItem(HIST_CHAVE) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function histGravar(lista) {
    try { localStorage.setItem(HIST_CHAVE, JSON.stringify(lista)); return true; }
    catch (e) {
      // Armazenamento cheio: descarta os mais antigos e tenta de novo.
      try { localStorage.setItem(HIST_CHAVE, JSON.stringify(lista.slice(0, Math.floor(lista.length / 2)))); return true; } catch (e2) { return false; }
    }
  }
  function histDiaISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function histNomeServico(containerId) {
    if (nomeServicoAtivo[containerId]) return nomeServicoAtivo[containerId];
    var nome = containerId;
    var btn = document.querySelector('#service_nav .sub-btn[data-click*="\'' + containerId + '\'"]');
    if (btn) nome = btn.textContent.trim();
    var contNome = document.getElementById(containerId);
    if (!btn && contNome && contNome.getAttribute('data-nome')) nome = contNome.getAttribute('data-nome');
    // Se o formulário começa com um seletor de opção/tipo, acrescenta a opção escolhida.
    var cont = document.getElementById(containerId);
    var primeiro = cont ? cont.querySelector('.form-grid > .field-group.full-width:first-child select') : null;
    if (primeiro && primeiro.selectedIndex >= 0) {
      var opc = primeiro.options[primeiro.selectedIndex].text.trim();
      if (opc && opc.toLowerCase() !== nome.toLowerCase()) nome += ' — ' + opc;
    }
    return nome;
  }
  function salvarNoHistorico(containerId, notaTxt, agendaTxt, dados) {
    if (!notaTxt && !agendaTxt) return;
    var agora = new Date();
    var limite = agora.getTime() - HIST_DIAS * 86400000;
    var lista = histLer().filter(function(h) { return h && h.ts >= limite; });
    lista.unshift({
      id: agora.getTime().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: agora.getTime(), dia: histDiaISO(agora),
      sf: containerId, servico: histNomeServico(containerId),
      nota: notaTxt || '', agenda: agendaTxt || '', dados: dados || null
    });
    if (lista.length > HIST_MAX) lista = lista.slice(0, HIST_MAX);
    histGravar(lista);
    atualizarContadorHistorico();
  }
  function atualizarContadorHistorico() {
    var el = document.getElementById('hist_contador_hoje');
    if (!el) return;
    var hoje = histDiaISO(new Date());
    var n = histLer().filter(function(h) { return h.dia === hoje; }).length;
    el.textContent = n ? String(n) : '';
    el.classList.toggle('tem', n > 0);
  }

  var histExibidos = [];
  function histFiltrar() {
    var dia = getVal('hist_data'), serv = getVal('hist_servico'), busca = getVal('hist_busca').toLowerCase();
    return histLer().filter(function(h) {
      if (dia && h.dia !== dia) return false;
      if (serv && h.servico !== serv) return false;
      if (busca && (h.servico + '\n' + h.nota + '\n' + h.agenda).toLowerCase().indexOf(busca) < 0) return false;
      return true;
    });
  }
  function histDataBR(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }
  function histHora(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  function renderHistorico() {
    var todos = histLer();
    // opções de serviço (do dia escolhido)
    var sel = document.getElementById('hist_servico');
    var atual = sel.value, dia = getVal('hist_data');
    var nomes = {};
    todos.forEach(function(h) { if (!dia || h.dia === dia) nomes[h.servico] = (nomes[h.servico] || 0) + 1; });
    sel.innerHTML = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Todos'; sel.appendChild(o0);
    Object.keys(nomes).sort().forEach(function(n) {
      var o = document.createElement('option'); o.value = n; o.textContent = n + ' (' + nomes[n] + ')'; sel.appendChild(o);
    });
    sel.value = nomes[atual] ? atual : '';

    histExibidos = histFiltrar();
    var resumo = document.getElementById('hist_resumo');
    resumo.textContent = histExibidos.length + (histExibidos.length === 1 ? ' texto gerado' : ' textos gerados') + (dia ? ' em ' + histDataBR(dia) : ' (todos os dias)');
    var lista = document.getElementById('hist_lista');
    lista.innerHTML = '';
    if (!histExibidos.length) {
      var v = document.createElement('div'); v.className = 'hist-vazio'; v.textContent = 'Nenhum texto encontrado para este filtro.'; lista.appendChild(v);
      return;
    }
    histExibidos.forEach(function(h) {
      var item = document.createElement('div'); item.className = 'hist-item';
      var topo = document.createElement('div'); topo.className = 'hist-item-topo';
      var hora = document.createElement('span'); hora.className = 'hist-hora'; hora.textContent = (dia ? '' : histDataBR(h.dia) + ' ') + histHora(h.ts);
      var serv = document.createElement('span'); serv.className = 'hist-serv'; serv.textContent = h.servico;
      var acoes = document.createElement('div'); acoes.className = 'hist-item-acoes';
      function botao(txt, acao, cls) { var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; if (cls) b.className = cls; b.setAttribute('data-click', acao + "('" + h.id + "')"); acoes.appendChild(b); }
      if (h.nota) botao('Copiar nota', 'histCopiarNota');
      if (h.agenda) botao('Copiar agenda', 'histCopiarAgenda');
      botao('Abrir na tela', 'histAbrir');
      botao('Excluir', 'histExcluir', 'hist-del');
      topo.appendChild(hora); topo.appendChild(serv); topo.appendChild(acoes);
      item.appendChild(topo);
      [[h.sf === 'sf-decl' ? 'RESUMO' : 'NOTA', h.nota], [h.sf === 'sf-decl' ? 'DECLARAÇÃO' : (h.sf === 'sf-refat-urg' ? 'TEXTO' : 'AGENDA'), h.agenda]].forEach(function(par) {
        if (!par[1]) return;
        var pre = document.createElement('pre'); pre.className = 'hist-texto';
        var r = document.createElement('span'); r.className = 'hist-rotulo'; r.textContent = par[0];
        pre.appendChild(r); pre.appendChild(document.createTextNode(par[1]));
        item.appendChild(pre);
      });
      lista.appendChild(item);
    });
  }

  function histAchar(id) { var l = histLer(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function histCopiarTexto(txt) {
    function ok() { mostrarAviso('Texto copiado.'); }
    function planoB() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var feito = false; try { feito = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (feito) ok(); else mostrarAviso('Não foi possível copiar automaticamente. Use "Abrir na tela" e copie com Ctrl+C.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, planoB); else planoB();
  }
  function histCopiarNota(id) { var h = histAchar(id); if (h) histCopiarTexto(h.nota); }
  function histCopiarAgenda(id) { var h = histAchar(id); if (h) histCopiarTexto(h.agenda); }
  function histAbrir(id) {
    var h = histAchar(id); if (!h) return;
    if (h.sf === 'sf-refat-urg') {
      mostrarAbaPrincipal('calc');
      document.getElementById('ru_out').value = h.agenda;
      fecharHistorico();
      document.getElementById('ru_out').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (h.sf === 'sf-decl' && h.dados) {
      var dd = h.dados;
      mostrarAbaPrincipal('decl');
      [['decl_cliente', 'cliente'], ['decl_codigo', 'codigo'], ['decl_doc', 'doc'], ['decl_end', 'end'], ['decl_bairro', 'bairro'],
       ['decl_mun', 'mun'], ['decl_inicio', 'inicio'], ['decl_fim', 'fim'], ['decl_cidade', 'cidade'], ['decl_emissao', 'emissaoData']].forEach(function(par) {
        var el = document.getElementById(par[0]); if (el) el.value = dd[par[1]] || '';
      });
      document.getElementById('decl_situacao').value = dd.fim ? 'encerrado' : 'ativo';
      toggleDeclEncerramento();
      fecharHistorico();
      mostrarDeclaracao(dd);   // reabre exatamente como foi emitida (mesma data de emissão)
      return;
    }
    var calc = h.sf === 'sf-calc-refat';
    mostrarAbaPrincipal(calc ? 'calc' : 'agenda');
    if (!calc) mostrarCaixaNota(!!h.nota);
    document.getElementById(calc ? 'calc_out_nota' : 'out-nota').value = h.nota;
    document.getElementById(calc ? 'calc_out_agenda' : 'out-agenda').value = h.agenda;
    fecharHistorico();
    var alvo = document.getElementById(calc ? 'calc_out_nota' : 'out-agenda');
    if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function histExcluir(id) {
    if (!confirm('Excluir este texto do histórico?')) return;
    histGravar(histLer().filter(function(h) { return h.id !== id; }));
    renderHistorico(); atualizarContadorHistorico();
  }
  function limparHistorico() {
    if (!confirm('Apagar TODO o histórico de textos gerados deste computador? Isso não pode ser desfeito.')) return;
    try { localStorage.removeItem(HIST_CHAVE); } catch (e) {}
    renderHistorico(); atualizarContadorHistorico();
  }
  function exportarHistorico() {
    if (!histExibidos.length) { mostrarAviso('Não há textos para baixar com este filtro.'); return; }
    var dia = getVal('hist_data');
    var linhas = ['HISTÓRICO DE TEXTOS GERADOS' + (dia ? ' - ' + histDataBR(dia) : ''), 'Total: ' + histExibidos.length, ''];
    histExibidos.slice().reverse().forEach(function(h, i) {
      linhas.push('#' + (i + 1) + ' | ' + histDataBR(h.dia) + ' ' + histHora(h.ts) + ' | ' + h.servico);
      if (h.nota) linhas.push('NOTA:', h.nota);
      if (h.agenda) linhas.push('AGENDA:', h.agenda);
      linhas.push('----------------------------------------', '');
    });
    var blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'historico-textos-' + (dia || 'todos') + '.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
  }
  function abrirHistorico() {
    var d = document.getElementById('hist_data');
    if (!d.value) d.value = histDiaISO(new Date());
    renderHistorico();
    document.getElementById('hist_overlay').style.display = 'flex';
  }
  function fecharHistorico() { document.getElementById('hist_overlay').style.display = 'none'; }
  function fecharHistoricoFundo(el) { if (window.event && window.event.target === el) fecharHistorico(); }
  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape' && document.getElementById('hist_overlay').style.display !== 'none') fecharHistorico();
  });
  atualizarContadorHistorico();

