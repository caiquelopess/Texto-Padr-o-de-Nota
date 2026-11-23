  // === ABA PRINCIPAL: Agenda e Nota x Tensão Fornecimento ===
  function mostrarAbaPrincipal(qual, btn) {
    var pA = document.getElementById('painel_agenda');
    var pT = document.getElementById('painel_tensao');
    if (pA) pA.style.display = qual === 'agenda' ? '' : 'none';
    if (pT) pT.style.display = qual === 'tensao' ? '' : 'none';
    var pC = document.getElementById('painel_calc');
    if (pC) pC.style.display = qual === 'calc' ? '' : 'none';
    var pD = document.getElementById('painel_decl');
    if (pD) pD.style.display = qual === 'decl' ? '' : 'none';
    var pP = document.getElementById('painel_pend');
    if (pP) pP.style.display = qual === 'pend' ? '' : 'none';
    if (qual === 'pend' && typeof renderPendencias === 'function') renderPendencias();
    var titulos = { tensao: 'Tensão Fornecimento', calc: 'Calculadora de Refaturamento', decl: 'Declaração de Ligação', pend: 'Pendências' };
    var tituloPrincipal = document.getElementById('titulo_principal');
    if (tituloPrincipal) tituloPrincipal.textContent = titulos[qual] || 'Textos Padrões';
    document.querySelectorAll('.nav-tab').forEach(function(t) {
      var ativa = t.getAttribute('data-aba') === qual;
      t.classList.toggle('ativa', ativa);
      t.classList.toggle('inativa', !ativa);
      t.setAttribute('aria-selected', ativa ? 'true' : 'false');
    });
  }

