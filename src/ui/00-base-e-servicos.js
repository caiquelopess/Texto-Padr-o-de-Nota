  // Ambiente: false = produção. A cópia em /teste/ é gerada com true:
  // faixa de aviso, histórico separado e atualizações lidas de /teste/.
  var AMBIENTE_TESTE = false;
  if (AMBIENTE_TESTE) {
    document.title = '[TESTE] ' + document.title;
    (function() {
      var f = document.createElement('div');
      f.className = 'faixa-teste';
      f.textContent = 'AMBIENTE DE TESTE — versão em avaliação. Não use para atendimento real.';
      document.body.insertBefore(f, document.body.firstChild);
    })();
  }
  var abaAtualId = null;
  // Serviços que só têm texto de AGENDA (sem nota)
  var SERVICOS_SO_AGENDA = ['sf-verif-equip', 'sf-afericao'];

  function mostrarAviso(msg, tipo) {
    var t = document.getElementById('toastAviso');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('ok', tipo === 'ok');
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.classList.remove('show'); }, tipo === 'longo' ? 12000 : 4500);
  }

  // Cada tipo de Troca/Reativação tem o próprio botão. Um formulário pode
  // atender mais de um botão: o id "formulário|subtipo" abre o formulário já
  // com o tipo certo escolhido (ex.: 'sf-tt|com_assuncao').
  var nomeServicoAtivo = {}, subtipoAtivo = {};
  function trocarAba(id, btn) {
    var partes = String(id).split('|'), sf = partes[0], sub = partes[1] || '';
    if (typeof pendModo !== 'undefined' && pendModo && pendModo.servicoId !== id) sairModoPendencia(true);   // trocou de serviço: sai do modo pendência
    subtipoAtivo[sf] = sub;
    if (sub && btn && btn.textContent) nomeServicoAtivo[sf] = btn.textContent.trim(); else delete nomeServicoAtivo[sf];
    trocarAbaBase(sf, btn);
    if (sub) aplicarSubtipo(sf, sub);
  }

  function trocarAbaBase(sfId, btn) {
    mostrarCaixaNota(SERVICOS_SO_AGENDA.indexOf(sfId) < 0);
    // Trocar de serviço NÃO apaga o que já foi digitado: os formulários
    // ficam montados no DOM (apenas ocultos), então os dados de cada
    // serviço são mantidos ao ir e voltar entre eles. Apagar é papel
    // exclusivo do botão "Limpar Tudo" de cada formulário.
    abaAtualId = sfId;

    var vazio = document.getElementById('form_vazio');
    if (vazio) vazio.style.display = 'none';

    document.querySelectorAll('.sub-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.subform').forEach(function(s) { s.classList.remove('active'); });
    
    if (btn) btn.classList.add('active');
    var target = document.getElementById(sfId);
    if (target) {
      target.classList.add('active');
      desbloquearFormulario(sfId);
    }
  }

  function bloquearFormulario(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.disabled = true;
    });

    container.querySelectorAll('button').forEach(function(btn) {
      if (!btn.classList.contains('btn-clear') && !btn.classList.contains('btn-edit')) {
        btn.disabled = true;
      }
    });

    var banner = container.querySelector('.lock-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'lock-banner';
      banner.innerHTML = '🔒 Formulário bloqueado. Para corrigir os dados sem apagar o que foi digitado, clique em <b>"Editar"</b> abaixo — ou em <b>"Limpar Tudo"</b> para recomeçar do zero.';
      container.insertBefore(banner, container.firstChild);
    }
    banner.style.display = 'block';

    // Botão Editar fica na fileira de ações, entre "Gerar" e "Limpar Tudo".
    var actions = container.querySelector('.actions');
    if (actions) {
      var editBtn = actions.querySelector('.btn-edit');
      if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-edit';
        editBtn.textContent = 'Editar';
        editBtn.setAttribute('data-click', 'desbloquearFormulario(\'' + containerId + '\')');
        var clearBtn = actions.querySelector('.btn-clear');
        if (clearBtn) {
          actions.insertBefore(editBtn, clearBtn);
        } else {
          actions.appendChild(editBtn);
        }
      }
      editBtn.disabled = false;
      editBtn.style.display = 'block';
    }
  }

  function desbloquearFormulario(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('input, select, textarea, button').forEach(function(el) {
      el.disabled = false;
    });

    var banner = container.querySelector('.lock-banner');
    if (banner) {
      banner.style.display = 'none';
    }

    var editBtn = container.querySelector('.actions .btn-edit');
    if (editBtn) {
      editBtn.style.display = 'none';
    }
  }

  function mostrarCaixaNota(visivel) {
    var g = document.getElementById('out-nota');
    g = g && g.closest ? g.closest('.output-group') : null;
    if (g) g.style.display = visivel ? '' : 'none';
  }

  function finalizarGeracao(containerId, notaTxt, agendaTxt, copyTarget) {
    if (typeof pendenciaAoGerar === 'function') setTimeout(function() { pendenciaAoGerar(containerId, notaTxt, agendaTxt); }, 0);
    mostrarCaixaNota(!!notaTxt);
    document.getElementById('out-nota').value = notaTxt;
    document.getElementById('out-agenda').value = agendaTxt;
    salvarNoHistorico(containerId, notaTxt, agendaTxt);
    bloquearFormulario(containerId);
    if (copyTarget === 'agenda') {
      copiarTexto('out-agenda', 'al-agenda');
    } else {
      copiarTexto('out-nota', 'al-nota');
    }
  }

  // DINÂMICA DE FATURAS DE RECLAMAÇÃO (SUPORTA MAIS DE 10)
  function adicionarFaturaRow() {
    var container = document.getElementById('container_faturas_rec');
    var div = document.createElement('div');
    div.className = 'fatura-row';
    div.innerHTML = '<input type="text" class="rec_fat_venc" placeholder="Vencimento: dd/mm/aaaa" data-input="mascararData(this)" required>' +
                    '<input type="text" class="rec_fat_valor" placeholder="Valor R$: 0,00" required>' +
                    '<button type="button" class="btn-del" data-click="removerFaturaRow(this)">✕</button>';
    container.appendChild(div);
  }

  function removerFaturaRow(btn) {
    var rows = document.querySelectorAll('#container_faturas_rec .fatura-row');
    if (rows.length > 1) {
      btn.parentElement.remove();
    } else {
      btn.parentElement.querySelectorAll('input').forEach(function(i) { i.value = ''; });
    }
  }

  function toggleReclamacoes() {
    var tipo = document.getElementById('rec_tipo').value;
    var alerta = document.getElementById('rec_alerta_box');

    var lblNome = document.getElementById('lbl_rec_nome');
    if (tipo === 'cadastro' || tipo === 'toi' || tipo === 'cobranca') {
      lblNome.innerText = 'Solicitante (informar caso seja procurador): *';
    } else if (tipo === 'leitura_fat') {
      lblNome.innerText = 'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): *';
    } else {
      lblNome.innerText = 'Nome e sobrenome do cliente (titular ou terceiros): *';
    }

    if (tipo === 'arrecadacao' || tipo === 'negativa') {
      alerta.innerHTML = '⚠️ Atenção: Ao realizar a abertura da reclamação, é muito importante que seja inserido bloqueio de 15 dias nas faturas reclamadas. Incluir o texto da nota na agenda da conta contrato.';
    } else {
      alerta.innerHTML = '⚠️ Atenção: Incluir o texto da nota na agenda da conta contrato. Sempre informar "Realizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.". Sempre ofertar parcelamento caso tenha fatura em aberto. ';
    }

    var isLeitura = (tipo === 'leitura_fat');
    var isAtendimento = (tipo === 'atendimento');
    var isAtraso = (tipo === 'atraso');
    var isCadastro = (tipo === 'cadastro');
    var isArrecadacao = (tipo === 'arrecadacao');
    var isToi = (tipo === 'toi');
    var isNegativa = (tipo === 'negativa');
    var isCobranca = (tipo === 'cobranca');
    var isObra = (tipo === 'obra');
    var isEntrega = (tipo === 'entrega');

    document.getElementById('grp_rec_subcanal').style.display = isAtendimento ? 'flex' : 'none';
    if (isAtendimento) {
      toggleCanalAtendimento();
    } else {
      ['grp_rec_proto', 'grp_rec_loja', 'grp_rec_equipe', 'grp_rec_nota_exec', 'grp_rec_data', 'grp_rec_hora', 'grp_rec_func'].forEach(function(id) {
        document.getElementById(id).style.display = 'none';
      });
      ['rec_proto', 'rec_loja', 'rec_equipe', 'rec_nota_exec', 'rec_data', 'rec_hora', 'rec_func'].forEach(function(id) {
        document.getElementById(id).required = false;
      });
    }

    document.getElementById('grp_rec_parte_interna').style.display = isLeitura ? 'flex' : 'none';
    document.getElementById('grp_rec_prob_medidor').style.display = isLeitura ? 'flex' : 'none';
    document.getElementById('grp_rec_analises').style.display = isLeitura ? 'flex' : 'none';
    document.getElementById('grp_rec_faturas_dinamicas').style.display = isLeitura ? 'flex' : 'none';
    document.getElementById('grp_rec_leit_cliente').style.display = isLeitura ? 'flex' : 'none';
    document.getElementById('grp_rec_dt_leit').style.display = isLeitura ? 'flex' : 'none';

    document.getElementById('rec_prob_medidor').required = isLeitura;
    document.getElementById('rec_analises').required = isLeitura;
    document.getElementById('rec_leit_cliente').required = isLeitura;
    document.getElementById('rec_dt_leit').required = isLeitura;
    document.querySelectorAll('#container_faturas_rec input').forEach(function(inp) {
      inp.required = isLeitura;
    });

    document.getElementById('grp_rec_motivo_obra').style.display = isObra ? 'flex' : 'none';
    document.getElementById('grp_rec_motivo_txt').style.display = isObra ? 'none' : 'flex';
    document.getElementById('rec_motivo').required = !isObra;

    var txtMotivo = document.getElementById('rec_motivo');
    var lblMotivo = document.getElementById('lbl_rec_motivo');
    if (isLeitura) {
      lblMotivo.innerText = 'Descrição da Reclamação: *';
      txtMotivo.placeholder = 'Descreva a reclamação com bastantes detalhes...';
    } else if (isToi) {
      lblMotivo.innerText = 'Motivo da reclamação: *';
      txtMotivo.placeholder = 'Evidencie o pedido do cliente (Ex: responsabilidade sobre a irregularidade, discordância do período cobrado e/ou recálculo baseado na carga informada)...';
    } else if (isCobranca) {
      lblMotivo.innerText = 'Motivo da reclamação: *';
      txtMotivo.placeholder = 'Evidencie qual a cobrança que foi indevida e em qual fatura esta ocorreu...';
    } else {
      lblMotivo.innerText = 'Motivo da Reclamação: *';
      txtMotivo.placeholder = 'Descreva o motivo da reclamação...';
    }

    var exibeNota = (isAtraso || isObra);
    document.getElementById('grp_rec_num_nota').style.display = exibeNota ? 'flex' : 'none';
    document.getElementById('rec_num_nota').required = exibeNota;
    document.getElementById('lbl_rec_num_nota').innerText = isAtraso ? 'Número da nota de serviço em atraso: *' : 'Número da nota de serviço: *';

    var exibeFaturaSimples = (isArrecadacao || isNegativa || isEntrega);
    document.getElementById('grp_rec_fatura_simples').style.display = exibeFaturaSimples ? 'flex' : 'none';
    document.getElementById('rec_fatura_simples').required = exibeFaturaSimples;
    document.getElementById('lbl_rec_fatura_simples').innerText = isArrecadacao ? 'Fatura(s): (vencimento e valor): *' : 'Fatura: (vencimento e valor) *';

    document.getElementById('grp_rec_end_atual').style.display = isCadastro ? 'flex' : 'none';
    document.getElementById('grp_rec_cc_atual').style.display = isCadastro ? 'flex' : 'none';
    document.getElementById('rec_end_atual').required = isCadastro;
    document.getElementById('rec_cc_atual').required = isCadastro;

    var exibeRef = (isLeitura || isAtraso || isArrecadacao || isObra);
    document.getElementById('grp_rec_ref').style.display = exibeRef ? 'flex' : 'none';
    document.getElementById('rec_ref').required = exibeRef;

    document.getElementById('grp_rec_outras').style.display = isArrecadacao ? 'flex' : 'none';
    document.getElementById('rec_outras').required = isArrecadacao;

    document.getElementById('grp_rec_ant').style.display = isObra ? 'none' : 'flex';
  }

  function toggleCanalAtendimento() {
    var sub = document.getElementById('rec_subcanal').value;
    var isPres = (sub === 'presencial');
    var isTele = (sub === 'teleatendimento');
    var isCampo = (sub === 'campo');

    document.getElementById('grp_rec_proto').style.display = (isPres || isTele) ? 'flex' : 'none';
    document.getElementById('grp_rec_loja').style.display = isPres ? 'flex' : 'none';
    document.getElementById('grp_rec_equipe').style.display = isCampo ? 'flex' : 'none';
    document.getElementById('grp_rec_nota_exec').style.display = isCampo ? 'flex' : 'none';
    document.getElementById('grp_rec_data').style.display = 'flex';
    document.getElementById('grp_rec_hora').style.display = 'flex';
    document.getElementById('grp_rec_func').style.display = 'flex';

    document.getElementById('rec_proto').required = (isPres || isTele);
    document.getElementById('rec_loja').required = isPres;
    document.getElementById('rec_equipe').required = isCampo;
    document.getElementById('rec_nota_exec').required = isCampo;
    document.getElementById('rec_data').required = true;
    document.getElementById('rec_hora').required = true;
    document.getElementById('rec_func').required = true;
  }

  function gerarReclamacaoUnificada() {
    if (!validarCampos('sf-reclamacoes')) return;

    var tipo = getVal('rec_tipo');
    var nome = getVal('rec_nome');
    var tel = getVal('rec_tel');
    var email = getVal('rec_email');
    var mod = getVal('rec_modalidade');
    var ant = getVal('rec_ant') || 'N/A';
    var txt = '';

    var prazo5a10 = 'Prazo para análise 5 (cinco) dias úteis ou caso seja necessária a realização de visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.';
    var prazoTOI = 'Prazo para análise até 15 (quinze) dias corridos, contados a partir da data do protocolo.\nRealizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.';

    if (tipo === 'leitura_fat') {
      var faturasList = [];
      var rows = document.querySelectorAll('#container_faturas_rec .fatura-row');
      rows.forEach(function(row) {
        var v = row.querySelector('.rec_fat_venc').value.trim();
        var val = row.querySelector('.rec_fat_valor').value.trim();
        if (v || val) {
          faturasList.push('vencimento ' + (v || 'N/A') + ' R$ ' + (val || '0,00'));
        }
      });
      var faturasStr = faturasList.length ? faturasList.join('; ') : 'Não informado';

      txt = 'Solicitante - Nome e sobrenome do cliente (Titular ou terceiros): ' + nome +
        '\nDescrição da Reclamação: ' + getVal('rec_motivo') +
        '\nInforme se a parte interna já foi verificada: ' + getVal('rec_parte_interna') +
        '\nApontamento de problema no medidor: ' + getVal('rec_prob_medidor') +
        '\nInforme as análises realizadas: ' + getVal('rec_analises') +
        '\nValor e vencimento da Fatura: ' + faturasStr +
        '\nLeitura apresentada pelo cliente: ' + getVal('rec_leit_cliente') + ' | Data da coleta da Leitura: ' + getVal('rec_dt_leit') +
        '\nPonto de Referência: ' + getVal('rec_ref') +
        '\nE-mail: ' + email +
        '\nTel. Celular: ' + tel +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\n' + prazo5a10;

    } else if (tipo === 'atendimento') {
      var sub = getVal('rec_subcanal');
      var linhaProto = (sub !== 'campo') ? '\nProtocolo do Atendimento (*apenas reclamação de teleatendimento/presencial): ' + getVal('rec_proto') : '';
      var linhaLoja = (sub === 'presencial') ? '\nLoja de Atendimento Reclamada (*apenas quando reclamação de atendimento presencial): ' + getVal('rec_loja') : '';
      var linhaEquipe = (sub === 'campo') ? '\nEquipe Reclamada (*apenas quando reclamação do serviço de campo - placa do veículo): ' + getVal('rec_equipe') : '';
      var linhaNotaExec = (sub === 'campo') ? '\nNº da Nota de Serviço que foi Executada (*apenas quando reclamação do serviço de campo): ' + getVal('rec_nota_exec') : '';

      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nCanal do Atendimento Reclamado: ' + sub +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        linhaProto + linhaLoja + linhaEquipe + linhaNotaExec +
        '\nData: ' + getVal('rec_data') +
        '\nHorário: ' + getVal('rec_hora') +
        '\nNome do Funcionário Reclamado: ' + getVal('rec_func') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else if (tipo === 'atraso') {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nNúmero da nota de serviço em atraso: ' + getVal('rec_num_nota') +
        '\nPontos de referência: ' + getVal('rec_ref') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\n' + prazo5a10;

    } else if (tipo === 'cadastro') {
      txt = 'Solicitante (informar caso seja procurador): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nCliente informa que hoje reside no endereço: ' + getVal('rec_end_atual') +
        '\nConta contrato atual do solicitante: ' + getVal('rec_cc_atual') +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else if (tipo === 'arrecadacao') {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nFatura(s): (vencimento e valor): ' + getVal('rec_fatura_simples') +
        '\nPonto de Referência: ' + getVal('rec_ref') +
        '\nE-mail: ' + email +
        '\nTelefone: ' + tel +
        '\nOutras informações: ' + getVal('rec_outras') +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else if (tipo === 'toi') {
      txt = 'Solicitante (informar caso seja procurador): ' + nome +
        '\nTelefones: ' + tel + ' | E-mail para contato: ' + email +
        '\nMotivo da reclamação: ' + getVal('rec_motivo') +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazoTOI;

    } else if (tipo === 'negativa') {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nFatura: (vencimento e valor): ' + getVal('rec_fatura_simples') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else if (tipo === 'cobranca') {
      txt = 'Solicitante (informar caso seja procurador): ' + nome +
        '\nTelefones e e-mail para contato: ' + tel + ' - ' + email +
        '\nMotivo da reclamação: ' + getVal('rec_motivo') +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else if (tipo === 'obra') {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo_obra') +
        '\nNúmero da nota de serviço: ' + getVal('rec_num_nota') +
        '\nPontos de referência: ' + getVal('rec_ref') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\n' + prazo5a10;

    } else if (tipo === 'entrega') {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nFatura: (vencimento e valor): ' + getVal('rec_fatura_simples') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;

    } else {
      txt = 'Nome e sobrenome do cliente (titular ou terceiros): ' + nome +
        '\nMotivo da Reclamação: ' + getVal('rec_motivo') +
        '\nTelefone: ' + tel +
        '\nE-mail: ' + email +
        '\nModalidade de comunicação (e-mail, SMS ou carta): ' + mod +
        '\nCaso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant +
        '\n' + prazo5a10;
    }

    finalizarGeracao('sf-reclamacoes', txt, txt, 'nota');
  }

  function toggleFormaPagRes() {
    var isConta = (document.getElementById('res_forma_pag').value === 'conta');
    document.getElementById('grp_res_conta').style.display = isConta ? 'flex' : 'none';
    document.getElementById('grp_res_tipo_conta').style.display = isConta ? 'flex' : 'none';
    document.getElementById('res_conta').required = isConta;
  }




  /* ===== PADRONIZAÇÃO: DATA, CPF/CNPJ E TELEFONE =====
     Roda dentro de validarCampos (chamado por todos os geradores, antes
     de montar o texto). Valida os valores e regrava o campo já formatado,
     para o texto gerado sair padronizado. Não altera a redação de
     nenhum texto padrão — só o formato/validação desses valores. */

  // Datas dd/mm/aaaa de fatos já ocorridos: data real e NÃO futura
  var DATAS_PASSADAS = { rec_data: 1, rec_dt_leit: 1, gd_dt_ultima_fat: 1, gd_dt_ult_sem_cred: 1, gd_dt_gmm: 1, def_dt_ent: 1, def_dt_env: 1, tg_data: 1 };
  // Datas dd/mm/aaaa que podem ser futuras (agendamento, vencimento, período): só data real
  var DATAS_LIVRES = { lp_dt_lig: 1, lp_dt_deslig: 1, refp_dt_deslig: 1, refp_dt_relig: 1, def_fat_venc: 1, bloq_dt_ini: 1, bloq_dt_fim: 1 };
  // Campos "data e horário" (dd/mm/aaaa + hora no mesmo campo): fato já ocorrido
  var DATAS_HORA_PASSADAS = { rde_dt_ini: 1, rde_dt_fim: 1, rod_dt_ini: 1, rod_dt_fim: 1 };

  function rotuloDoCampo(inp) {
    var labelEl = inp.previousElementSibling;
    if ((!labelEl || labelEl.tagName !== 'LABEL') && inp.parentElement && inp.parentElement.parentElement) {
      labelEl = inp.parentElement.parentElement.previousElementSibling;
    }
    return labelEl ? labelEl.innerText.replace('*', '').trim() : 'Campo';
  }

  function barrarCampo(inp, msg) {
    mostrarAviso(msg);
    inp.focus();
    return false;
  }

  function dataRealBR(dia, mes, ano) {
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    var dt = new Date(ano, mes - 1, dia);
    if (dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return null;
    return dt;
  }

  function ehFutura(dt) {
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dt.getTime() > hoje.getTime();
  }

  function doisDig(n) { return (n < 10 ? '0' : '') + n; }

  // Confere uma data dd/mm/aaaa: retorna { ok:true, texto } ou { erro:'formato'|'invalida'|'futura' }
  function conferirData(valor, naoFutura) {
    var m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(valor.trim());
    if (!m) return { erro: 'formato' };
    var dia = parseInt(m[1], 10), mes = parseInt(m[2], 10), ano = parseInt(m[3], 10);
    var dt = dataRealBR(dia, mes, ano);
    if (!dt) return { erro: 'invalida' };
    if (naoFutura && ehFutura(dt)) return { erro: 'futura' };
    return { ok: true, texto: doisDig(dia) + '/' + doisDig(mes) + '/' + ano };
  }



  function padronizarCampos(containerId) {
    var inputs = document.querySelectorAll('#' + containerId + ' input');
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.offsetParent === null) continue;
      var valor = inp.value.trim();
      if (!valor) continue;
      var id = inp.id || '';
      var lbl = rotuloDoCampo(inp);

      // Telefone: todo campo *_tel
      if (/_tel$/.test(id)) {
        var telFmt = formatarTelefones(valor);
        if (!telFmt) return barrarCampo(inp, 'ATENÇÃO: O telefone do campo "' + lbl + '" deve ter 10 ou 11 dígitos, com DDD. Verifique e tente novamente.');
        inp.value = telFmt;
        continue;
      }

      // Vencimento das faturas da reclamação (linhas dinâmicas)
      if (inp.classList.contains('rec_fat_venc')) {
        var cf = conferirData(valor, false);
        if (cf.erro) return barrarCampo(inp, 'ATENÇÃO: O vencimento da fatura deve ser uma data real, no formato dd/mm/aaaa.');
        inp.value = cf.texto;
        continue;
      }

      // Data e horário do ocorrido (dd/mm/aaaa dentro do campo)
      if (DATAS_HORA_PASSADAS[id]) {
        var mdh = /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/.exec(valor);
        if (!mdh) return barrarCampo(inp, 'ATENÇÃO: O campo "' + lbl + '" deve começar com uma data no formato dd/mm/aaaa.');
        var dth = dataRealBR(parseInt(mdh[1], 10), parseInt(mdh[2], 10), parseInt(mdh[3], 10));
        if (!dth) return barrarCampo(inp, 'ATENÇÃO: A data do campo "' + lbl + '" não é uma data real. Verifique o dia e o mês.');
        if (ehFutura(dth)) return barrarCampo(inp, 'ATENÇÃO: A data do campo "' + lbl + '" não pode ser uma data futura.');
        continue;
      }

      // Datas dd/mm/aaaa
      if (DATAS_PASSADAS[id] || DATAS_LIVRES[id]) {
        if (id === 'rec_dt_leit' && valor.toUpperCase() === 'N/A') continue;
        var c = conferirData(valor, !!DATAS_PASSADAS[id]);
        if (c.erro === 'formato') return barrarCampo(inp, 'ATENÇÃO: A data do campo "' + lbl + '" deve estar no formato dd/mm/aaaa.');
        if (c.erro === 'invalida') return barrarCampo(inp, 'ATENÇÃO: A data do campo "' + lbl + '" não é uma data real. Verifique o dia e o mês.');
        if (c.erro === 'futura') return barrarCampo(inp, 'ATENÇÃO: A data do campo "' + lbl + '" não pode ser uma data futura.');
        inp.value = c.texto;
        continue;
      }
    }
    return true;
  }

  /* ===== MÁSCARA DE DATA: rod_dt_ini / rod_dt_fim (Danos Não Elétricos) =====
     Ao digitar só os números da data, a "/" entra sozinha:
     10102026 vira 10/10/2026. Só a data inicial do campo é mascarada;
     o restante (" às hh:mm") continua exatamente como foi digitado.
     A validação de data real em padronizarCampos segue operando sobre
     o valor já mascarado, sem nenhuma alteração. */
  function mascararDataHoraRod(inp) {
    if (!inp) return;
    var valor = inp.value;
    var posCursor = (typeof inp.selectionStart === 'number') ? inp.selectionStart : valor.length;
    // Trecho inicial da data: apenas dígitos e "/" até completar 8 dígitos (ddmmaaaa)
    var i = 0, digitos = '';
    while (i < valor.length && digitos.length < 8) {
      var ch = valor.charAt(i);
      if (ch >= '0' && ch <= '9') { digitos += ch; i++; }
      else if (ch === '/') { i++; }
      else break;
    }
    var resto = valor.slice(i);
    var mascarado = digitos;
    if (digitos.length > 4) mascarado = digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4);
    else if (digitos.length > 2) mascarado = digitos.slice(0, 2) + '/' + digitos.slice(2);
    var novo = mascarado + resto;
    if (novo === valor) return;
    // Reposiciona o cursor: dentro da data, acompanha os dígitos já
    // digitados (somando as "/" inseridas); no restante do campo,
    // mantém o mesmo deslocamento em relação ao fim da data.
    var novaPos;
    if (posCursor <= i) {
      var digAntes = valor.slice(0, posCursor).replace(/\D/g, '').length;
      novaPos = digAntes + (digAntes > 2 ? 1 : 0) + (digAntes > 4 ? 1 : 0);
    } else {
      novaPos = mascarado.length + (posCursor - i);
    }
    inp.value = novo;
    try { inp.setSelectionRange(novaPos, novaPos); } catch (e) {}
  }

  /* ===== MÁSCARAS DE DATA (digitação) — TODOS OS SERVIÇOS =====
     Mesma atualização aplicada antes aos campos de data e horário do
     Danos Não Elétricos, agora em todo campo onde se digita data:
     digitando só os números, a "/" entra sozinha após o dia e o mês
     (10102026 vira 10/10/2026). Campos que aceitam "N/A" continuam
     aceitando: se o valor tiver letras, a máscara não interfere.
     A validação de data real em padronizarCampos segue operando sobre
     o valor já mascarado, sem nenhuma alteração. */
  function reposicionarCursorData(inp, novo, digAntes) {
    var novaPos = novo.length;
    if (digAntes <= 0) {
      novaPos = 0;
    } else {
      var cont = 0;
      for (var k = 0; k < novo.length; k++) {
        var ch = novo.charAt(k);
        if (ch >= '0' && ch <= '9') { cont++; if (cont >= digAntes) { novaPos = k + 1; break; } }
      }
    }
    try { inp.setSelectionRange(novaPos, novaPos); } catch (e) {}
  }

  // Data pura dd/mm/aaaa
  function mascararData(inp) {
    if (!inp) return;
    var valor = inp.value;
    if (/[A-Za-z]/.test(valor)) return;
    var pos = (typeof inp.selectionStart === 'number') ? inp.selectionStart : valor.length;
    var digAntes = valor.slice(0, pos).replace(/\D/g, '').length;
    var d = valor.replace(/\D/g, '').slice(0, 8);
    var novo = d;
    if (d.length > 4) novo = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) novo = d.slice(0, 2) + '/' + d.slice(2);
    if (novo === valor) return;
    inp.value = novo;
    reposicionarCursorData(inp, novo, Math.min(digAntes, d.length));
  }

  // Data dd/mm/aaaa OU mês/ano mm/aaaa (campos "dataOuMes" dos modelos, ex.: TR de Partidas).
  // Se os dígitos 3-4 não formam um mês válido (01 a 12), o que está
  // sendo digitado é o ano de um mm/aaaa: a "/" fica só após o mês.
  function mascararDataOuMes(inp) {
    if (!inp) return;
    var valor = inp.value;
    if (/[A-Za-z]/.test(valor)) return;
    var pos = (typeof inp.selectionStart === 'number') ? inp.selectionStart : valor.length;
    var digAntes = valor.slice(0, pos).replace(/\D/g, '').length;
    var digitos = valor.replace(/\D/g, '');
    var mesAno = false;
    if (digitos.length >= 4) {
      var parMes = parseInt(digitos.slice(2, 4), 10);
      if (!(parMes >= 1 && parMes <= 12)) mesAno = true;
    }
    var d, novo;
    if (mesAno) {
      d = digitos.slice(0, 6);
      novo = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    } else {
      d = digitos.slice(0, 8);
      novo = d;
      if (d.length > 4) novo = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
      else if (d.length > 2) novo = d.slice(0, 2) + '/' + d.slice(2);
    }
    if (novo === valor) return;
    inp.value = novo;
    reposicionarCursorData(inp, novo, Math.min(digAntes, d.length));
  }

  function validarCampos(containerId) {
    var inputs = document.querySelectorAll('#' + containerId + ' input[required], #' + containerId + ' textarea[required]');
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.offsetParent !== null && !inp.value.trim()) {
        mostrarAviso('ATENÇÃO: Você precisa preencher o campo: ' + rotuloDoCampo(inp));
        inp.focus();
        return false;
      }
    }
    return padronizarCampos(containerId);
  }

  function copiarTexto(elementId, alertId) {
    var el = document.getElementById(elementId);
    if (!el || !el.value) return;
    function sucesso() {
      var al = document.getElementById(alertId);
      if (al) {
        al.style.display = 'inline';
        setTimeout(function() { al.style.display = 'none'; }, 2000);
      }
    }
    // Plano B: se a API de área de transferência for negada ou não
    // existir, seleciona o texto da caixa de saída e copia pela
    // seleção. Se nem isso funcionar, avisa em vez de falhar calado
    // e deixa o texto selecionado para copiar com Ctrl+C.
    function planoB() {
      var ok = false;
      try {
        el.focus();
        el.select();
        el.setSelectionRange(0, el.value.length);
        ok = document.execCommand('copy');
      } catch (e) { ok = false; }
      if (ok) {
        sucesso();
      } else {
        try { el.focus(); el.select(); el.setSelectionRange(0, el.value.length); } catch (e2) {}
        mostrarAviso('Não foi possível copiar automaticamente. O texto está selecionado na caixa de saída — copie com Ctrl+C.');
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(el.value).then(sucesso, planoB);
    } else {
      planoB();
    }
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // GERADORES DOS DEMAIS SERVIÇOS
  // Ligação Nova: "Normal" ou "Por expediente" (só muda os campos e a NOTA).
  function toggleLigacaoNova() {
    var exp = getVal('ln_modo') === 'expediente';
    document.querySelectorAll('#sf-ligacao-nova .grp-ln-normal').forEach(function(g) { g.style.display = exp ? 'none' : 'flex'; });
    document.querySelectorAll('#sf-ligacao-nova .grp-ln-exp').forEach(function(g) { g.style.display = exp ? 'flex' : 'none'; });
  }



  // NOTA no padrão "LN/RT {FASE} N° {NÚMERO} {COMPLEMENTO} REF: ... CG: ... TEL: ... PC: ... PZ 5D UTEIS"
  function notaPadraoEndereco(sigla, p) {
    return notaCaps(sigla + ' ' + getVal(p + '_tipo_lig') + ' N° ' + getVal(p + '_numero') + ' ' + getVal(p + '_compl') +
      ' REF: ' + getVal(p + '_ref') + ' CG: ' + getVal(p + '_coords') + ' TEL: ' + telefonesPadraoNota(getVal(p + '_tel')) +
      ' PC: ' + getVal(p + '_proc') + ' PZ 5D UTEIS');
  }

  // AGENDA no padrão da Reativação (também usado na Ligação Nova normal)
  function agendaPadraoEndereco(tipoSolic, p) {
    return 'Tipo de solicitação: ' + tipoSolic +
      '\nSolicitante: ' + getVal(p + '_solic') +
      '\nPontos de referências: ' + getVal(p + '_ref') +
      '\nCoordenadas geográficas: ' + getVal(p + '_coords') +
      '\nTipo de ligação: ' + (getVal(p + '_tipo_lig') || getVal(p + '_fase')) +
      '\nTelefones para contato: ' + getVal(p + '_tel') +
      '\nE-mail para contato: ' + getVal(p + '_email') +
      '\nDados da receita: (regular/pendente de regularização): ' + getVal(p + '_rec').toUpperCase() +
      '\nQuem deverá ser procurado no local: ' + getVal(p + '_proc') +
      '\nCiente do prazo de 5 dias úteis para execução do serviço';
  }

  function gerarLigacaoNova() {
    if (!validarCampos('sf-ligacao-nova')) return;
    var nota, agenda;
    if (getVal('ln_modo') === 'expediente') {
      nota = notaCaps('LN ' + getVal('ln_tipo_lig') + ' LIB P/AE ' + getVal('ln_num_nota') + ' AP ' + getVal('ln_ap') + ' BL ' + getVal('ln_bloco') +
        ' REF: ' + getVal('ln_ref') + ' TEL: ' + telefonesPadraoNota(getVal('ln_tel')) + ' PC: ' + getVal('ln_proc')) +
        '/' + getVal('ln_email') + ' PZ 5D UTEIS';
      agenda = 'Tipo de solicitação: Ligação Nova' +
        '\nSolicitante: ' + getVal('ln_solic') +
        '\nPontos de referências: ' + getVal('ln_ref') +
        '\nNome do Empreendimento: ' + getVal('ln_emp') +
        '\nCoordenadas geográficas: ' + getVal('ln_coords') +
        '\nTipo de ligação: ' + getVal('ln_tipo_lig') +
        '\nTelefones para contato: ' + getVal('ln_tel') +
        '\nE-mail para contato: ' + getVal('ln_email') +
        '\nDados da receita: ' + getVal('ln_rec').toUpperCase() +
        '\nQuem deverá ser procurado no local: ' + getVal('ln_proc') +
        '\nCiente do prazo de 5 dias úteis para execução do serviço';
    } else {
      nota = notaPadraoEndereco('LN', 'ln');
      agenda = agendaPadraoEndereco('Ligação Nova', 'ln');
    }
    finalizarGeracao('sf-ligacao-nova', nota, agenda, 'nota');
  }

  function gerarLigacaoMUC() {
    if (!validarCampos('sf-ligacao-muc')) return;
    var nota = 'Lig nov Solic ' + getVal('muc_solic') + ' Ref ' + getVal('muc_ref') + ' Tel ' + getVal('muc_tel') + ' Lig ' + getVal('muc_tipo_lig') + ' Prazo 5 dias úteis Proc ' + getVal('muc_proc') + ' MUC ' + getVal('muc_cod') + ' Nome do empreendimento ' + getVal('muc_emp') + ' TORRE/BL/AP ' + getVal('muc_unid');
    var agendaMUC = 'MUC: ' + getVal('muc_cod') + ' | Nome do empreendimento: ' + getVal('muc_emp') + ' | TORRE/BL/AP: ' + getVal('muc_unid');
    var agenda = 'Tipo de solicitação: MUC' +
      '\nSolicitante: ' + getVal('muc_solic') +
      '\nPontos de referências: ' + getVal('muc_ref') +
      '\nCoordenadas geográficas: ' + getVal('muc_coords') +
      '\nTipo de ligação: ' + getVal('muc_tipo_lig') +
      '\nTelefones para contato: ' + getVal('muc_tel') +
      '\n' + agendaMUC +
      '\nE-mail para contato: ' + getVal('muc_email') +
      '\nDados da receita: ' + getVal('muc_rec') +
      '\nQuem deverá ser procurado no local: ' + getVal('muc_proc') +
      '\nCiente do prazo de 5 dias úteis para execução do serviço';
    finalizarGeracao('sf-ligacao-muc', nota, agenda, 'nota');
  }





  function gerarRES() {
    if (!validarCampos('sf-res')) return;
    var forma = (getVal('res_forma_pag') === 'conta') ? '(X) Conta Bancária ( ) Ordem de pagamento' : '( ) Conta Bancária (X) Ordem de pagamento';
    var conta = (getVal('res_forma_pag') === 'conta') ? getVal('res_conta') : 'Não se aplica';
    var tipoConta = (getVal('res_forma_pag') === 'conta') ? getVal('res_tipo_conta') : 'Não se aplica';
    var txt = 'Solicitante: ' + getVal('res_solic') +
      '\nTelefone: ' + getVal('res_tel') +
      '\nE mail: ' + getVal('res_email1') +
      '\nForma de pagamento: ' + forma +
      '\nE-mail: ' + getVal('res_email2') +
      '\nDados Bancários: ' + getVal('res_dados_banc') +
      '\nBanco: ' + getVal('res_banco') +
      '\nAgência: ' + getVal('res_ag') +
      '\nConta: ' + conta +
      '\nTipo da Conta: ' + tipoConta;
    finalizarGeracao('sf-res', txt, txt, 'nota');
  }



















  function gerarDanosEletricos() {
    if (!validarCampos('sf-danos-eletricos')) return;
    var cons = (getVal('rde_conserto') === 'sim') ? 'Sim (X) Não ( )' : 'Sim ( ) Não (X)';
    var txt = 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA' +
      '\nSolicitante: ' + getVal('rde_solic') +
      '\nRelato da ocorrência: ' + getVal('rde_relato') +
      '\nData e horário do início do ocorrido: ' + getVal('rde_dt_ini') +
      '\nData e horário do fim do ocorrido: ' + getVal('rde_dt_fim') +
      '\nReferência: ' + getVal('rde_ref') +
      '\nTelefone para contato: ' + getVal('rde_tel') +
      '\nE-mail para contato: ' + getVal('rde_email') +
      '\nMeio de comunicação escolhido: ' + getVal('rde_meio') +
      '\nLista de equipamentos danificados: ' + getVal('rde_lista') +
      '\nOcorreu o conserto: ' + cons;
    finalizarGeracao('sf-danos-eletricos', txt, txt, 'agenda');
  }

  function gerarOutrosDanos() {
    if (!validarCampos('sf-outros-danos')) return;
    var txt = 'Título: RESSARCIMENTO DE DANOS NÃO ELÉTRICOS' +
      '\nNome e sobrenome do cliente: ' + getVal('rod_solic') +
      '\nRelatos da ocorrência: ' + getVal('rod_relato') +
      '\nData e horário do início do ocorrido: ' + getVal('rod_dt_ini') +
      '\nData e horário do fim do ocorrido: ' + getVal('rod_dt_fim') +
      '\nReferência: ' + getVal('rod_ref') +
      '\nTelefone: ' + getVal('rod_tel') +
      '\nE-mail para contato: ' + getVal('rod_email') +
      '\nMeio de comunicação escolhido (carta ou e-mail): ' + getVal('rod_meio') +
      '\nDescrição do Dano Não elétrico: ' + getVal('rod_desc') +
      '\nPrazo para análise 30 (trinta) dias corridos.';
    finalizarGeracao('sf-outros-danos', txt, txt, 'nota');
  }






  function gerarRDEDocumentacao() {
    if (!validarCampos('sf-rde-doc')) return;
    var cred = (getVal('rdedoc_cred') === 'sim') ? 'S (X) N ( )' : 'S ( ) N (X)';
    var orc = (getVal('rdedoc_qtd_orc') === '1') ? '1 (X) 2 ( )' : '1 ( ) 2 (X)';
    var valDesist = getVal('rdedoc_qtd_desist');
    var desist = 'Nenhum (X) ( ) 1 ( ) 2';
    if (valDesist === '1') desist = 'Nenhum ( ) (X) 1 ( ) 2';
    else if (valDesist === '2') desist = 'Nenhum ( ) ( ) 1 (X) 2';

    var txt = 'Título: RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO\n' +
      'Solicitante ' + getVal('rdedoc_solic') + ' compareceu à loja/credenciado para análise a documentação de ressarcimento de danos elétricos.\n' +
      'Cliente apresentou laudo (s) e orçamento (s) de oficina (s) Credenciada(s)? ' + cred + '\n' +
      'Quantidade Orçamento (s) ' + orc + '\n' +
      'Detalhar de quais equipamentos : ' + getVal('rdedoc_equip') + '\n' +
      'Quantidade Laudo (s) Desistência? ' + desist + '\n' +
      'Local de entrega : ' + getVal('rdedoc_local');

    finalizarGeracao('sf-rde-doc', txt, txt, 'agenda');
  }





  function toggleReclamacaoGD() {
    var tipo = document.getElementById('gd_tipo').value;
    var alerta = document.getElementById('gd_alerta_box');

    var isAusencia = (tipo === 'ausencia_fat');
    var isCredito = (tipo === 'credito_gmm');
    var isGerBenef = (tipo === 'geradora_benef');
    var isArt323 = (tipo === 'art_323');

    if (isAusencia) {
      alerta.innerHTML = '⚠️ Orientação: Analise o histórico de consumo e leitura; confira através da transação FPL9 se existe parcelamento considerando o artigo 323.';
    } else if (isCredito) {
      alerta.innerHTML = '⚠️ Orientação: Analise o último demonstrativo no GMM; verifique na fatura se não consta, ao final, o crédito alocado no ciclo; confirme se nas faturas posteriores as informações do crédito deixaram de aparecer.';
    } else if (isGerBenef) {
      alerta.innerHTML = '⚠️ Orientação: Analise a existência da nota 48; confira se há ciclo descasado (quando a beneficiária foi lida antes ou no mesmo dia da geradora); verifique a fatura do período relatado pelo cliente e o histórico de consumo e leitura para confirmar se não houve a compensação.';
    } else if (isArt323) {
      alerta.innerHTML = '⚠️ Orientação: Analise em 2ª via a data do último faturamento; se houve ausência do faturamento anterior; se deveria ser parcelado considerando o artigo 323.';
    }

    document.getElementById('grp_gd_dt_ultima_fat').style.display = isAusencia ? 'flex' : 'none';
    document.getElementById('grp_gd_periodo_sem_fat').style.display = isAusencia ? 'flex' : 'none';
    document.getElementById('gd_dt_ultima_fat').required = isAusencia;
    document.getElementById('gd_periodo_sem_fat').required = isAusencia;

    document.getElementById('grp_gd_dt_ult_sem_cred').style.display = isCredito ? 'flex' : 'none';
    document.getElementById('grp_gd_dt_gmm').style.display = isCredito ? 'flex' : 'none';
    document.getElementById('gd_dt_ult_sem_cred').required = isCredito;
    document.getElementById('gd_dt_gmm').required = isCredito;

    document.getElementById('grp_gd_ger_benef').style.display = isGerBenef ? 'flex' : 'none';
    document.getElementById('grp_gd_periodo_sem_comp').style.display = isGerBenef ? 'flex' : 'none';
    document.getElementById('gd_periodo_sem_comp').required = isGerBenef;

    document.getElementById('grp_gd_art323_simnao').style.display = isArt323 ? 'flex' : 'none';
    document.getElementById('grp_gd_periodo_fat').style.display = isArt323 ? 'flex' : 'none';
    document.getElementById('gd_periodo_fat').required = isArt323;
  }

  function gerarReclamacaoGD() {
    if (!validarCampos('sf-reclamacao-gd')) return;
    var tipo = getVal('gd_tipo');
    var nome = getVal('gd_nome');
    var motivo = getVal('gd_motivo');
    var ref = getVal('gd_ref');
    var email = getVal('gd_email');
    var tel = getVal('gd_tel');
    var outras = getVal('gd_outras') || 'Não informado';
    var ant = getVal('gd_ant') || 'N/A';
    var mod = getVal('gd_modalidade');
    var txt = '';

    if (tipo === 'ausencia_fat') {
      txt = 'Ausência de Faturamento\n' +
        'Solicitante – ' + nome + '\n' +
        'Descrição da reclamação: ' + motivo + '\n' +
        'Data da última fatura: ' + getVal('gd_dt_ultima_fat') + '\n' +
        'Período sem receber a fatura: ' + getVal('gd_periodo_sem_fat') + '\n' +
        'Ponto de Referência: ' + ref + '\n' +
        'E-mail: ' + email + '\n' +
        'Tel. Celular: ' + tel + '\n' +
        'Outras Informações: ' + outras + '\n' +
        rodapComumCorrigido(ant, mod);
    } else if (tipo === 'credito_gmm') {
      txt = 'Crédito não migrado do GMM para o SAP\n' +
        'Solicitante – ' + nome + '\n' +
        'Descrição da reclamação: ' + motivo + '\n' +
        'Data da última fatura sem informação do crédito: ' + getVal('gd_dt_ult_sem_cred') + '\n' +
        'Data do último registro do demonstrativo no GMM: ' + getVal('gd_dt_gmm') + '\n' +
        'Ponto de Referência: ' + ref + '\n' +
        'E-mail: ' + email + '\n' +
        'Tel. Celular: ' + tel + '\n' +
        'Outras Informações: ' + outras + '\n' +
        rodapComumCorrigido(ant, mod);
    } else if (tipo === 'geradora_benef') {
      txt = 'Geradora e Beneficiária sem compensar\n' +
        'Solicitante – ' + nome + '\n' +
        'Descrição da reclamação: ' + motivo + '\n' +
        'Geradora ou beneficiária: ' + getVal('gd_ger_benef') + '\n' +
        'Período sem compensar: ' + getVal('gd_periodo_sem_comp') + '\n' +
        'Ponto de Referência: ' + ref + '\n' +
        'E-mail: ' + email + '\n' +
        'Tel. Celular: ' + tel + '\n' +
        'Outras Informações: ' + outras + '\n' +
        rodapComumCorrigido(ant, mod);
    } else if (tipo === 'art_323') {
      var artSimNao = (getVal('gd_art323_simnao') === 'Sim') ? 'Sim (X) Não ( )' : 'Sim ( ) Não (X)';
      txt = 'Faturamento acumulado sem aplicação do Art 323\n' +
        'Solicitante – ' + nome + '\n' +
        'Descrição da reclamação: ' + motivo + '\n' +
        'As faturas deveriam ter a aplicação do Artigo 323? ' + artSimNao + '\n' +
        'Período do faturamento: ' + getVal('gd_periodo_fat') + '\n' +
        'Ponto de Referência: ' + ref + '\n' +
        'E-mail: ' + email + '\n' +
        'Tel. Celular: ' + tel + '\n' +
        'Outras Informações: ' + outras + '\n' +
        rodapComumCorrigido(ant, mod);
    }

    finalizarGeracao('sf-reclamacao-gd', txt, txt, 'nota');
  }

  function rodapComumCorrigido(ant, mod) {
    return 'Verifique se há nota de reclamação em aberto, caso a reclamação seja reincidente, informe o número da reclamação anterior: ' + ant + '\n' +
      'Modalidade de comunicação: ' + mod + '\n' +
      'Cliente solicita comunicação por ' + mod + '. Foi devidamente orientado sobre o prazo de até 5 (cinco) dias úteis ou, caso seja necessária visita técnica à unidade consumidora, até 10 (dez) dias úteis, contados a partir da data do protocolo.\n' +
      'Realizados todos os esclarecimentos ao cliente, porém o mesmo deseja o registro da reclamação.';
  }

  function limparForm(containerId) {
    desbloquearFormulario(containerId);
    if (containerId === 'sf-isencao-deb') {
      [['ise_servico', 'troca'], ['ise_fat_solic', 'Não se aplica'], ['ise_rec', 'regular'], ['ise_crit', 'Faturado por média'], ['ise_mmgd', 'Não']].forEach(function(p) { document.getElementById(p[0]).value = p[1]; });
      setTimeout(toggleIsencaoDeb, 0);
    }
    if (containerId === 'sf-ligacao-nova') { document.getElementById('ln_modo').value = 'normal'; setTimeout(toggleLigacaoNova, 0); }
    document.querySelectorAll('#' + containerId + ' input[type="text"], #' + containerId + ' textarea').forEach(function(i) { i.value = ''; });
    if (containerId === 'sf-reclamacao-gd') { document.getElementById('gd_tipo').value = 'ausencia_fat'; toggleReclamacaoGD(); }
    if (containerId === 'sf-reclamacoes') {
      document.getElementById('rec_tipo').value = 'leitura_fat';
      var c = document.getElementById('container_faturas_rec');
      c.innerHTML = '<div class="fatura-row"><input type="text" class="rec_fat_venc" placeholder="Vencimento: dd/mm/aaaa" data-input="mascararData(this)" required><input type="text" class="rec_fat_valor" placeholder="Valor R$: 0,00" required><button type="button" class="btn-del" data-click="removerFaturaRow(this)">✕</button></div>';
      toggleReclamacoes();
    }
    if (containerId === 'sf-res') { document.getElementById('res_forma_pag').value = 'conta'; toggleFormaPagRes(); }
    
    var subA = subtipoAtivo[containerId];
    if (subA) setTimeout(function() { aplicarSubtipo(containerId, subA); }, 0);
    document.getElementById('out-nota').value = '';
    document.getElementById('out-agenda').value = '';
    // A área de transferência NÃO é tocada de propósito: se o texto
    // gerado já foi copiado e ainda não foi colado no SAP, ele
    // continua disponível para colar mesmo depois de limpar.
  }

  // Inicializa os módulos na abertura
  toggleReclamacoes();
  toggleReclamacaoGD();

  function normalizarTxt(t){ return (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  // Busca por sugestoes: digitar NAO filtra os botoes da lista. Os servicos
  // encontrados aparecem numa lista de sugestoes logo abaixo da barra de
  // busca (a partir das primeiras letras digitadas) e tocar numa sugestao
  // abre o formulario daquele servico.
  var sugDestaque = -1;
  function fecharSugestoes(){
    var caixa = document.getElementById('busca_sugestoes');
    var inp = document.getElementById('busca_servico');
    if (caixa) { caixa.classList.remove('aberta'); caixa.innerHTML = ''; }
    if (inp) inp.setAttribute('aria-expanded', 'false');
    sugDestaque = -1;
  }
  function filtrarServicos(){
    var inp = document.getElementById('busca_servico');
    var caixa = document.getElementById('busca_sugestoes');
    if (!inp || !caixa) return;
    var btns = document.querySelectorAll('#service_nav .sub-btn');
    for (var k=0;k<btns.length;k++){ btns[k].style.display = ''; }
    document.getElementById('svc_count').textContent = btns.length + (btns.length === 1 ? ' serviço' : ' serviços');
    var termo = normalizarTxt(inp.value.trim());
    if (!termo) { fecharSugestoes(); return; }
    var prefixo = [], contem = [];
    for (var j=0;j<btns.length;j++){
      var mSf = /trocarAba\('([^']+)'/.exec(btns[j].getAttribute('data-click') || '');
      if (!mSf) continue;
      var nome = btns[j].textContent.trim();
      var nn = normalizarTxt(nome);
      if (nn.indexOf(termo) === 0) prefixo.push({ nome: nome, sf: mSf[1] });
      else if (nn.indexOf(termo) !== -1) contem.push({ nome: nome, sf: mSf[1] });
    }
    var achados = prefixo.concat(contem).slice(0, 10);
    caixa.innerHTML = '';
    sugDestaque = -1;
    if (!achados.length){
      var vazio = document.createElement('div');
      vazio.className = 'sug-vazia';
      vazio.textContent = 'Nenhum serviço encontrado. Tente outro termo.';
      caixa.appendChild(vazio);
    } else {
      achados.forEach(function(it){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sug-item';
        b.setAttribute('role', 'option');
        b.setAttribute('data-click', "selecionarSugestaoBusca('" + it.sf + "', this)");
        b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span></span>';
        b.querySelector('span').textContent = it.nome;
        caixa.appendChild(b);
      });
    }
    caixa.classList.add('aberta');
    inp.setAttribute('aria-expanded', 'true');
  }
  function selecionarSugestaoBusca(sfId, el){
    var btns = document.querySelectorAll('#service_nav .sub-btn');
    var alvo = null;
    for (var j=0;j<btns.length;j++){
      if ((btns[j].getAttribute('data-click') || '').indexOf("'" + sfId + "'") !== -1) { alvo = btns[j]; break; }
    }
    var inp = document.getElementById('busca_servico');
    if (inp && alvo) inp.value = alvo.textContent.trim();
    fecharSugestoes();
    trocarAba(sfId, alvo);
  }

