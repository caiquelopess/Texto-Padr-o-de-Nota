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
    previa.appendChild(moldura);
    var paginas = []; // imagens das páginas, usadas na impressão
    if (f.tipo === 'application/pdf') {
      moldura.classList.add('form-pdf');
      desenharPdf(url, moldura, paginas, f);
    } else {
      var img = document.createElement('img');
      img.alt = 'Prévia: ' + f.nome;
      img.addEventListener('load', function() { moldura.classList.remove('carregando-previa'); });
      img.src = url;
      moldura.appendChild(img);
      paginas.push(url);
    }
    imprimir.addEventListener('click', function() {
      if (!paginas.length) { window.open(url, '_blank', 'noopener'); return; }
      imprimirPaginas(f.nome, paginas);
    });
  }

  // PDF.js (cdnjs) é baixado só na primeira prévia de PDF. Ele desenha cada página
  // como imagem, então a prévia funciona em qualquer navegador, inclusive no celular.
  var PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var pdfjsPromessa = null;
  function carregarPdfJs() {
    if (pdfjsPromessa) return pdfjsPromessa;
    pdfjsPromessa = new Promise(function(ok, falha) {
      var sc = document.createElement('script');
      sc.src = PDFJS_URL + 'pdf.min.js';
      sc.onload = function() {
        if (!window.pdfjsLib) { falha(new Error('pdf.js')); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'pdf.worker.min.js';
        ok(window.pdfjsLib);
      };
      sc.onerror = function() { pdfjsPromessa = null; falha(new Error('pdf.js')); };
      document.head.appendChild(sc);
    });
    return pdfjsPromessa;
  }

  function desenharPdf(url, moldura, paginas, f) {
    carregarPdfJs()
      .then(function(pdfjs) { return pdfjs.getDocument({ url: url, withCredentials: true }).promise; })
      .then(function(doc) {
        if (formSelecionado !== f.id) return;
        var largura = Math.min(moldura.clientWidth || 800, 1000);
        var escala = Math.min(2, window.devicePixelRatio || 1) * 1.5;
        var cadeia = Promise.resolve();
        for (var n = 1; n <= doc.numPages; n++) {
          (function(n) {
            cadeia = cadeia.then(function() { return doc.getPage(n); }).then(function(pg) {
              if (formSelecionado !== f.id) return;
              var vp = pg.getViewport({ scale: escala });
              var c = document.createElement('canvas');
              c.width = vp.width; c.height = vp.height;
              c.style.maxWidth = largura + 'px';
              c.setAttribute('aria-label', 'Página ' + n + ' de ' + f.nome);
              return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function() {
                moldura.classList.remove('carregando-previa');
                moldura.appendChild(c);
                paginas.push(c.toDataURL('image/png'));
              });
            });
          })(n);
        }
        return cadeia;
      })
      .catch(function() {
        // sem internet para o PDF.js ou PDF com problema: tenta o leitor do próprio navegador
        if (formSelecionado !== f.id) return;
        moldura.classList.remove('carregando-previa', 'form-pdf');
        moldura.innerHTML = '';
        var fr = document.createElement('iframe');
        fr.title = 'Prévia: ' + f.nome;
        fr.src = url;
        moldura.appendChild(fr);
      });
  }

  function imprimirPaginas(titulo, paginas) {
    var w = window.open('', '_blank');
    if (!w) { mostrarAviso('Permita janelas pop-up para imprimir.'); return; }
    w.document.title = titulo;
    var estilo = w.document.createElement('style');
    estilo.textContent = '@page{margin:0}html,body{margin:0}img{display:block;width:100%;height:auto;page-break-after:always}img:last-child{page-break-after:auto}';
    w.document.head.appendChild(estilo);
    var faltam = paginas.length;
    paginas.forEach(function(src) {
      var img = w.document.createElement('img');
      img.onload = img.onerror = function() { if (--faltam === 0) { w.focus(); w.print(); } };
      img.src = src;
      w.document.body.appendChild(img);
    });
  }
