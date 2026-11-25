  // === MODELOS PUBLICADOS PELO PAINEL ===
  // Busca só a versão publicada dos modelos (/api/modelos) e monta cada um como um
  // serviço comum. Guarda a última lista recebida no navegador: se o servidor falhar,
  // o atendimento continua com ela (e os serviços embutidos nunca dependem disso).
  // Os dados digitados ficam só no navegador: o texto é montado aqui, pelo motor do núcleo.
  var MODELOS_CHAVE = AMBIENTE_TESTE ? 'tp_teste_modelos_v1' : 'tp_modelos_v1';
  var modelosMontados = {};

  function mdIdCampo(modeloId, campoId) { return 'md_' + modeloId.replace(/-/g, '_') + '__' + campoId; }

  function mdValores(m) {
    var v = {};
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdIdCampo(m.id, c.id));
      if (el) v[c.id] = el.value;
    });
    return v;
  }

  function mdAtualizarVisiveis(m) {
    var visiveis = {};
    mdCamposVisiveis(m, mdValores(m)).forEach(function(c) { visiveis[c.id] = true; });
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdIdCampo(m.id, c.id));
      if (el) el.closest('.field-group').style.display = visiveis[c.id] ? '' : 'none';
    });
  }

  function mdGerarTexto(m) {
    var sf = 'sf-md-' + m.id;
    var erros = mdValidarValores(m, mdValores(m));
    if (erros.length) { mostrarAviso('ATENÇÃO: ' + erros[0]); return; }
    var t = mdGerar(m, mdValores(m));
    finalizarGeracao(sf, t.nota, t.agenda, m.copiar === 'agenda' ? 'agenda' : 'nota');
  }

  function mdCriarCampo(m, c) {
    var grupo = document.createElement('div');
    grupo.className = 'field-group' + (c.tipo === 'textoLongo' || c.tipo === 'opcao' ? ' full-width' : '');
    var id = mdIdCampo(m.id, c.id);
    var rot = document.createElement('label');
    rot.setAttribute('for', id);
    rot.textContent = c.rotulo + (c.obrigatorio ? ' *' : '');
    grupo.appendChild(rot);
    var el;
    if (c.tipo === 'opcao') {
      el = document.createElement('select');
      c.opcoes.forEach(function(o) { var op = document.createElement('option'); op.value = o; op.textContent = o; el.appendChild(op); });
      el.addEventListener('change', function() { mdAtualizarVisiveis(m); });
    } else if (c.tipo === 'textoLongo') {
      el = document.createElement('textarea');
      el.rows = 3;
    } else {
      el = document.createElement('input');
      el.type = 'text';
      if (c.tipo === 'telefone') { el.setAttribute('inputmode', 'tel'); el.placeholder = 'Ex: 71993501519'; }
      if (c.tipo === 'email') { el.setAttribute('inputmode', 'email'); el.placeholder = 'cliente@email.com ou Não informado'; }
      if (c.tipo === 'data') { el.placeholder = 'dd/mm/aaaa'; el.setAttribute('data-input', 'mascararData(this)'); }
      if (c.tipo === 'numero') el.setAttribute('inputmode', 'numeric');
    }
    el.id = id;
    el.addEventListener('input', function() { mdAtualizarVisiveis(m); });
    grupo.appendChild(el);
    return grupo;
  }

  function mdMontar(m) {
    var sf = 'sf-md-' + m.id;
    var antigo = document.getElementById(sf);
    if (antigo) antigo.remove();
    var botaoAntigo = document.querySelector('#service_nav .sub-btn[data-modelo="' + m.id + '"]');
    if (botaoAntigo) botaoAntigo.remove();

    var form = document.createElement('div');
    form.className = 'subform';
    form.id = sf;
    form.setAttribute('data-nome', m.nome);
    (m.avisos || []).forEach(function(a) {
      var av = document.createElement('div');
      av.className = 'alert-box';
      av.textContent = a;
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
    gerar.textContent = 'Gerar Texto e Copiar ' + (m.copiar === 'agenda' ? 'AGENDA' : 'NOTA');
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

    // botão na lista de serviços, na categoria do modelo
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sub-btn';
    btn.setAttribute('data-modelo', m.id);
    btn.setAttribute('data-click', "trocarAba('" + sf + "', this)");
    btn.textContent = m.nome;
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
    grupo.appendChild(btn);
    modelosMontados[m.id] = m;
  }

  function mdAplicar(lista) {
    var novos = {};
    (lista || []).forEach(function(m) {
      if (!m || !m.id || mdValidarModelo(m).length) return; // ignora modelo com defeito, sem travar os outros
      novos[m.id] = true;
      try { mdMontar(m); } catch (e) { /* um modelo com problema não derruba o atendimento */ }
    });
    Object.keys(modelosMontados).forEach(function(id) {
      if (novos[id]) return;
      var f = document.getElementById('sf-md-' + id); if (f) f.remove();
      var b = document.querySelector('#service_nav .sub-btn[data-modelo="' + id + '"]'); if (b) b.remove();
      delete modelosMontados[id];
    });
    if (typeof aplicarAtendimentoAtual === 'function') aplicarAtendimentoAtual(); // modelos também seguem a organização publicada
    var n = document.querySelectorAll('#service_nav .sub-btn').length;
    var cont = document.getElementById('svc_count');
    if (cont) cont.textContent = n + (n === 1 ? ' serviço' : ' serviços');
  }

  function carregarModelos() {
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(MODELOS_CHAVE) || 'null'); } catch (e) { guardado = null; }
    if (guardado && Array.isArray(guardado.modelos)) mdAplicar(guardado.modelos);
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
