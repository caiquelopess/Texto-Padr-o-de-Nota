  // === ATUALIZAÇÃO CADASTRAL ===
  function toggleAtualizacaoCadastral() {
    var motivo = getVal('ac_motivo');
    document.getElementById('grp_ac_pns').style.display = motivo === 'Unificar PN' ? 'flex' : 'none';
    document.getElementById('alerta_ac_nome').style.display = motivo === 'Correção de Nome' ? 'block' : 'none';
  }
  function gerarAtualizacaoCadastral() {
    if (!validarCampos('sf-atualizacao-cadastral')) return;
    var motivo = getVal('ac_motivo');
    // campos em branco não entram no texto
    var linha = function(rotulo, id) { var v = getVal(id); return v ? '\n' + rotulo + ': ' + v : ''; };
    var txt = 'Gentileza Atualizar Cadastro' +
      '\nMotivo: ' + motivo +
      (motivo === 'Unificar PN' ? linha('PNs', 'ac_pns') : '') +
      linha('Nome', 'ac_nome') +
      linha('Telefone', 'ac_tel') +
      linha('E-mail', 'ac_email') +
      linha('RG', 'ac_rg') +
      linha('CNH', 'ac_cnh') +
      linha('ID (identificação profissional)', 'ac_id');
    finalizarGeracao('sf-atualizacao-cadastral', txt, txt, 'nota');
  }

