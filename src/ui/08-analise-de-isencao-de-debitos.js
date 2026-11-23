  // === ANÁLISE DE ISENÇÃO DE DÉBITOS (Troca de titularidade ou Reativação) ===
  function toggleIsencaoDeb() {
    var v = valorReais(getVal('ise_deb_total'));
    document.getElementById('grp_ise_ni').style.display = (v !== null && v > 12000) ? 'flex' : 'none';
  }
  function gerarIsencaoDeb() {
    toggleIsencaoDeb();
    if (!validarCampos('sf-isencao-deb')) return;
    var doc = typeof declFormatarDoc === 'function' ? declFormatarDoc(getVal('ise_doc')) : getVal('ise_doc');
    if (!doc) { mostrarAviso('ATENÇÃO: o CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) números.'); document.getElementById('ise_doc').focus(); return; }
    document.getElementById('ise_doc').value = doc;
    if (valorReais(getVal('ise_deb_total')) === null) { mostrarAviso('ATENÇÃO: informe o valor do débito total em reais (ex: 3.250,80).'); document.getElementById('ise_deb_total').focus(); return; }
    // Período só quando há débito de responsabilidade do solicitante: os dois em branco = "Não se aplica"
    var temDe = !!getVal('ise_de'), temAte = !!getVal('ise_ate'), periodo = 'Não se aplica';
    if (temDe !== temAte) { mostrarAviso('ATENÇÃO: preencha as duas datas do período (de e até) ou deixe as duas em branco.'); document.getElementById(temDe ? 'ise_ate' : 'ise_de').focus(); return; }
    if (temDe) {
      var de = calcLerData(getVal('ise_de')), ate = calcLerData(getVal('ise_ate'));
      if (!de || !ate) { mostrarAviso('ATENÇÃO: o período deve ter datas reais no formato dd/mm/aaaa.'); return; }
      if (ate.getTime() < de.getTime()) { mostrarAviso('ATENÇÃO: a data final do período não pode ser anterior à inicial.'); document.getElementById('ise_ate').focus(); return; }
      periodo = getVal('ise_de') + ' até ' + getVal('ise_ate');
    }
    var troca = getVal('ise_servico') === 'troca';
    var acima = valorReais(getVal('ise_deb_total')) > 12000;
    var rs = function(t) { return String(t).replace(/^R\$\s*/i, ''); };
    var txt = 'Título: ' + (troca ? 'TROCA DE TITULARIDADE' : 'REATIVAÇÃO') + ' COM ANÁLISE DE ISENÇÃO DE DÉBITOS' +
      '\nSolicitante: ' + getVal('ise_solic') +
      '\nCPF/CNPJ: ' + doc +
      '\nTelefone com DDD: ' + getVal('ise_tel') +
      '\nE-mail: ' + getVal('ise_email') +
      '\nServiço (troca ou reativação): ' + (troca ? 'Troca de titularidade' : 'Reativação') +
      '\nCC Antiga: ' + getVal('ise_cca') +
      '\nCC Nova: ' + getVal('ise_ccn') +
      '\nLeitura: ' + getVal('ise_leitura') +
      '\nValor do débito total R$: ' + rs(getVal('ise_deb_total')) +
      '\nCaso débito >R$12.000, número da nota interna: ' + (acima ? getVal('ise_ni') : 'Não se aplica') +
      '\nValor do débito responsabilidade do Solicitante (quando houver faturas a vencer em outra unidade): ' + (getVal('ise_deb_solic') ? 'R$ ' + rs(getVal('ise_deb_solic')) : 'Não se aplica') +
      '\nFatura de responsabilidade do Solicitante foi entregue: ' + getVal('ise_fat_solic') +
      '\nPeríodo (de/até): ' + periodo +
      '\nDocumentação apresentada com comprovação de posse (inserir cópia no SAP KM): ' + getVal('ise_doc_posse') +
      '\nDados da Receita Federal (inserir cópia no SAP KM): ' + getVal('ise_rec') +
      '\nCliente ciente do faturamento da fatura de período final de: ' + getVal('ise_periodo_final') +
      '\nCritério de fatura final: ' + getVal('ise_crit') +
      '\nFatura final entregue de que forma: ' + getVal('ise_forma') +
      '\nSe trata de unidade consumidora MMGD Geradora? ' + getVal('ise_mmgd') +
      '\nNúmero da Tarefa Neo aberta: ' + (getVal('ise_neo') || 'Não se aplica');
    finalizarGeracao('sf-isencao-deb', txt, txt, 'nota');
    criarPendenciaAuto('isencao', { origem: (troca ? 'Troca de Titularidade' : 'Reativação') + ' com Análise de Isenção de Débitos',
      solicitante: getVal('ise_solic'), cc: getVal('ise_ccn') || getVal('ise_cca'), doc: doc, texto: txt });
  }

