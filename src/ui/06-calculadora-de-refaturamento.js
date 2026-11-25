  // === CALCULADORA DE REFATURAMENTO ===
  function calcFmt(n, casas) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function calcDataBR(dt) {
    return String(dt.getUTCDate()).padStart(2, '0') + '/' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '/' + dt.getUTCFullYear();
  }

  // Devolve { vazio } | { erro } | { ...valores }
  function calcObterResultado() {
    var campos = ['calc_lt_ant', 'calc_dt_ant', 'calc_lt_cli', 'calc_dt_cli', 'calc_dt_esp'];
    var preenchidos = campos.filter(function(id) { return getVal(id) !== ''; }).length;
    if (preenchidos < campos.length) return { vazio: true };
    var ltAnt = calcLerNumero(getVal('calc_lt_ant')), ltCli = calcLerNumero(getVal('calc_lt_cli'));
    var dtAnt = calcLerData(getVal('calc_dt_ant')), dtCli = calcLerData(getVal('calc_dt_cli')), dtEsp = calcLerData(getVal('calc_dt_esp'));
    if (isNaN(ltAnt) || ltAnt === null) return { erro: 'A leitura da fatura anterior deve ser um número.' };
    if (isNaN(ltCli) || ltCli === null) return { erro: 'A leitura apresentada pelo cliente deve ser um número.' };
    if (!dtAnt) return { erro: 'A data da fatura anterior deve ser uma data real no formato dd/mm/aaaa.' };
    if (!dtCli) return { erro: 'A data da leitura do cliente deve ser uma data real no formato dd/mm/aaaa.' };
    if (!dtEsp) return { erro: 'A data esperada (fatura reclamada) deve ser uma data real no formato dd/mm/aaaa.' };
    var consumo = ltCli - ltAnt;
    if (consumo < 0) return { erro: 'Valor inferior: a leitura apresentada pelo cliente é menor que a leitura da fatura anterior.' };
    var diasCli = calcDias(dtAnt, dtCli);
    if (diasCli <= 0) return { erro: 'A data da leitura do cliente deve ser posterior à data da fatura anterior.' };
    var diasEsp = calcDias(dtAnt, dtEsp);
    if (diasEsp <= 0) return { erro: 'A data esperada (fatura reclamada) deve ser posterior à data da fatura anterior.' };
    var media = consumo / diasCli;
    var proj = diasEsp * media;
    var leitura = ltAnt + proj;
    return {
      ltAnt: ltAnt, ltCli: ltCli, dtAnt: dtAnt, dtCli: dtCli, dtEsp: dtEsp,
      consumo: consumo, diasCli: diasCli, diasEsp: diasEsp, media: media, proj: proj,
      leitura: leitura, leituraArred: Math.round(leitura)
    };
  }

  function calcularRefat() {
    var r = calcObterResultado();
    var vazio = document.getElementById('calc_vazio'), erro = document.getElementById('calc_erro'), vals = document.getElementById('calc_valores');
    vazio.style.display = r.vazio ? 'block' : 'none';
    erro.style.display = r.erro ? 'block' : 'none';
    vals.style.display = (!r.vazio && !r.erro) ? 'block' : 'none';
    if (r.erro) erro.textContent = r.erro;
    if (r.vazio || r.erro) return r;
    document.getElementById('calc_r_leitura').textContent = String(r.leituraArred);
    document.getElementById('calc_r_leitura_exata').textContent = (Math.abs(r.leitura - r.leituraArred) > 1e-9) ? '(' + calcFmt(r.leitura, 2) + ' sem arredondar)' : '';
    document.getElementById('calc_r_consumo').textContent = calcFmt(r.consumo, 0) + ' kWh';
    document.getElementById('calc_r_dias_cli').textContent = r.diasCli + (r.diasCli === 1 ? ' dia' : ' dias');
    document.getElementById('calc_r_media').textContent = calcFmt(r.media, 2) + ' kWh/dia';
    document.getElementById('calc_r_dias_esp').textContent = r.diasEsp + (r.diasEsp === 1 ? ' dia' : ' dias');
    document.getElementById('calc_r_proj').textContent = calcFmt(r.proj, 2) + ' kWh';
    return r;
  }

  function gerarCalcRefat() {
    if (!validarCampos('sf-calc-refat')) return;
    var r = calcularRefat();
    if (r.erro) { mostrarAviso('ATENÇÃO: ' + r.erro); return; }
    if (r.vazio) return;
    var nota = 'Refaturamento: leitura anterior ' + String(r.ltAnt) + ' em ' + calcDataBR(r.dtAnt) +
      ', leitura informada pelo cliente ' + String(r.ltCli) + ' em ' + calcDataBR(r.dtCli) +
      ', média de ' + calcFmt(r.media, 2) + ' kWh/dia. Leitura esperada para ' + calcDataBR(r.dtEsp) + ': ' + String(r.leituraArred) + '.';
    var agenda = 'MEMÓRIA DE CÁLCULO - REFATURAMENTO' +
      '\nLeitura da fatura anterior: ' + String(r.ltAnt) + ' (' + calcDataBR(r.dtAnt) + ')' +
      '\nLeitura apresentada pelo cliente: ' + String(r.ltCli) + ' (' + calcDataBR(r.dtCli) + ')' +
      '\nConsumo no período: ' + calcFmt(r.consumo, 0) + ' kWh em ' + r.diasCli + ' dias' +
      '\nMédia diária: ' + calcFmt(r.media, 2) + ' kWh/dia' +
      '\nDias até a fatura reclamada (' + calcDataBR(r.dtEsp) + '): ' + r.diasEsp +
      '\nConsumo projetado: ' + calcFmt(r.proj, 2) + ' kWh' +
      '\nLeitura esperada: ' + String(r.leituraArred);
    document.getElementById('calc_out_nota').value = nota;
    document.getElementById('calc_out_agenda').value = agenda;
    salvarNoHistorico('sf-calc-refat', nota, agenda);
    copiarTexto('calc_out_nota', 'calc_al_nota');
  }

  function limparCalcRefat() {
    document.querySelectorAll('#sf-calc-refat input[type="text"]').forEach(function(i) { i.value = ''; });
    document.getElementById('calc_out_nota').value = '';
    document.getElementById('calc_out_agenda').value = '';
    calcularRefat();
  }




  // Escolhe o tipo dentro de formulários compartilhados (Troca/Reativação/Isenção)
  function aplicarSubtipo(sf, sub) {
    if (sf === 'sf-isencao-deb' && sub) { document.getElementById('ise_servico').value = sub; toggleIsencaoDeb(); }
  }

