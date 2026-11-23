  // === REFAT URGENTE (aba da calculadora) ===
  var ruLeituraManual = false;
  function toggleRefatUrgente() {
    document.getElementById('grp_ru_desab').style.display = getVal('ru_imovel') === 'Desabitado' ? 'flex' : 'none';
  }
  function sincronizarLeituraRefat() {
    var alvo = document.getElementById('ru_leitura');
    if (alvo && !ruLeituraManual) alvo.value = getVal('calc_lt_cli');
  }
  function gerarRefatUrgente() {
    if (!validarCampos('sf-refat-urg')) return;
    if (!document.getElementById('ru_foto').checked) {
      mostrarAviso('ATENÇÃO: é obrigatório confirmar a leitura e o número do medidor através de foto e/ou vídeo.', 'longo');
      document.getElementById('ru_foto').focus(); return;
    }
    if (!calcLerData(getVal('ru_venc'))) { mostrarAviso('ATENÇÃO: o vencimento da fatura deve ser uma data real no formato dd/mm/aaaa.'); document.getElementById('ru_venc').focus(); return; }
    var desab = getVal('ru_imovel') === 'Desabitado';
    if (desab && !calcLerData(getVal('ru_desab_data'))) { mostrarAviso('ATENÇÃO: informe desde quando o imóvel está desabitado (dd/mm/aaaa).'); document.getElementById('ru_desab_data').focus(); return; }
    var valor = getVal('ru_valor').replace(/^R\$\s*/i, '');
    var txt = 'Título: Refat Urgente' +
      '\nIdentificação do local de atendimento: ' + getVal('ru_local') +
      '\nAtendente: ' + getVal('ru_atendente') +
      '\nSolicitante: ' + getVal('ru_solic') +
      '\nMotivo da Solicitação: ' + getVal('ru_motivo') +
      '\nLeitura atual: ' + getVal('ru_leitura') +
      '\nCliente apresentou foto: Sim e conseguimos confirmar o número do medidor e a leitura' +
      '\nFatura reclamada: Vencimento ' + getVal('ru_venc') + ' valor de R$ ' + valor +
      '\nLocal do medidor: ' + getVal('ru_local_med') +
      '\nSituação do imóvel: ' + (desab ? 'Desabitado desde ' + getVal('ru_desab_data') : 'Habitado') +
      '\nSituação em campo: ' + getVal('ru_campo') +
      '\nE-mail do Cliente: ' + getVal('ru_email') +
      '\nTelefone do Cliente: ' + getVal('ru_tel') +
      '\nPontos de Referência: ' + getVal('ru_ref') +
      '\nModalidade de Resposta: ' + getVal('ru_resposta') + '. Prazo de até 05 dias úteis ou 15 dias corridos quando necessária verificação em campo.';
    document.getElementById('ru_out').value = txt;
    salvarNoHistorico('sf-refat-urg', '', txt);
    copiarTexto('ru_out', 'ru_al');
  }
  function limparRefatUrgente() {
    document.querySelectorAll('#sf-refat-urg input[type="text"]').forEach(function(i) { i.value = ''; });
    document.getElementById('ru_foto').checked = false;
    ['ru_local_med', 'ru_imovel', 'ru_campo', 'ru_resposta'].forEach(function(id) { var el = document.getElementById(id); el.value = el.options[0].value; });
    toggleRefatUrgente();
    document.getElementById('ru_out').value = '';
    ruLeituraManual = false; sincronizarLeituraRefat();
  }
  (function() {
    var lt = document.getElementById('ru_leitura'), cli = document.getElementById('calc_lt_cli');
    if (lt) lt.addEventListener('input', function() { ruLeituraManual = lt.value.trim() !== ''; });
    if (cli) cli.addEventListener('input', sincronizarLeituraRefat);
  })();

