  // === ATUALIZAÇÃO CADASTRAL ===
  function toggleAtualizacaoCadastral() {
    var motivo = getVal('ac_motivo');
    document.getElementById('grp_ac_pns').style.display = motivo === 'Unificar PN' ? 'flex' : 'none';
    document.getElementById('alerta_ac_nome').style.display = motivo === 'Correção de Nome' ? 'block' : 'none';
  }
  function gerarAtualizacaoCadastral() {
    if (!validarCampos('sf-atualizacao-cadastral')) return;
    var motivo = getVal('ac_motivo');
    var ni = function(id) { return getVal(id) || 'Não informado'; };
    var txt = 'Gentileza Atualizar Cadastro' +
      '\nMotivo: ' + motivo +
      (motivo === 'Unificar PN' ? '\nPNs: ' + getVal('ac_pns') : '') +
      '\nNome: ' + getVal('ac_nome') +
      '\nTelefone: ' + getVal('ac_tel') +
      '\nE-mail: ' + getVal('ac_email') +
      '\nRG: ' + ni('ac_rg') +
      '\nCNH: ' + ni('ac_cnh') +
      '\nID (identificação profissional): ' + ni('ac_id');
    finalizarGeracao('sf-atualizacao-cadastral', txt, txt, 'nota');
  }

