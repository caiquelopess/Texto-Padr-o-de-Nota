  // === ISENÇÃO DE DÉBITOS (pedido de análise) ===
  function gerarAnaliseIsencao() {
    if (!validarCampos('sf-analise-isencao')) return;
    var doc = declFormatarDoc(getVal('aid_doc'));
    if (!doc) { mostrarAviso('ATENÇÃO: o CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) números.'); document.getElementById('aid_doc').focus(); return; }
    document.getElementById('aid_doc').value = doc;
    var docs = getVal('aid_docs').toUpperCase().replace(/\.+$/, '') + '.';
    var txt = 'Análise de isenção de debitos' +
      '\nConta contrato: ' + getVal('aid_cc') +
      '\nSolicitante: ' + getVal('aid_solic').toUpperCase() +
      '\nCPF/CNPJ: ' + doc +
      '\nPN: ' + getVal('aid_pn') +
      '\nTEL: ' + telefonesPadraoNota(getVal('aid_tel')) +
      '\nEMAIL: ' + getVal('aid_email') +
      '\nDOCUMENTAÇÃO APRESENTADA: ' + docs;
    finalizarGeracao('sf-analise-isencao', txt, txt, 'nota');
    criarPendenciaAuto('isencao', { origem: 'Isenção de Débitos (pedido de análise)', solicitante: getVal('aid_solic'), cc: getVal('aid_cc'), doc: doc, texto: txt });
  }

