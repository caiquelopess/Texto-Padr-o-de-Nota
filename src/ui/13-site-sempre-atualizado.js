  // === SITE SEMPRE ATUALIZADO (sem versões para o usuário) ===
  // Existem só dois endereços:
  //   Produção: https://caiquelopess.github.io/Texto-Padr-o-de-Nota/
  //   Teste:    https://caiquelopess.github.io/Texto-Padr-o-de-Nota/teste/
  // Quem abre o site recebe sempre a publicação mais recente, sem clicar em nada.
  // Arquivo .html salvo no computador e links antigos de versão (ex.: /v2.6.1/,
  // ?v=2.6.1) levam direto para a produção.
  // PUBLICAR: troque o código abaixo e o campo "versao" do versao.json pelo mesmo
  // valor (ex.: a data e hora da publicação). Ele é interno e não aparece na tela.
  var VERSAO_ATUAL = '2.18.2';
  var SITE_PRODUCAO = 'https://textos-padroes.pages.dev/';   // endereço oficial (Cloudflare, com login)
  var NA_WEB = /^https?:$/.test(location.protocol);


  (function manterSiteAtualizado() {
    // 1) Arquivo local ou link de versão específica: vai para a produção.
    var linkDeVersao = /\/v?\d+(\.\d+)+\/(index\.html)?$/i.test(location.pathname) || /\/versoes?\//i.test(location.pathname);
    if ((!NA_WEB && navigator.onLine !== false) || linkDeVersao) {
      location.replace(SITE_PRODUCAO + location.hash);
      return;
    }
    if (!NA_WEB || !window.fetch) return;

    // 2) Limpa da barra de endereço os parâmetros de versão (?v=, ?versao=, ?atualizado=).
    if (/[?&](v|ver|versao|atualizado)=/i.test(location.search) && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.hash);
    }

    // 3) Confere a publicação mais recente ao abrir, ao voltar para a aba e a cada 5 minutos.
    var CHAVE = 'tp_recarga_' + (AMBIENTE_TESTE ? 'teste' : 'prod');
    var pendente = false;

    // Só atualiza com a tela "limpa": se qualquer campo estiver diferente de
    // quando a página abriu (formulário pela metade ou texto gerado esperando
    // ser copiado), espera o atendente limpar ou abrir outro atendimento.
    var estadoInicial = null;
    function estadoAtual() {
      var campos = document.querySelectorAll('input, textarea, select');
      var v = [];
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        if (c.type === 'button' || c.type === 'submit') continue;
        v.push(c.type === 'checkbox' || c.type === 'radio' ? (c.checked ? '1' : '0') : c.value);
      }
      return v.join('\u0001');
    }
    function temTextoDigitado() {
      if (estadoInicial === null) return true;
      return estadoAtual() !== estadoInicial;
    }

    function recarregar() {
      var ultima = 0;
      try { ultima = parseInt(sessionStorage.getItem(CHAVE) || '0', 10) || 0; } catch (e) {}
      if (Date.now() - ultima < 2 * 60 * 1000) return;   // evita laço enquanto o GitHub publica
      try { sessionStorage.setItem(CHAVE, String(Date.now())); } catch (e) {}
      // O parâmetro novo faz o navegador ignorar a cópia guardada em cache.
      location.replace(location.pathname + '?atualizado=' + Date.now() + location.hash);
    }

    function verificar() {
      fetch('versao.json?t=' + Date.now(), { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(info) {
          if (!info || !info.versao || compararVersoes(info.versao, VERSAO_ATUAL) <= 0) return;
          if (temTextoDigitado()) pendente = true;   // espera a tela ficar limpa
          else recarregar();
        })
        .catch(function() {});
    }

    setTimeout(function() { estadoInicial = estadoAtual(); verificar(); }, 1500);
    setInterval(function() { if (pendente) { if (!temTextoDigitado()) recarregar(); } else verificar(); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') { if (pendente && !temTextoDigitado()) recarregar(); }
      else verificar();
    });
  })();
