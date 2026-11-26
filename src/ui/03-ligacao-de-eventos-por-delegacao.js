  // === LIGACAO DE EVENTOS POR DELEGACAO ===
  // Os botoes/selects/busca usam data-click / data-change / data-input em vez de
  // atributos inline (onclick/onchange/oninput), que nao disparam de forma
  // confiavel no ambiente incorporado do espaco. A ligacao e feita aqui, dentro
  // do proprio script, via addEventListener com delegacao no document (vale
  // tambem para linhas de fatura criadas dinamicamente).
  var ACOES = {
    trocarAba: trocarAba, exportarDados: exportarDados, importarDados: importarDados, alternarServicos: alternarServicos, alternarTema: alternarTema,
    abrirTemas: abrirTemas, escolherTema: escolherTema, filtrarServicos: filtrarServicos, filtrarFormularios: filtrarFormularios, fecharSugestao: fecharSugestao, enviarSugestao: enviarSugestao,
    mascararDataHoraRod: mascararDataHoraRod, mascararData: mascararData, mascararDataOuMes: mascararDataOuMes,
    selecionarSugestaoBusca: selecionarSugestaoBusca,
    mostrarAbaPrincipal: mostrarAbaPrincipal, filtrarCidades: filtrarCidades, buscarCidade: buscarCidade, selecionarCidadeTensao: selecionarCidadeTensao,
    removerFaturaRow: removerFaturaRow, adicionarFaturaRow: adicionarFaturaRow,
    copiarTexto: copiarTexto, limparForm: limparForm, desbloquearFormulario: desbloquearFormulario,
    toggleReclamacoes: toggleReclamacoes, toggleCanalAtendimento: toggleCanalAtendimento,
    gerarReclamacaoUnificada: gerarReclamacaoUnificada,
    calcularRefat: calcularRefat, gerarCalcRefat: gerarCalcRefat, limparCalcRefat: limparCalcRefat,
    gerarRefatUrgente: gerarRefatUrgente, limparRefatUrgente: limparRefatUrgente, toggleRefatUrgente: toggleRefatUrgente,
    pendServicoMudou: pendServicoMudou, adicionarPendenciaRefat: adicionarPendenciaRefat, concluirPendenciaRefat: concluirPendenciaRefat,
    iniciarPendenciaServico: iniciarPendenciaServico, salvarPendenciaServico: salvarPendenciaServico, concluirPendenciaServico: concluirPendenciaServico,
    sairModoPendencia: sairModoPendencia, retomarPendencia: retomarPendencia, editarComentario: editarComentario,
    abrirResposta: abrirResposta, respAtualizar: respAtualizar, gerarRespostaIsencao: gerarRespostaIsencao, copiarRespostaPend: copiarRespostaPend, concluirPendencia: concluirPendencia, informarNota: informarNota,
    excluirPendencia: excluirPendencia, reabrirPendencia: reabrirPendencia, alternarTextoPend: alternarTextoPend, copiarTextoPend: copiarTextoPend,
    fecharLembrete: fecharLembrete, verPendencias: verPendencias, ativarAvisosNavegador: ativarAvisosNavegador,
    gerarDeclaracao: gerarDeclaracao, limparDeclaracao: limparDeclaracao, imprimirDeclaracao: imprimirDeclaracao, toggleDeclEncerramento: toggleDeclEncerramento,
    abrirHistorico: abrirHistorico, fecharHistorico: fecharHistorico, fecharHistoricoFundo: fecharHistoricoFundo,
    renderHistorico: renderHistorico, histCopiarNota: histCopiarNota, histCopiarAgenda: histCopiarAgenda,
    histAbrir: histAbrir, histExcluir: histExcluir, limparHistorico: limparHistorico, exportarHistorico: exportarHistorico
  };

  function executarAcao(expr, el) {
    var m = /^\s*([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*$/.exec(expr || '');
    if (!m) return;
    var fn = ACOES[m[1]];
    if (!fn) return;
    var args = [];
    var bruto = m[2].trim();
    if (bruto) {
      var partes = bruto.split(',');
      for (var i = 0; i < partes.length; i++) {
        var p = partes[i].trim();
        if (p === 'this') args.push(el);
        else if (p.length >= 2 && p.charAt(0) === "'" && p.charAt(p.length - 1) === "'") args.push(p.slice(1, -1));
        else args.push(p);
      }
    }
    fn.apply(el, args);
  }

  function despacharEvento(attr, ev) {
    var el = ev.target;
    if (el && el.nodeType === 3) el = el.parentNode;
    while (el && el !== document) {
      if (el.getAttribute && el.getAttribute(attr)) { executarAcao(el.getAttribute(attr), el); return; }
      el = el.parentNode;
    }
  }

  document.addEventListener('click', function(ev) { despacharEvento('data-click', ev); });
  document.addEventListener('change', function(ev) { despacharEvento('data-change', ev); });
  document.addEventListener('input', function(ev) { despacharEvento('data-input', ev); });

  // Sugestoes da busca: reabrem ao voltar o foco com texto digitado, fecham
  // ao clicar fora da barra e aceitam navegacao por setas / Enter / Esc.
  var inpBusca = document.getElementById('busca_servico');
  if (inpBusca) {
    inpBusca.addEventListener('focus', function(){ if (inpBusca.value.trim()) filtrarServicos(); });
    inpBusca.addEventListener('keydown', function(ev){
      var caixa = document.getElementById('busca_sugestoes');
      if (ev.key === 'Escape') { fecharSugestoes(); return; }
      if (!caixa || !caixa.classList.contains('aberta')) return;
      var itens = caixa.querySelectorAll('.sug-item');
      if (!itens.length) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        sugDestaque = ev.key === 'ArrowDown' ? Math.min(sugDestaque + 1, itens.length - 1) : Math.max(sugDestaque - 1, 0);
        for (var i=0;i<itens.length;i++) itens[i].classList.toggle('destaque', i === sugDestaque);
        if (itens[sugDestaque]) itens[sugDestaque].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        var alvo = itens[sugDestaque >= 0 ? sugDestaque : 0];
        if (alvo) alvo.click();
      }
    });
  }
  document.addEventListener('click', function(ev){
    var wrap = document.querySelector('.search-row');
    if (wrap && !wrap.contains(ev.target)) fecharSugestoes();
  });

  // Busca de cidades (aba Tensão): mesmo comportamento da busca de
  // serviços — reabre ao voltar o foco com texto, fecha ao clicar fora
  // da barra e aceita navegação por setas / Enter / Esc.
  var inpCidade = document.getElementById('busca_cidade');
  if (inpCidade) {
    inpCidade.addEventListener('focus', function(){ if (inpCidade.value.trim()) filtrarCidades(); });
    inpCidade.addEventListener('keydown', function(ev){
      var caixa = document.getElementById('tensao_sugestoes');
      if (ev.key === 'Escape') { fecharSugestoesCidade(); return; }
      if (ev.key === 'Enter' && (!caixa || !caixa.classList.contains('aberta'))) { buscarCidade(); return; }
      if (!caixa || !caixa.classList.contains('aberta')) return;
      var itens = caixa.querySelectorAll('.sug-item');
      if (!itens.length) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        tensaoSugDestaque = ev.key === 'ArrowDown' ? Math.min(tensaoSugDestaque + 1, itens.length - 1) : Math.max(tensaoSugDestaque - 1, 0);
        for (var i=0;i<itens.length;i++) itens[i].classList.toggle('destaque', i === tensaoSugDestaque);
        if (itens[tensaoSugDestaque]) itens[tensaoSugDestaque].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        var alvo = itens[tensaoSugDestaque >= 0 ? tensaoSugDestaque : 0];
        if (alvo) alvo.click();
      }
    });
  }
  document.addEventListener('click', function(ev){
    var wrapC = document.querySelector('.tensao-search');
    if (wrapC && !wrapC.contains(ev.target)) fecharSugestoesCidade();
  });

