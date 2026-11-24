  // === FORMULÁRIOS (para impressão) ===
  // A lista vem do servidor (/api/formularios) só na primeira vez que a aba é aberta.
  // O responsável envia os arquivos em Administração → Formulários.
  var formularios = null;
  var formSelecionado = null;

  function formNormalizar(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function carregarFormularios() {
    var lista = document.getElementById('form_lista');
    if (formularios) { filtrarFormularios(); return; }
    lista.innerHTML = '<div class="form-skel"></div><div class="form-skel"></div><div class="form-skel"></div>';
    if (!NA_WEB || !window.fetch) { formMensagem('Os formulários ficam disponíveis no endereço com login.'); return; }
    fetch('/api/formularios', { cache: 'no-store', credentials: 'same-origin' })
      .then(function(r) {
        var ct = r.headers.get('content-type') || '';
        if (!r.ok || ct.indexOf('json') < 0) throw new Error('sem lista');
        return r.json();
      })
      .then(function(l) { formularios = Array.isArray(l) ? l : []; filtrarFormularios(); })
      .catch(function() { formMensagem('Os formulários ficam disponíveis no endereço com login.'); });
  }

  function formMensagem(txt) {
    var lista = document.getElementById('form_lista');
    lista.innerHTML = '';
    var d = document.createElement('div');
    d.className = 'form-vazio';
    d.textContent = txt;
    lista.appendChild(d);
  }

  function filtrarFormularios() {
    if (!formularios) return;
    var termo = formNormalizar(getVal('busca_form'));
    var achados = formularios.filter(function(f) { return formNormalizar(f.nome).indexOf(termo) >= 0; });
    if (!formularios.length) { formMensagem('Nenhum formulário cadastrado ainda.'); return; }
    if (!achados.length) { formMensagem('Nenhum formulário com esse nome.'); return; }
    var lista = document.getElementById('form_lista');
    lista.innerHTML = '';
    achados.forEach(function(f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sug-item form-item' + (formSelecionado === f.id ? ' destaque' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('data-id', f.id);
      b.textContent = f.nome;
      var tipo = document.createElement('span');
      tipo.className = 'form-tipo';
      tipo.textContent = f.tipo === 'application/pdf' ? 'PDF' : 'Imagem';
      b.appendChild(tipo);
      b.addEventListener('click', function() { mostrarFormulario(f); });
      lista.appendChild(b);
    });
    if (achados.length === 1 && termo) mostrarFormulario(achados[0]);
  }

  function mostrarFormulario(f) {
    formSelecionado = f.id;
    document.querySelectorAll('#form_lista .form-item').forEach(function(b) {
      b.classList.toggle('destaque', b.getAttribute('data-id') === f.id);
    });
    var url = '/api/formularios/' + encodeURIComponent(f.id);
    var previa = document.getElementById('form_previa');
    previa.innerHTML = '';
    var topo = document.createElement('div');
    topo.className = 'form-previa-topo';
    var titulo = document.createElement('b');
    titulo.textContent = f.nome;
    topo.appendChild(titulo);
    var acoes = document.createElement('span');
    acoes.className = 'form-acoes';
    var imprimir = document.createElement('button');
    imprimir.type = 'button';
    imprimir.className = 'btn';
    imprimir.id = 'btn_form_imprimir';
    imprimir.textContent = 'Imprimir';
    var baixar = document.createElement('a');
    baixar.className = 'btn btn-clear';
    baixar.href = url + '?baixar=1';
    baixar.textContent = 'Baixar';
    acoes.appendChild(imprimir);
    acoes.appendChild(baixar);
    topo.appendChild(acoes);
    previa.appendChild(topo);

    var moldura = document.createElement('div');
    moldura.className = 'form-moldura carregando-previa';
    var el;
    if (f.tipo === 'application/pdf') {
      el = document.createElement('iframe');
      el.title = 'Prévia: ' + f.nome;
    } else {
      el = document.createElement('img');
      el.alt = 'Prévia: ' + f.nome;
    }
    el.addEventListener('load', function() { moldura.classList.remove('carregando-previa'); });
    el.src = url;
    moldura.appendChild(el);
    previa.appendChild(moldura);
    imprimir.addEventListener('click', function() { imprimirFormulario(f, el, url); });
  }

  function imprimirFormulario(f, el, url) {
    // PDF: imprime direto pela prévia; se o navegador não deixar, abre em outra aba.
    if (f.tipo === 'application/pdf') {
      try { el.contentWindow.focus(); el.contentWindow.print(); return; } catch (e) { window.open(url, '_blank', 'noopener'); return; }
    }
    // Imagem: abre uma janela só com a imagem, ocupando a folha inteira, e imprime.
    var w = window.open('', '_blank');
    if (!w) { window.open(url, '_blank', 'noopener'); return; }
    w.document.title = f.nome;
    var estilo = w.document.createElement('style');
    estilo.textContent = '@page{margin:8mm}html,body{margin:0}img{display:block;width:100%;height:auto}';
    w.document.head.appendChild(estilo);
    var img = w.document.createElement('img');
    img.onload = function() { w.focus(); w.print(); };
    img.src = url;
    w.document.body.appendChild(img);
  }
