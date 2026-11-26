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

  // Classes de aviso conhecidas (as demais são descartadas).
  var MD_CLASSES = ['alert-box', 'alert-box-blink', 'alerta-cnpj', 'alerta-pade', 'alert-setor'];
  function mdClassesSeguras(t) {
    return String(t || '').split(/\s+/).filter(function(c) { return MD_CLASSES.indexOf(c) >= 0; }).join(' ') || 'alert-box';
  }
  // Monta o aviso com uma lista fechada de marcações, sem atributos (nada de script, link ou estilo).
  var MD_TAGS = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, UL: 1, OL: 1, LI: 1 };
  function mdHtmlSeguro(destino, html) {
    var t = document.createElement('template');
    t.innerHTML = String(html || '');
    (function copiar(origem, para) {
      origem.childNodes.forEach(function(n) {
        if (n.nodeType === 3) para.appendChild(document.createTextNode(n.nodeValue));
        else if (n.nodeType === 1 && MD_TAGS[n.tagName]) copiar(n, para.appendChild(document.createElement(n.tagName)));
        else if (n.nodeType === 1 && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE') copiar(n, para);
      });
    })(t.content, destino);
  }

  function mdValores(m) {
    var v = {};
    (m.campos || []).forEach(function(c) {
      var el = document.getElementById(mdElemento(m, c));
      if (!el) return;
      if (c.tipo === 'faturas') {
        v[c.id] = [].slice.call(el.querySelectorAll('.fatura-row')).map(function(r) {
          return { vencimento: r.querySelector('.md-fat-venc').value, valor: r.querySelector('.md-fat-valor').value };
        });
      } else v[c.id] = el.value;
    });
    return v;
  }

  // ---- campo "faturas": linhas de vencimento + valor, como na Reclamação ----
  function mdLinhaFatura(m, lista) {
    var row = document.createElement('div');
    row.className = 'fatura-row';
    row.innerHTML = '<input type="text" class="md-fat-venc" placeholder="Vencimento: dd/mm/aaaa" inputmode="numeric" data-input="mascararData(this)" required>' +
      '<input type="text" class="md-fat-valor" placeholder="Valor R$: 0,00" inputmode="decimal" required>' +
      '<button type="button" class="btn-del" aria-label="Remover fatura">✕</button>';
    row.querySelector('.btn-del').addEventListener('click', function() {
      if (lista.querySelectorAll('.fatura-row').length > 1) row.remove();
      else row.querySelectorAll('input').forEach(function(i) { i.value = ''; });
      mdAtualizarVisiveis(m);
    });
    lista.appendChild(row);
    return row;
  }
  function mdLimparFaturas(m, lista) {
    lista.innerHTML = '';
    mdLinhaFatura(m, lista);
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
      // exemplo (placeholder) que muda conforme outro campo: lista de { campo, igual, dica }
      if (c.dicaSe) {
        var d = [].concat(c.dicaSe).filter(function(r) { return mdCondicao(r, valores); })[0];
        el.placeholder = d ? d.dica : c.dica || '';
      }
    });
    // avisos que dependem da escolha (ex.: OneCode só em "Correção de Nome")
    var form = document.getElementById(mdSf(m));
    (m.avisos || []).forEach(function(a, i) {
      if (!a || typeof a !== 'object' || !a.mostrarSe) return;
      var el = form && form.querySelector('[data-aviso="' + i + '"]');
      if (el) el.style.display = mdCondicao(a.mostrarSe, valores) ? 'block' : 'none';
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
      if (el && c.tipo === 'faturas') {
        // vencimentos corrigidos (1/2/2026 → 01/02/2026), linha a linha
        var linhas = p.valores[c.id] || [];
        var preenchidas = [].slice.call(el.querySelectorAll('.fatura-row')).filter(function(r) { return r.querySelector('.md-fat-venc').value.trim() || r.querySelector('.md-fat-valor').value.trim(); });
        preenchidas.forEach(function(r, i) { if (linhas[i]) r.querySelector('.md-fat-venc').value = linhas[i].vencimento; });
        return;
      }
      if (el && el.tagName !== 'SELECT' && p.valores[c.id] !== undefined && el.value !== p.valores[c.id]) el.value = p.valores[c.id];
    });
    // 2) confere obrigatórios e formatos; 3) monta o texto
    var erros = mdValidarValores(m, p.valores);
    if (erros.length) { mostrarAviso('ATENÇÃO: ' + erros[0]); return; }
    var t = mdGerar(m, p.valores);
    finalizarGeracao(sf, t.nota, t.agenda, m.copiar === 'agenda' ? 'agenda' : 'nota');
    // pendência criada ao gerar (ex.: Análise de Isenção, prazo de 5 dias úteis)
    var pd = m.pendencia;
    if (pd && pd.tipo && typeof criarPendenciaAuto === 'function' && typeof TIPOS_PENDENCIA !== 'undefined' && TIPOS_PENDENCIA[pd.tipo]) {
      var campo = function(k) { return pd[k] ? mdPreencher(m, p.valores, pd[k]) : ''; };
      criarPendenciaAuto(pd.tipo, { origem: campo('origem'), solicitante: campo('solicitante'), cc: campo('cc'), doc: campo('doc'), texto: t.nota });
    }
    // lembrete na hora de criar a nota (depois do "Copiado!")
    if (m.lembrete) setTimeout(function() { mostrarAviso(String(m.lembrete), 'longo'); }, 300);
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
    if (c.tipo === 'faturas') {
      grupo.className = 'field-group full-width';
      el = document.createElement('div');
      el.className = 'md-faturas dynamic-box';
      el.id = id;
      mdLinhaFatura(m, el);
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn-add';
      add.style.marginTop = '6px';
      add.textContent = '+ Adicionar Fatura';
      add.addEventListener('click', function() { mdLinhaFatura(m, el).querySelector('input').focus(); });
      el.addEventListener('input', function() { mdAtualizarVisiveis(m); });
      grupo.appendChild(el);
      grupo.appendChild(add);
      rot.removeAttribute('for');
      return grupo;
    }
    if (c.tipo === 'opcao') {
      el = document.createElement('select');
      c.opcoes.forEach(function(o, i) { var op = document.createElement('option'); op.value = o; op.textContent = (c.rotulosOpcoes && c.rotulosOpcoes[i]) || o; el.appendChild(op); });
      el.addEventListener('change', function() { mdPreencherAuto(m, c.id); mdAtualizarVisiveis(m); });
    } else if (c.tipo === 'textoLongo') {
      el = document.createElement('textarea');
      el.rows = c.linhas || 3;
      if (c.dica) el.placeholder = c.dica;
    } else {
      el = document.createElement('input');
      el.type = 'text';
      if (c.tipo === 'telefone') { el.setAttribute('inputmode', 'tel'); el.placeholder = 'Ex: 71993501519'; }
      if (c.tipo === 'email') { el.setAttribute('inputmode', 'email'); el.placeholder = 'cliente@email.com ou Não informado'; }
      if (c.tipo === 'data') { el.placeholder = 'dd/mm/aaaa'; el.setAttribute('data-input', 'mascararData(this)'); }
      if (c.tipo === 'dataHora') { el.placeholder = 'Ex: 10/10/2026 às 14:00'; el.setAttribute('data-input', 'mascararDataHoraRod(this)'); }
      if (c.tipo === 'dataOuMes') { el.placeholder = 'dd/mm/aaaa ou mm/aaaa'; el.setAttribute('data-input', 'mascararDataOuMes(this)'); }
      if (c.tipo === 'documento') el.placeholder = c.documento === 'cnpj' ? '00.000.000/0000-00' : 'CPF ou CNPJ — somente números';
      if (c.tipo === 'numero') el.setAttribute('inputmode', 'numeric');
      if (c.teclado === 'numerico') el.setAttribute('inputmode', 'numeric');
      if (c.tipo === 'valor' || c.teclado === 'decimal') el.setAttribute('inputmode', 'decimal');
      if (Array.isArray(c.sugestoes) && c.sugestoes.length) {
        // sugestões (o atendente ainda pode digitar outra coisa)
        var dl = document.createElement('datalist');
        dl.id = id + '_lista';
        c.sugestoes.forEach(function(o) { var op = document.createElement('option'); op.value = o; dl.appendChild(op); });
        grupo.appendChild(dl);
        el.setAttribute('list', dl.id);
      }
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
    // se o atendente já está neste serviço quando chega uma versão nova do modelo,
    // o formulário continua aberto e o que foi digitado é mantido
    var estavaAberto = !!(antigo && antigo.classList.contains('active'));
    var digitado = {};
    if (antigo) {
      antigo.querySelectorAll('input[id], textarea[id], select[id]').forEach(function(e) { digitado[e.id] = e.value; });
      antigo.remove();
    }
    document.querySelectorAll('#service_nav .sub-btn[data-modelo="' + m.id + '"]').forEach(function(b) { b.remove(); });

    var form = document.createElement('div');
    form.className = 'subform';
    form.id = sf;
    form.setAttribute('data-nome', m.nome);
    (m.avisos || []).forEach(function(a, i) {
      var av = document.createElement('div');
      var obj = a && typeof a === 'object';
      av.className = obj && a.classeOriginal ? mdClassesSeguras(a.classeOriginal) : 'alert-box' + (obj && a.piscar ? ' alert-box-blink' : '') + (obj && a.classe ? ' ' + mdClassesSeguras(a.classe) : '');
      // Modelos embutidos (vêm do repositório) usam o HTML como está; os publicados pelo painel
      // (ex.: um modelo do sistema personalizado) só mantêm negrito, itálico, quebras e listas.
      if (obj && a.html && m._embutido) av.innerHTML = a.html;
      else if (obj && a.html) mdHtmlSeguro(av, a.html);
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
      form.querySelectorAll('.md-faturas').forEach(function(l) { mdLimparFaturas(m, l); });
      mdAtualizarVisiveis(m);
    });
    acoes.appendChild(gerar);
    acoes.appendChild(limpar);
    form.appendChild(acoes);
    var ultimo = document.querySelectorAll('#painel_agenda .subform');
    var ref = ultimo[ultimo.length - 1];
    ref.parentNode.insertBefore(form, ref.nextSibling);
    Object.keys(digitado).forEach(function(k) {
      var e = document.getElementById(k);
      if (e && form.contains(e) && (e.tagName !== 'SELECT' || [].some.call(e.options, function(o) { return o.value === digitado[k]; }))) e.value = digitado[k];
    });
    if (estavaAberto) form.classList.add('active');
    mdAtualizarVisiveis(m);

    // botão na lista de serviços, na categoria do modelo (um por subtipo, quando houver)
    var botoes = m.subtipos
      ? m.subtipos.botoes.map(function(b) { return { alvo: sf + '|' + b.valor, nome: b.nome, categoria: b.categoria || m.categoria }; })
      : [{ alvo: sf, nome: m.nome, categoria: m.categoria }];
    botoes.forEach(function(b) {
      var grupo = null;
      document.querySelectorAll('#service_nav .svc-grupo').forEach(function(g) {
        if (g.querySelector('.svc-grupo-titulo').textContent === b.categoria) grupo = g;
      });
      if (!grupo) {
        grupo = document.createElement('div');
        grupo.className = 'svc-grupo';
        var tit = document.createElement('div');
        tit.className = 'svc-grupo-titulo';
        tit.textContent = b.categoria;
        grupo.appendChild(tit);
        // grupo novo entra na posição da ordem padrão das categorias (as que não estão nela vão para o fim)
        var nav = document.getElementById('service_nav');
        var ordem = typeof CATEGORIAS !== 'undefined' ? CATEGORIAS.map(function(c) { return c[0]; }) : [];
        var pos = function(nome) { var i = ordem.indexOf(nome); return i < 0 ? ordem.length : i; };
        var depois = null;
        nav.querySelectorAll('.svc-grupo').forEach(function(g) {
          if (!depois && pos(g.querySelector('.svc-grupo-titulo').textContent) > pos(b.categoria)) depois = g;
        });
        nav.insertBefore(grupo, depois);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-btn';
      btn.setAttribute('data-modelo', m.id);
      btn.setAttribute('data-click', "trocarAba('" + b.alvo + "', this)");
      btn.textContent = b.nome;
      grupo.appendChild(btn);
    });
    if (estavaAberto) {
      // o botão do serviço aberto continua marcado (com o subtipo escolhido, se houver)
      var sub = typeof subtipoAtivo !== 'undefined' && subtipoAtivo[sf] ? sf + '|' + subtipoAtivo[sf] : sf;
      var ativo = document.querySelector('#service_nav .sub-btn[data-click="trocarAba(\'' + sub + '\', this)"]');
      if (ativo) ativo.classList.add('active');
    }
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
      document.querySelectorAll('#' + containerId + ' .md-faturas').forEach(function(l) { mdLimparFaturas(m, l); });
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
