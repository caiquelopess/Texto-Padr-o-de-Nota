  // === DATA DO CABECALHO: sempre a data atual do PC/dispositivo ===
  var MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  function atualizarDataCabecalho() {
    var el = document.getElementById('data_hoje');
    if (!el) return;
    var agora = new Date();
    var dia = String(agora.getDate()).padStart(2, '0');
    el.textContent = dia + ' de ' + MESES_PT[agora.getMonth()] + ' de ' + agora.getFullYear();
  }
  atualizarDataCabecalho();
  setInterval(atualizarDataCabecalho, 60000);

