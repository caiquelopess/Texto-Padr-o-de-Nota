  // === DECLARAÇÃO DE LIGAÇÃO ===
  // Reproduz o modelo "CARTA_INICIO" (Neoenergia Coelba). A folha usa estilos
  // próprios (iguais na prévia e na impressão) e é impressa num iframe
  // separado, para sair só a carta, em A4.
  var DECL_LOGO = 'data:image/png;base64,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';
  var DECL_ASSINATURA = 'data:image/png;base64,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';
  var DECL_ESTILO =
    '.decl-folha, .decl-folha * { box-sizing: border-box; }' +
    '.decl-folha * { font-family: inherit; letter-spacing: normal; }' +
    '.decl-folha { font-family: "Times New Roman", Times, serif; color: #595959; font-size: 12pt; line-height: 1.35; }' +
    '.decl-folha p { margin: 0 0 0.212cm; }' +
    '.decl-logo { display: block; width: 4.3cm; height: auto; margin: 0 0 0.9cm; }' +
    '.decl-dados p { font-size: 11pt; text-align: justify; }' +
    '.decl-titulo { text-align: center; color: #538135; font-size: 14pt; font-weight: bold; margin: 0.25cm 0 0.7cm; }' +
    '.decl-texto { text-align: justify; }' +
    '.decl-texto b { font-weight: bold; }' +
    '.decl-texto a { color: #0000FF; text-decoration: underline; }' +
    '.decl-local { margin-top: 0.9cm !important; font-size: 11pt; }' +
    '.decl-assinatura { display: block; width: 3.3cm; height: auto; margin: 1.6cm 0 0.4cm 0.5cm; mix-blend-mode: multiply; }' +
    '.decl-nome { font-family: Arial, Helvetica, sans-serif; color: #007F33; font-size: 9pt; font-weight: bold; margin: 0 !important; }' +
    '.decl-cargo { font-family: Arial, Helvetica, sans-serif; color: #00A443; font-size: 9pt; margin: 0 !important; }' +
    '.decl-rodape { margin-top: 1.1cm; font-family: Arial, Helvetica, sans-serif; color: #5B8528; font-size: 8.5pt; line-height: 1.5; }' +
    '.decl-rodape p { margin: 0 0 0.08cm; }' +
    '.decl-rodape a { color: #0563C1; }' +
    '.decl-dica { margin-top: 0.5cm !important; }' +
    '.decl-dica b { color: #538135; }';
  (function() { var st = document.createElement('style'); st.textContent = DECL_ESTILO; document.head.appendChild(st); })();

  var MESES_DECL = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function declEsc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function declHojeBR() {
    var h = new Date();
    return String(h.getDate()).padStart(2, '0') + '/' + String(h.getMonth() + 1).padStart(2, '0') + '/' + h.getFullYear();
  }
  function declDataExtenso(dt) { return dt.getUTCDate() + ' de ' + MESES_DECL[dt.getUTCMonth()] + ' de ' + dt.getUTCFullYear(); }
  function toggleDeclEncerramento() {
    document.getElementById('grp_decl_fim').style.display = getVal('decl_situacao') === 'encerrado' ? 'flex' : 'none';
  }
  function declDados() {
    var encerrado = getVal('decl_situacao') === 'encerrado';
    return {
      cliente: getVal('decl_cliente').toUpperCase(), codigo: getVal('decl_codigo'), doc: getVal('decl_doc'),
      end: getVal('decl_end').toUpperCase(), bairro: getVal('decl_bairro').toUpperCase(), mun: getVal('decl_mun').toUpperCase(),
      inicio: getVal('decl_inicio'), situacao: encerrado ? 'encerrado' : 'ativo', fim: encerrado ? getVal('decl_fim') : '',
      cidade: getVal('decl_cidade').toUpperCase(), emissaoData: getVal('decl_emissao'),
      emissao: declDataExtenso(calcLerData(getVal('decl_emissao')))
    };
  }
  function declHtml(d) {
    return '<img class="decl-logo" src="' + DECL_LOGO + '" alt="Neoenergia">' +
      '<div class="decl-dados">' +
        '<p>CLIENTE: ' + declEsc(d.cliente) + '</p>' +
        '<p>CODIGO DO CLIENTE: ' + declEsc(d.codigo) + '</p>' +
        '<p>CPF/CNPJ: ' + declEsc(d.doc) + '</p>' +
        '<p>ENDEREÇO: ' + declEsc(d.end) + '</p>' +
        '<p>BAIRRO: ' + declEsc(d.bairro) + '</p>' +
        '<p>MUNICIPIO: ' + declEsc(d.mun) + '</p>' +
      '</div>' +
      '<p class="decl-titulo">DECLARAÇÃO DE LIGAÇÃO</p>' +
      '<p class="decl-texto">De acordo com os registros da Neoenergia Coelba, declaramos que o código do cliente <b>' + declEsc(d.codigo) + '</b> teve o fornecimento de energia iniciado sob a titularidade da</p>' +
      '<p class="decl-texto">Sr.(a) ' + declEsc(d.cliente) + ' em ' + (d.fim
        ? '<b>' + declEsc(d.inicio) + '</b>, sendo o mesmo encerrado em <b>' + declEsc(d.fim) + '</b>.'
        : '<b>' + declEsc(d.inicio) + ' até o presente momento.</b>') + '</p>' +
      '<p class="decl-texto">Em caso de dúvidas, estamos à disposição através do nosso site <a href="https://www.neoenergia.com/bahia">www.neoenergia.com/bahia</a>, nos nossos canais digitais ou em nossas lojas de atendimento.</p>' +
      '<p class="decl-local">' + declEsc(d.cidade) + ' ' + declEsc(d.emissao) + '.</p>' +
      '<img class="decl-assinatura" src="' + DECL_ASSINATURA + '" alt="Assinatura">' +
      '<p class="decl-nome">Trhissia A. Carvalho</p>' +
      '<p class="decl-cargo">Departamento Corporativo de Atendimento ao Cliente</p>' +
      '<p class="decl-cargo">Superintendência de Experiência do Cliente</p>' +
      '<div class="decl-rodape">' +
        '<p>Av. Edgard Santos, 300</p><p>Narandiba, Salvador BA</p><p>CEP 41192-005</p>' +
        '<p>Acesse <a href="https://www.coelba.com.br">www.coelba.com.br</a> e confira nosso aviso de privacidade.</p>' +
        '<p class="decl-dica"><b>Dicas de Segurança:</b> “Se sua antena cair sobre a rede ou próximo a ela, nunca tente segurá-la ou recuperá-la. Ligue para o 116. ”</p>' +
      '</div>';
  }
  function declTexto(d) {
    return 'CLIENTE: ' + d.cliente + '\nCODIGO DO CLIENTE: ' + d.codigo + '\nCPF/CNPJ: ' + d.doc + '\nENDEREÇO: ' + d.end +
      '\nBAIRRO: ' + d.bairro + '\nMUNICIPIO: ' + d.mun + '\n\nDECLARAÇÃO DE LIGAÇÃO\n\n' +
      'De acordo com os registros da Neoenergia Coelba, declaramos que o código do cliente ' + d.codigo +
      ' teve o fornecimento de energia iniciado sob a titularidade da Sr.(a) ' + d.cliente + ' em ' + d.inicio +
      (d.fim ? ', sendo o mesmo encerrado em ' + d.fim + '.' : ' até o presente momento.') + '\n\n' +
      d.cidade + ' ' + d.emissao + '.';
  }
  function mostrarDeclaracao(d) {
    document.getElementById('decl_folha').innerHTML = declHtml(d);
    var saida = document.getElementById('decl_saida');
    saida.style.display = '';
    if (saida.scrollIntoView) saida.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function gerarDeclaracao() {
    if (!validarCampos('sf-decl')) return;
    var doc = declFormatarDoc(getVal('decl_doc'));
    if (!doc) { mostrarAviso('ATENÇÃO: o CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) números.'); document.getElementById('decl_doc').focus(); return; }
    document.getElementById('decl_doc').value = doc;
    var dt = calcLerData(getVal('decl_inicio'));
    if (!dt) { mostrarAviso('ATENÇÃO: o início do fornecimento deve ser uma data real no formato dd/mm/aaaa.'); document.getElementById('decl_inicio').focus(); return; }
    if (dt.getTime() > Date.now()) { mostrarAviso('ATENÇÃO: o início do fornecimento não pode ser uma data futura.'); document.getElementById('decl_inicio').focus(); return; }
    if (getVal('decl_situacao') === 'encerrado') {
      var fim = calcLerData(getVal('decl_fim'));
      if (!fim) { mostrarAviso('ATENÇÃO: a data de encerramento deve ser uma data real no formato dd/mm/aaaa.'); document.getElementById('decl_fim').focus(); return; }
      if (fim.getTime() < dt.getTime()) { mostrarAviso('ATENÇÃO: a data de encerramento não pode ser anterior ao início do fornecimento.'); document.getElementById('decl_fim').focus(); return; }
      if (fim.getTime() > Date.now()) { mostrarAviso('ATENÇÃO: a data de encerramento não pode ser uma data futura.'); document.getElementById('decl_fim').focus(); return; }
    }
    if (!calcLerData(getVal('decl_emissao'))) { mostrarAviso('ATENÇÃO: a data de emissão deve ser uma data real no formato dd/mm/aaaa.'); document.getElementById('decl_emissao').focus(); return; }
    var d = declDados();
    mostrarDeclaracao(d);
    salvarNoHistorico('sf-decl', 'Declaração de Ligação — ' + d.cliente + ' — código ' + d.codigo, declTexto(d), d);
  }
  function limparDeclaracao() {
    document.querySelectorAll('#sf-decl input[type="text"]').forEach(function(i) { i.value = ''; });
    document.getElementById('decl_emissao').value = declHojeBR();
    document.getElementById('decl_situacao').value = 'ativo';
    toggleDeclEncerramento();
    document.getElementById('decl_folha').innerHTML = '';
    document.getElementById('decl_saida').style.display = 'none';
  }
  function imprimirDeclaracao() {
    var folha = document.getElementById('decl_folha');
    if (!folha || !folha.innerHTML) { mostrarAviso('Gere a declaração antes de imprimir.'); return; }
    var antigo = document.getElementById('decl_iframe');
    if (antigo) antigo.parentNode.removeChild(antigo);
    var ifr = document.createElement('iframe');
    ifr.id = 'decl_iframe';
    ifr.setAttribute('aria-hidden', 'true');
    ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(ifr);
    var nome = 'Declaracao de Ligacao - ' + (getVal('decl_codigo') || 'cliente');
    var docf = ifr.contentWindow.document;
    docf.open();
    docf.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + declEsc(nome) + '</title><style>' +
      '@page { size: A4; margin: 1.5cm 2cm; } html, body { margin: 0; background: #fff; } ' +
      '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } ' + DECL_ESTILO +
      '</style></head><body><div class="decl-folha">' + folha.innerHTML + '</div></body></html>');
    docf.close();
    var imprimir = function() { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) { mostrarAviso('Não foi possível abrir a impressão neste navegador.'); } };
    var imgs = docf.images, faltam = imgs.length;
    if (!faltam) { setTimeout(imprimir, 50); return; }
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) { if (--faltam === 0) setTimeout(imprimir, 50); }
      else imgs[i].onload = imgs[i].onerror = function() { if (--faltam === 0) setTimeout(imprimir, 50); };
    }
  }
  (function() {
    var el = document.getElementById('decl_emissao');
    if (el && !el.value) el.value = declHojeBR();
  })();

