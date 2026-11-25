  // === MODELOS PUBLICADOS PELO PAINEL ===
  // Busca só a versão publicada dos modelos (/api/modelos) e monta cada um como um
  // serviço comum. Guarda a última lista recebida no navegador: se o servidor falhar,
  // o atendimento continua com ela (e os serviços embutidos nunca dependem disso).
  // Os dados digitados ficam só no navegador: o texto é montado aqui, pelo motor do núcleo.
  var MODELOS_CHAVE = AMBIENTE_TESTE ? 'tp_teste_modelos_v1' : 'tp_modelos_v1';
  var modelosMontados = {};

  function mdIdCampo(modeloId, campoId) { return 'md_' + modeloId.replace(/-/g, '_') + '__' + campoId; }
  // Modelos migrados do código guardam os ids antigos (subformulário e campos), para
  // não quebrar histórico, pendências e a configuração de categorias.
  function mdSf(m) { return m.sf || 'sf-md-' + m.id; }
  function mdElemento(m, c) { return c.elementoId || mdIdCampo(m.id, c.id); }

  function mdValores(m) {
    var v = {};
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdElemento(m, c));
      if (el) v[c.id] = el.value;
    });
    return v;
  }

  function mdAtualizarVisiveis(m) {
    var visiveis = {};
    mdCamposVisiveis(m, mdValores(m)).forEach(function(c) { visiveis[c.id] = true; });
    var valores = mdValores(m);
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdElemento(m, c));
      if (!el) return;
      var grupo = el.closest('.field-group');
      grupo.style.display = visiveis[c.id] && !c.oculto ? '' : 'none';
      // rótulo que muda conforme outro campo (ex.: PJ pede o representante legal)
      if (c.rotuloSe) grupo.querySelector('label').textContent = mdRotulo(c, valores) + (c.obrigatorio ? ' *' : '');
    });
    // avisos que dependem da escolha (ex.: OneCode só em "Correção de Nome")
    var form = document.getElementById(mdSf(m));
    (m.avisos || []).forEach(function(a, i) {
      if (!a || typeof a !== 'object' || !a.mostrarSe) return;
      var el = form && form.querySelector('[data-aviso="' + i + '"]');
      if (el) el.style.display = [].concat(a.mostrarSe.igual).indexOf(String(valores[a.mostrarSe.campo] || '')) >= 0 ? 'block' : 'none';
    });
  }

  // "Preencher se": quando o campo de origem muda para o valor indicado, o campo recebe
  // um valor pronto (ex.: MMGD "Não" → Tarefa Neo "nao"); se muda para outro, o valor
  // automático sai (o que o atendente digitou fica).
  function mdPreencherAuto(m, origem) {
    var valores = mdValores(m);
    (m.campos || []).forEach(function(c) {
      var r = c.preencherSe;
      if (!r || (origem && r.campo !== origem)) return;
      var el = document.getElementById(mdElemento(m, c));
      if (!el) return;
      if ([].concat(r.igual).indexOf(String(valores[r.campo] || '')) >= 0) el.value = r.valor;
      else if (el.value === r.valor) el.value = '';
    });
  }

  function mdGerarTexto(m) {
    var sf = mdSf(m);
    // 1) padroniza (datas, telefones) e grava o valor corrigido no campo, como antes
    var p = mdNormalizarValores(m, mdValores(m));
    if (p.erros.length) { mostrarAviso('ATENÇÃO: ' + p.erros[0]); return; }
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdElemento(m, c));
      if (el && el.tagName !== 'SELECT' && p.valores[c.id] !== undefined && el.value !== p.valores[c.id]) el.value = p.valores[c.id];
    });
    // 2) confere obrigatórios e formatos; 3) monta o texto
    var erros = mdValidarValores(m, p.valores);
    if (erros.length) { mostrarAviso('ATENÇÃO: ' + erros[0]); return; }
    var t = mdGerar(m, p.valores);
    finalizarGeracao(sf, t.nota, t.agenda, m.copiar === 'agenda' ? 'agenda' : 'nota');
  }

  function mdCriarCampo(m, c) {
    var grupo = document.createElement('div');
    grupo.className = 'field-group' + (c.largo !== false && (c.largo || c.tipo === 'textoLongo' || c.tipo === 'opcao') ? ' full-width' : '');
    var id = mdElemento(m, c);
    var rot = document.createElement('label');
    rot.setAttribute('for', id);
    rot.textContent = c.rotulo + (c.obrigatorio ? ' *' : '');
    grupo.appendChild(rot);
    var el;
    if (c.tipo === 'opcao') {
      el = document.createElement('select');
      c.opcoes.forEach(function(o, i) { var op = document.createElement('option'); op.value = o; op.textContent = (c.rotulosOpcoes && c.rotulosOpcoes[i]) || o; el.appendChild(op); });
      el.addEventListener('change', function() { mdPreencherAuto(m, c.id); mdAtualizarVisiveis(m); });
    } else if (c.tipo === 'textoLongo') {
      el = document.createElement('textarea');
      el.rows = 3;
    } else {
      el = document.createElement('input');
      el.type = 'text';
      if (c.tipo === 'telefone') { el.setAttribute('inputmode', 'tel'); el.placeholder = 'Ex: 71993501519'; }
      if (c.tipo === 'email') { el.setAttribute('inputmode', 'email'); el.placeholder = 'cliente@email.com ou Não informado'; }
      if (c.tipo === 'data') { el.placeholder = 'dd/mm/aaaa'; el.setAttribute('data-input', 'mascararData(this)'); }
      if (c.tipo === 'dataOuMes') { el.placeholder = 'dd/mm/aaaa ou mm/aaaa'; el.setAttribute('data-input', 'mascararDataOuMes(this)'); }
      if (c.tipo === 'documento') el.placeholder = c.documento === 'cnpj' ? '00.000.000/0000-00' : 'CPF ou CNPJ — somente números';
      if (c.tipo === 'numero') el.setAttribute('inputmode', 'numeric');
      if (c.dica) el.placeholder = c.dica;
    }
    el.id = id;
    if (c.obrigatorio && c.tipo !== 'opcao') el.required = true;
    el.addEventListener('input', function() { mdAtualizarVisiveis(m); });
    grupo.appendChild(el);
    return grupo;
  }

  function mdMontar(m) {
    var sf = mdSf(m);
    var antigo = document.getElementById(sf);
    if (antigo) antigo.remove();
    document.querySelectorAll('#service_nav .sub-btn[data-modelo="' + m.id + '"]').forEach(function(b) { b.remove(); });

    var form = document.createElement('div');
    form.className = 'subform';
    form.id = sf;
    form.setAttribute('data-nome', m.nome);
    (m.avisos || []).forEach(function(a, i) {
      var av = document.createElement('div');
      var obj = a && typeof a === 'object';
      av.className = obj && a.classeOriginal && m._embutido ? a.classeOriginal : 'alert-box' + (obj && a.piscar ? ' alert-box-blink' : '') + (obj && a.classe ? ' ' + a.classe : '');
      // HTML só para modelos embutidos (vêm do repositório); os do painel são sempre texto puro
      if (obj && a.html && m._embutido) av.innerHTML = a.html;
      else av.textContent = obj ? a.texto || '' : a;
      if (obj && a.estilo && m._embutido) av.setAttribute('style', a.estilo);
      av.setAttribute('data-aviso', String(i));
      if (obj && a.id) av.id = a.id;
      form.appendChild(av);
    });
    var grade = document.createElement('div');
    grade.className = 'form-grid';
    (m.campos || []).forEach(function(c) { grade.appendChild(mdCriarCampo(m, c)); });
    form.appendChild(grade);
    var acoes = document.createElement('div');
    acoes.className = 'actions';
    var gerar = document.createElement('button');
    gerar.type = 'button';
    gerar.className = 'btn';
    gerar.textContent = m.botao || 'Gerar Texto e Copiar ' + (m.copiar === 'agenda' ? 'AGENDA' : 'NOTA');
    gerar.addEventListener('click', function() { mdGerarTexto(m); });
    var limpar = document.createElement('button');
    limpar.type = 'button';
    limpar.className = 'btn btn-clear';
    limpar.textContent = 'Limpar Tudo';
    limpar.addEventListener('click', function() {
      limparForm(sf);
      form.querySelectorAll('select').forEach(function(s) { s.selectedIndex = 0; });
      mdAtualizarVisiveis(m);
    });
    acoes.appendChild(gerar);
    acoes.appendChild(limpar);
    form.appendChild(acoes);
    var ultimo = document.querySelectorAll('#painel_agenda .subform');
    var ref = ultimo[ultimo.length - 1];
    ref.parentNode.insertBefore(form, ref.nextSibling);
    mdAtualizarVisiveis(m);

    // botão na lista de serviços, na categoria do modelo (um por subtipo, quando houver)
    var botoes = m.subtipos
      ? m.subtipos.botoes.map(function(b) { return { alvo: sf + '|' + b.valor, nome: b.nome }; })
      : [{ alvo: sf, nome: m.nome }];
    var grupo = null;
    document.querySelectorAll('#service_nav .svc-grupo').forEach(function(g) {
      if (g.querySelector('.svc-grupo-titulo').textContent === m.categoria) grupo = g;
    });
    if (!grupo) {
      grupo = document.createElement('div');
      grupo.className = 'svc-grupo';
      var tit = document.createElement('div');
      tit.className = 'svc-grupo-titulo';
      tit.textContent = m.categoria;
      grupo.appendChild(tit);
      document.getElementById('service_nav').appendChild(grupo);
    }
    botoes.forEach(function(b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-btn';
      btn.setAttribute('data-modelo', m.id);
      btn.setAttribute('data-click', "trocarAba('" + b.alvo + "', this)");
      btn.textContent = b.nome;
      grupo.appendChild(btn);
    });
    modelosMontados[m.id] = m;
  }

  function mdAplicar(publicados) {
    // embutidos primeiro; um modelo publicado com o mesmo id substitui o embutido
    var porId = {};
    (typeof MODELOS_EMBUTIDOS !== 'undefined' ? MODELOS_EMBUTIDOS : []).forEach(function(m) { m._embutido = true; porId[m.id] = m; });
    (publicados || []).forEach(function(m) { if (m && m.id) porId[m.id] = m; });
    var lista = Object.keys(porId).map(function(k) { return porId[k]; });
    var novos = {};
    lista.forEach(function(m) {
      if (!m || !m.id || mdValidarModelo(m).length) return; // ignora modelo com defeito, sem travar os outros
      novos[m.id] = true;
      try { mdMontar(m); } catch (e) { /* um modelo com problema não derruba o atendimento */ }
    });
    Object.keys(modelosMontados).forEach(function(id) {
      if (novos[id]) return;
      var f = document.getElementById(mdSf(modelosMontados[id])); if (f) f.remove();
      document.querySelectorAll('#service_nav .sub-btn[data-modelo="' + id + '"]').forEach(function(b) { b.remove(); });
      delete modelosMontados[id];
    });
    if (typeof aplicarAtendimentoAtual === 'function') aplicarAtendimentoAtual();
    if (typeof montarListaServicosPend === 'function') montarListaServicosPend(); // pendências também listam os modelos // modelos também seguem a organização publicada
    var n = document.querySelectorAll('#service_nav .sub-btn').length;
    var cont = document.getElementById('svc_count');
    if (cont) cont.textContent = n + (n === 1 ? ' serviço' : ' serviços');
  }

  function carregarModelos() {
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(MODELOS_CHAVE) || 'null'); } catch (e) { guardado = null; }
    mdAplicar(guardado && Array.isArray(guardado.modelos) ? guardado.modelos : []);
    if (!NA_WEB || !window.fetch) return;
    fetch('/api/modelos', { cache: 'no-store', credentials: 'same-origin' })
      .then(function(r) {
        var ct = r.headers.get('content-type') || '';
        if (!r.ok || ct.indexOf('json') < 0) throw new Error('indisponível');
        return r.json();
      })
      .then(function(d) {
        if (!d || !Array.isArray(d.modelos)) return;
        if (guardado && guardado.geral === d.geral && guardado.modelos.length === d.modelos.length) return;
        try { localStorage.setItem(MODELOS_CHAVE, JSON.stringify({ geral: d.geral, modelos: d.modelos })); } catch (e) {}
        mdAplicar(d.modelos);
      })
      .catch(function() { /* sem rede ou servidor fora: segue com a cópia guardada */ });
  }
  carregarModelos();

  // "Limpar" chamado de fora (pendências, testes): nos modelos, as listas voltam à
  // primeira opção e os campos/avisos condicionais são recalculados.
  var limparFormBase = limparForm;
  limparForm = function(containerId) {
    limparFormBase(containerId);
    Object.keys(modelosMontados).forEach(function(id) {
      var m = modelosMontados[id];
      if (mdSf(m) !== containerId) return;
      document.querySelectorAll('#' + containerId + ' select').forEach(function(sel) { sel.selectedIndex = 0; });
      (m.campos || []).forEach(function(c) {
        if (c.preencherSe && c.preencherSe.aoLimpar) mdPreencherAuto(m, c.preencherSe.campo);
      });
      mdAtualizarVisiveis(m);
    });
  };

  // Botão de subtipo (ex.: 'sf-tt|com_assuncao'): escolhe o valor no campo do subtipo.
  // Chamado ao abrir o botão, ao limpar e ao retomar uma pendência.
  var aplicarSubtipoBase = aplicarSubtipo;
  aplicarSubtipo = function(sf, sub) {
    aplicarSubtipoBase(sf, sub);
    Object.keys(modelosMontados).forEach(function(id) {
      var m = modelosMontados[id];
      if (mdSf(m) !== sf || !m.subtipos || !sub) return;
      var c = (m.campos || []).filter(function(x) { return x.id === m.subtipos.campo; })[0];
      var el = c && document.getElementById(mdElemento(m, c));
      if (!el || c.opcoes.indexOf(sub) < 0) return;
      el.value = sub;
      mdAtualizarVisiveis(m);
    });
  };
