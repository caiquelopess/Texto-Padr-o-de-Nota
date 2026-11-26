  // === PENDÊNCIAS ===
  // Dois tipos, salvos no localStorage deste computador:
  //  - 'servico': atendimento para terminar depois. Guarda os campos do
  //    formulário, um comentário e a data do lembrete. Concluir = reabrir o
  //    serviço preenchido e gerar o texto (vai para o Histórico).
  //  - 'prazo': Análise de Isenção de Débitos, criada ao gerar o texto, com
  //    prazo de 5 dias úteis e resposta Deferido/Indeferido.
  // Os textos de resposta (deferido/indeferido) ficam no núcleo: respostas.mjs.
  var TIPOS_PENDENCIA = {
    isencao: { nome: 'Análise de Isenção de Débitos', prazo: 5 }
  };
  var PEND_CHAVE = AMBIENTE_TESTE ? 'tp_teste_pendencias_v1' : 'tp_pendencias_v1';
  var PEND_DIAS_CONCLUIDAS = 90;

  function pendLer() { try { var a = JSON.parse(localStorage.getItem(PEND_CHAVE) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function pendGravar(l) { try { localStorage.setItem(PEND_CHAVE, JSON.stringify(l)); } catch (e) { mostrarAviso('Não foi possível salvar as pendências neste navegador.'); } }
  function pKind(pd) { return pd.kind === 'servico' || pd.kind === 'refat' ? pd.kind : 'prazo'; }

  // classe: agendada | ok | proxima | hoje | vencida | concluida
  function pSituacao(pd) {
    if (pKind(pd) === 'refat') return pd.status === 'concluida'
      ? { classe: 'concluida', texto: 'Concluída em ' + pBR(pd.respostaData), dias: null }
      : { classe: 'semdata', texto: 'Sem data — aguardando refaturamento', dias: null };
    if (pd.status === 'concluida') {
      if (pKind(pd) === 'servico') return { classe: 'concluida', texto: 'Concluída em ' + pBR(pd.respostaData), dias: null };
      return { classe: 'concluida', texto: 'Respondida em ' + pBR(pd.respostaData) + (pd.respostaData <= pd.prazo ? ' (no prazo)' : ' (fora do prazo)'), dias: null };
    }
    if (pKind(pd) === 'servico') {
      var dc = pDiasCorridos(pHoje(), pd.lembrete);
      if (dc > 0) return { classe: 'agendada', texto: 'Lembrete em ' + pBR(pd.lembrete) + (dc === 1 ? ' (amanhã)' : ' (em ' + dc + ' dias)'), dias: dc };
      if (dc === 0) return { classe: 'hoje', texto: 'Lembrete HOJE', dias: 0 };
      return { classe: 'vencida', texto: 'ATRASADA há ' + (-dc) + (dc === -1 ? ' dia' : ' dias'), dias: dc };
    }
    var n = pUteisAte(pd.prazo);
    if (n < 0) return { classe: 'vencida', texto: 'Vencida há ' + (-n) + (n === -1 ? ' dia útil' : ' dias úteis'), dias: n };
    if (n === 0) return { classe: 'hoje', texto: 'Vence HOJE', dias: 0 };
    if (n <= 2) return { classe: 'proxima', texto: 'Vence em ' + n + (n === 1 ? ' dia útil' : ' dias úteis'), dias: n };
    return { classe: 'ok', texto: 'Vence em ' + n + ' dias úteis', dias: n };
  }
  function pNovoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function pEsc(t) { return declEsc(t); }
  function pAchar(id) { var l = pendLer(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return { lista: l, pd: l[i] }; return null; }

  // ---- Análise de Isenção: criada ao gerar o texto ----
  function criarPendenciaAuto(tipo, dados) {
    var lista = pendLer(), hoje = pHoje(), t = TIPOS_PENDENCIA[tipo];
    var chave = String(dados.doc || dados.cc || dados.solicitante || '').replace(/\W/g, '').toLowerCase();
    var existente = null;
    lista.forEach(function(pd) { if (pKind(pd) === 'prazo' && pd.status === 'aberta' && pd.tipo === tipo && pd.abertura === hoje && pd.chave === chave && pd.origem === dados.origem) existente = pd; });
    if (existente) {
      existente.solicitante = dados.solicitante; existente.cc = dados.cc; existente.doc = dados.doc; existente.texto = dados.texto;
      pendGravar(lista); atualizarBadgePendencias();
      return existente;
    }
    var pd = { id: pNovoId(), kind: 'prazo', tipo: tipo, origem: dados.origem || t.nome, chave: chave, solicitante: dados.solicitante || '', cc: dados.cc || '', doc: dados.doc || '',
      nota: '', comentario: '', texto: dados.texto || '', abertura: hoje, prazoUteis: t.prazo, prazo: pSomarUteis(hoje, t.prazo), status: 'aberta', ultimoLembrete: Date.now() };
    lista.unshift(pd); pendGravar(lista); atualizarBadgePendencias();
    setTimeout(function() { mostrarAviso('Pendência criada: responder até ' + pBR(pd.prazo) + ' (' + t.prazo + ' dias úteis). Veja na aba Pendências.', 'ok'); }, 900);
    return pd;
  }

  // ---- pendência de serviço: abrir, preencher, salvar, retomar, concluir ----
  var pendModo = null;   // { sf, servicoId, nome, id (quando já salva) }
  function pSf(servicoId) { return String(servicoId).split('|')[0]; }
  function pBotaoServico(servicoId) { return document.querySelector('#service_nav .sub-btn[data-click*="\'' + servicoId + '\'"]'); }
  function montarListaServicosPend() {
    var sel = document.getElementById('pend_servico'); if (!sel) return;
    sel.innerHTML = '';
    var oR = document.createElement('option'); oR.value = PEND_REFAT; oR.textContent = 'Refaturamento (só contrato e motivo)'; sel.appendChild(oR);
    document.querySelectorAll('#service_nav .sub-btn').forEach(function(b) {
      var m = /trocarAba\('([^']+)'/.exec(b.getAttribute('data-click') || ''); if (!m) return;
      var o = document.createElement('option'); o.value = m[1]; o.textContent = b.textContent.trim(); sel.appendChild(o);
    });
    recriarListaSelect(sel);
  }
  // As listas suspensas personalizadas são montadas ao carregar a página; quando
  // as opções de um <select> mudam depois disso, a lista visível precisa ser refeita.
  function recriarListaSelect(sel) {
    var ctx = sel && sel._selCtx; if (!ctx) return;
    ctx.list.innerHTML = '';
    for (var i = 0; i < sel.options.length; i++) {
      var it = document.createElement('div');
      it.className = 'sel-opt'; it.setAttribute('role', 'option'); it.setAttribute('data-idx', String(i));
      it.textContent = sel.options[i].textContent;
      ctx.list.appendChild(it);
    }
    sel.selectedIndex = sel.options.length ? Math.max(sel.selectedIndex, 0) : -1;   // o setter espelhado atualiza o rótulo
  }
  function mostrarCaixaPendencia(sf, comentario, dataBr, existente) {
    var box = document.getElementById('pend_box'), cont = document.getElementById(sf);
    if (!box || !cont) return;
    var acoes = null;
    for (var i = 0; i < cont.children.length; i++) if (cont.children[i].classList.contains('actions')) acoes = cont.children[i];
    cont.insertBefore(box, acoes);
    document.getElementById('pendc_coment').value = comentario || '';
    document.getElementById('pendc_data').value = dataBr || '';
    document.getElementById('pendc_concluir').style.display = existente ? '' : 'none';
    box.querySelectorAll('input, textarea, button').forEach(function(el) { el.disabled = false; });
    box.style.display = 'block';
  }
  function sairModoPendencia(silencioso) {
    var box = document.getElementById('pend_box');
    if (box) { box.style.display = 'none'; document.body.appendChild(box); }
    pendModo = null;
    if (!silencioso) mostrarAbaPrincipal('pend');
  }
  function iniciarPendenciaServico() {
    var servicoId = getVal('pend_servico'); if (!servicoId) return;
    var btn = pBotaoServico(servicoId), sf = pSf(servicoId);
    mostrarAbaPrincipal('agenda');
    trocarAba(servicoId, btn);
    limparForm(sf);
    var amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
    pendModo = { sf: sf, servicoId: servicoId, nome: btn ? btn.textContent.trim() : servicoId, id: null };
    setTimeout(function() {
      mostrarCaixaPendencia(sf, '', pBR(pIso(amanha)), false);
      var primeiro = document.querySelector('#' + sf + ' .form-grid input:not([type=hidden]), #' + sf + ' .form-grid textarea');
      document.getElementById(sf).scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (primeiro) primeiro.focus();
    }, 60);
  }
  function pCamposDoFormulario(sf) {
    var campos = {};
    document.querySelectorAll('#' + sf + ' input[id], #' + sf + ' select[id], #' + sf + ' textarea[id]').forEach(function(el) {
      if (/^pendc_/.test(el.id)) return;
      campos[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? !!el.checked : el.value;
    });
    return campos;
  }
  function pSolicitanteDe(campos) {
    for (var k in campos) if (/_solic$/.test(k) && campos[k]) return campos[k];
    for (var k2 in campos) if (/(cliente|nome)$/.test(k2) && campos[k2]) return campos[k2];
    return '';
  }
  function salvarPendenciaServico() {
    if (!pendModo) return;
    var coment = document.getElementById('pendc_coment').value.trim();
    if (!coment) { mostrarAviso('ATENÇÃO: escreva o comentário da pendência (ex.: Complementar nota 300123456).'); document.getElementById('pendc_coment').focus(); return; }
    var data = pDeBR(document.getElementById('pendc_data').value);
    if (!data) { mostrarAviso('ATENÇÃO: a data para lembrete deve ser uma data real (dd/mm/aaaa).'); document.getElementById('pendc_data').focus(); return; }
    var campos = pCamposDoFormulario(pendModo.sf), lista = pendLer(), pd = null;
    if (pendModo.id) lista.forEach(function(x) { if (x.id === pendModo.id) pd = x; });
    if (!pd) {
      if (data < pHoje()) { mostrarAviso('ATENÇÃO: a data para lembrete não pode ser no passado.'); document.getElementById('pendc_data').focus(); return; }
      pd = { id: pNovoId(), kind: 'servico', abertura: pHoje(), status: 'aberta' };
      lista.unshift(pd);
    }
    if (pd.lembrete !== data) pd.ultimoLembrete = 0;
    pd.servicoId = pendModo.servicoId; pd.origem = pendModo.nome; pd.campos = campos; pd.comentario = coment; pd.lembrete = data;
    pd.solicitante = pSolicitanteDe(campos);
    pendGravar(lista);
    var sf = pendModo.sf;
    sairModoPendencia(true);
    limparForm(sf);
    atualizarBadgePendencias();
    mostrarAbaPrincipal('pend');
    mostrarAviso('Pendência salva: lembrete em ' + pBR(data) + '.', 'ok');
  }
  // Reabre o serviço com o que foi preenchido, para completar e concluir.
  function retomarPendencia(id) {
    var r = pAchar(id); if (!r || pKind(r.pd) !== 'servico') return;
    var pd = r.pd, sf = pSf(pd.servicoId), btn = pBotaoServico(pd.servicoId);
    if (!document.getElementById(sf)) { mostrarAviso('Este serviço não existe mais na página.'); return; }
    mostrarAbaPrincipal('agenda');
    trocarAba(pd.servicoId, btn);
    limparForm(sf);
    setTimeout(function() {
      var campos = pd.campos || {}, selects = [], outros = [];
      Object.keys(campos).forEach(function(k) { var el = document.getElementById(k); if (!el) return; (el.tagName === 'SELECT' ? selects : outros).push(el); });
      selects.forEach(function(el) { el.value = campos[el.id]; el.dispatchEvent(new Event('change', { bubbles: true })); });
      outros.forEach(function(el) { if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!campos[el.id]; else el.value = campos[el.id]; });
      pendModo = { sf: sf, servicoId: pd.servicoId, nome: pd.origem, id: pd.id };
      mostrarCaixaPendencia(sf, pd.comentario, pBR(pd.lembrete), true);
      document.getElementById(sf).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
  function concluirPendenciaServico() {
    if (!pendModo || !pendModo.id) return;
    var cont = document.getElementById(pendModo.sf), gerar = null;
    for (var i = 0; i < cont.children.length; i++) {
      var c = cont.children[i];
      if (c.classList.contains('actions')) { gerar = c.querySelector('.btn:not(.btn-clear):not(.btn-edit)'); break; }
    }
    if (gerar) gerar.click();   // mesma validação e mesmo texto do botão normal; ao gerar, a pendência é concluída
  }
  // Chamado por finalizarGeracao: gerar o texto de um serviço em pendência a conclui.
  function pendenciaAoGerar(containerId, notaTxt, agendaTxt) {
    if (!pendModo || pendModo.sf !== containerId) return;
    var id = pendModo.id;
    sairModoPendencia(true);
    if (!id) return;   // pendência ainda não salva: o atendimento foi concluído na hora
    var r = pAchar(id); if (!r) return;
    r.pd.status = 'concluida'; r.pd.respostaData = pHoje(); r.pd.respostaTs = Date.now(); r.pd.texto = notaTxt || agendaTxt;
    pendGravar(r.lista); atualizarBadgePendencias();
    setTimeout(function() { mostrarAviso('Pendência concluída. O texto foi gerado e está no Histórico.', 'ok'); }, 900);
  }

  // ---- Refaturamento: pendência simples (contrato + motivo, sem data) ----
  var PEND_REFAT = '__refat';
  function pendServicoMudou() {
    var refat = getVal('pend_servico') === PEND_REFAT;
    ['grp_pref_contrato', 'grp_pref_motivo'].forEach(function(id) { document.getElementById(id).style.display = refat ? 'flex' : 'none'; });
    document.getElementById('btn_pend_abrir').style.display = refat ? 'none' : '';
    document.getElementById('btn_pend_refat').style.display = refat ? '' : 'none';
  }
  function adicionarPendenciaRefat() {
    var contrato = getVal('pref_contrato'), motivo = getVal('pref_motivo');
    if (!contrato) { mostrarAviso('ATENÇÃO: informe o contrato a ser refaturado.'); document.getElementById('pref_contrato').focus(); return; }
    if (!motivo) { mostrarAviso('ATENÇÃO: informe o motivo do refaturamento.'); document.getElementById('pref_motivo').focus(); return; }
    var lista = pendLer(), chave = contrato.replace(/\D/g, '') || contrato.toLowerCase();
    var dup = lista.some(function(pd) { return pKind(pd) === 'refat' && pd.status === 'aberta' && ((pd.contrato || '').replace(/\D/g, '') || (pd.contrato || '').toLowerCase()) === chave; });
    if (dup) { mostrarAviso('Já existe uma pendência de refaturamento em aberto para o contrato ' + contrato + '.'); return; }
    lista.unshift({ id: pNovoId(), kind: 'refat', origem: 'Refaturamento', contrato: contrato, comentario: motivo, solicitante: '', abertura: pHoje(), status: 'aberta' });
    pendGravar(lista);
    document.getElementById('pref_contrato').value = ''; document.getElementById('pref_motivo').value = '';
    renderPendencias(); atualizarBadgePendencias();
    mostrarAviso('Pendência de refaturamento adicionada para o contrato ' + contrato + '.', 'ok');
  }
  function concluirPendenciaRefat(id) {
    var r = pAchar(id); if (!r) return;
    if (!confirm('Confirmar que o contrato ' + r.pd.contrato + ' foi refaturado?')) return;
    r.pd.status = 'concluida'; r.pd.respostaData = pHoje(); r.pd.respostaTs = Date.now();
    r.pd.texto = 'Refaturamento concluído\nContrato: ' + r.pd.contrato + '\nMotivo: ' + r.pd.comentario + '\nConcluído em: ' + pBR(r.pd.respostaData);
    pendGravar(r.lista);
    nomeServicoAtivo['sf-pend-refat'] = 'Refaturamento (pendência)';
    salvarNoHistorico('sf-pend-refat', r.pd.texto, '');
    renderPendencias(); atualizarBadgePendencias();
    mostrarAviso('Refaturamento concluído e registrado no Histórico.', 'ok');
  }

  // ---- lista ----
  function renderPendencias() {
    var lista = pendLer(), limite = Date.now() - PEND_DIAS_CONCLUIDAS * 86400000;
    var chaveOrd = function(pd) { return pKind(pd) === 'refat' ? 'z' + pd.abertura : pKind(pd) === 'servico' ? pd.lembrete : pd.prazo; };
    var abertas = lista.filter(function(pd) { return pd.status === 'aberta'; }).sort(function(a, b) { return chaveOrd(a) < chaveOrd(b) ? -1 : chaveOrd(a) > chaveOrd(b) ? 1 : 0; });
    var concl = lista.filter(function(pd) { return pd.status === 'concluida' && (pd.respostaTs || 0) >= limite; }).sort(function(a, b) { return (b.respostaTs || 0) - (a.respostaTs || 0); });
    var cont = { vencida: 0, hoje: 0, proxima: 0, ok: 0, agendada: 0, semdata: 0 };
    abertas.forEach(function(pd) { cont[pSituacao(pd).classe]++; });
    document.getElementById('pend_resumo').innerHTML =
      '<span class="pend-chip vencida">Atrasadas/vencidas: <b>' + cont.vencida + '</b></span><span class="pend-chip hoje">Para hoje: <b>' + cont.hoje + '</b></span>' +
      '<span class="pend-chip">Próximas: <b>' + (cont.proxima + cont.ok + cont.agendada) + '</b></span><span class="pend-chip">Refaturamento (sem data): <b>' + cont.semdata + '</b></span>';
    document.getElementById('pend_lista').innerHTML = abertas.length ? abertas.map(pCard).join('') : '<div class="pend-vazio">Nenhuma pendência em aberto.</div>';
    document.getElementById('pend_concl_tit').textContent = 'Concluídas nos últimos ' + PEND_DIAS_CONCLUIDAS + ' dias (' + concl.length + ')';
    document.getElementById('pend_concl').innerHTML = concl.length ? concl.map(pCard).join('') : '<div class="pend-vazio">Nenhuma pendência concluída.</div>';
    var bn = document.getElementById('btn_pend_notif');
    if (bn) {
      var sup = 'Notification' in window, perm = sup ? Notification.permission : 'denied';
      bn.style.display = sup && perm !== 'granted' ? '' : 'none';
      bn.textContent = perm === 'denied' ? 'Avisos do navegador bloqueados' : 'Ativar avisos do navegador';
    }
  }
  function pCard(pd) {
    var sit = pSituacao(pd), aberta = pd.status === 'aberta', servico = pKind(pd) === 'servico', refat = pKind(pd) === 'refat';
    if (refat) {
      return '<div class="pend-item ' + sit.classe + '" id="pitem_' + pd.id + '">' +
        '<div class="pend-topo"><span class="pend-tipo">Refaturamento</span><span class="pend-status">' + pEsc(sit.texto) + '</span></div>' +
        '<p class="pend-coment">' + pEsc(pd.comentario) + '</p>' +
        '<p class="pend-info"><b>Contrato ' + pEsc(pd.contrato) + '</b> · criada em ' + pBR(pd.abertura) + '</p>' +
        '<div class="pend-botoes">' +
        (aberta ? '<button type="button" class="pend-resp" data-click="concluirPendenciaRefat(\'' + pd.id + '\')">Concluir refaturamento</button>' +
                  '<button type="button" data-click="editarComentario(\'' + pd.id + '\')">Alterar motivo</button>'
                : '<button type="button" data-click="reabrirPendencia(\'' + pd.id + '\')">Reabrir</button>') +
        '<button type="button" class="pend-del" data-click="excluirPendencia(\'' + pd.id + '\')">Excluir</button></div></div>';
    }
    var info = servico
      ? '<b>' + pEsc(pd.solicitante || '—') + '</b> · criada em ' + pBR(pd.abertura) + ' · <b>lembrete em ' + pBR(pd.lembrete) + '</b>'
      : '<b>' + pEsc(pd.solicitante || '—') + '</b>' + (pd.cc ? ' · CC ' + pEsc(pd.cc) : '') + (pd.nota ? ' · Nota ' + pEsc(pd.nota) : '') +
        '<br>Aberta em ' + pBR(pd.abertura) + ' · prazo ' + pd.prazoUteis + ' dias úteis · <b>responder até ' + pBR(pd.prazo) + '</b>' +
        (!aberta ? '<br>Resultado: <b>' + pEsc(pd.resultado) + '</b> — ' + pEsc(pd.motivo) + (pd.respostaObs ? ' · ' + pEsc(pd.respostaObs) : '') : '');
    var botoes = '';
    if (aberta && servico) botoes += '<button type="button" class="pend-resp" data-click="retomarPendencia(\'' + pd.id + '\')">Retomar e concluir</button>';
    if (aberta && !servico) botoes += '<button type="button" class="pend-resp" data-click="abrirResposta(\'' + pd.id + '\')">Responder</button>' +
      '<button type="button" data-click="informarNota(\'' + pd.id + '\')">' + (pd.nota ? 'Alterar nº da nota' : 'Informar nº da nota') + '</button>' +
      '<button type="button" data-click="editarComentario(\'' + pd.id + '\')">' + (pd.comentario ? 'Alterar comentário' : 'Comentário') + '</button>';
    if (!aberta && !servico) botoes += '<button type="button" data-click="reabrirPendencia(\'' + pd.id + '\')">Reabrir</button>' +
      (pd.respostaTexto ? '<button type="button" data-click="copiarRespostaPend(\'' + pd.id + '\')">Copiar resposta</button>' : '');
    if (pd.texto) botoes += '<button type="button" data-click="alternarTextoPend(\'' + pd.id + '\')">Ver texto</button><button type="button" data-click="copiarTextoPend(\'' + pd.id + '\')">Copiar texto</button>';
    botoes += '<button type="button" class="pend-del" data-click="excluirPendencia(\'' + pd.id + '\')">Excluir</button>';
    return '<div class="pend-item ' + sit.classe + '" id="pitem_' + pd.id + '">' +
      '<div class="pend-topo"><span class="pend-tipo">' + pEsc(pd.origem || 'Pendência') + '</span><span class="pend-status">' + pEsc(sit.texto) + '</span></div>' +
      (pd.comentario ? '<p class="pend-coment">' + pEsc(pd.comentario) + '</p>' : '') +
      '<p class="pend-info">' + info + '</p>' +
      '<div class="pend-botoes">' + botoes + '</div>' +
      (pd.texto ? '<pre class="pend-texto" id="ptexto_' + pd.id + '" style="display: none;">' + pEsc(pd.texto) + '</pre>' : '') +
      '<div id="presp_' + pd.id + '"></div></div>';
  }
  function alternarTextoPend(id) { var e = document.getElementById('ptexto_' + id); if (e) e.style.display = e.style.display === 'none' ? 'block' : 'none'; }
  function copiarTextoPend(id) { var r = pAchar(id); if (r) histCopiarTexto(r.pd.texto); }
  function informarNota(id) {
    var r = pAchar(id); if (!r) return;
    var v = prompt('Nº da nota / protocolo:', r.pd.nota || ''); if (v === null) return;
    r.pd.nota = v.trim(); pendGravar(r.lista); renderPendencias();
  }
  function editarComentario(id) {
    var r = pAchar(id); if (!r) return;
    var v = prompt('Comentário da pendência:', r.pd.comentario || ''); if (v === null) return;
    r.pd.comentario = v.trim(); pendGravar(r.lista); renderPendencias();
  }
  function excluirPendencia(id) {
    if (!confirm('Excluir esta pendência? Ela não será mais lembrada.')) return;
    pendGravar(pendLer().filter(function(pd) { return pd.id !== id; })); renderPendencias(); atualizarBadgePendencias();
  }
  function reabrirPendencia(id) {
    var r = pAchar(id); if (!r) return;
    r.pd.status = 'aberta'; delete r.pd.resultado; delete r.pd.motivo; delete r.pd.respostaObs; delete r.pd.respostaTexto; delete r.pd.respostaData; delete r.pd.respostaTs;
    r.pd.ultimoLembrete = 0; pendGravar(r.lista); renderPendencias(); atualizarBadgePendencias();
  }
  // ---- resposta da Análise de Isenção (deferido / indeferido) ----
  // Formulário compartilhado (pendência e serviço "Resposta da Análise de Isenção"):
  // os textos vêm do núcleo (respostas.mjs). No indeferimento dá para marcar mais de um
  // motivo: a resposta sai combinada num texto só.
  var RESP_DIST_CHAVE = 'tp_resp_distribuidora';
  function respOpcoes(lista, atual) {
    return lista.map(function(v) { return '<option value="' + pEsc(v) + '"' + (v === atual ? ' selected' : '') + '>' + pEsc(v) + '</option>'; }).join('');
  }
  // soIndeferido: no serviço avulso só existe o indeferimento (deferido = serviço executado com o texto padrão)
  function respCamposHtml(px, ini, soIndeferido) {
    ini = ini || {};
    var dist = ini.distribuidora; try { dist = dist || localStorage.getItem(RESP_DIST_CHAVE); } catch (e) {}
    var ind = ' ' + px + 'ind';
    var motivos = RESP_INDEFERIMENTOS.map(function(m) {
      return '<label class="resp-motivo"><input type="checkbox" class="' + px + 'mot" value="' + m.id + '" data-change="respAtualizar(\'' + px + '\')"> ' + pEsc(m.nome) + '</label>';
    }).join('');
    return (soIndeferido
        ? '<input type="hidden" id="' + px + 'res" value="Indeferido">'
        : '<div class="full"><label>Resultado *</label><select id="' + px + 'res" data-change="respAtualizar(\'' + px + '\')"><option value="Deferido">Deferido</option><option value="Indeferido">Indeferido</option></select></div>' +
          '<div class="full alert-box resp-aviso" id="' + px + 'def_info">✅ <b>Deferido:</b> a solicitação é atendida, sem texto de resposta. Execute o serviço (' +
          'Troca de Titularidade ou Reativação) com o texto padrão dele e registre aqui a data da resposta.</div>') +
      '<div class="' + ind + '"><label>Serviço *</label><select id="' + px + 'serv">' + respOpcoes(RESP_SERVICOS, ini.servico) + '</select></div>' +
      '<div class="' + ind + '"><label>Distribuidora *</label><select id="' + px + 'dist">' + respOpcoes(RESP_DISTRIBUIDORAS, dist || 'Coelba') + '</select></div>' +
      '<div class="full' + ind + '"><label>Protocolo de atendimento *</label><input type="text" id="' + px + 'prot" value="' + pEsc(ini.protocolo || '') + '" placeholder="Nº do protocolo" required></div>' +
      '<div class="full' + ind + '"><label>Motivos do indeferimento * <span class="resp-dica">(marque um ou mais: os textos são combinados)</span></label><div class="resp-motivos" data-um-obrigatorio>' + motivos + '</div></div>' +
      '<div class="full" id="' + px + 'doc_box"><label>Documento não identificado ou ilegível *</label><input type="text" id="' + px + 'doc" placeholder="Ex: RG, contrato de locação"></div>' +
      // orientações de cada motivo: aparecem quando ele é marcado
      RESP_INDEFERIMENTOS.filter(function(m) { return m.aviso; }).map(function(m) {
        return '<div class="full alert-box resp-aviso" id="' + px + 'aviso_' + m.id + '"><b>⚠️ ' + pEsc(m.nome) + ':</b> ' + pEsc(m.aviso) + '</div>';
      }).join('') +
      '<div class="full" id="' + px + 'conf_box"><label class="resp-motivo resp-confirma"><input type="checkbox" id="' + px + 'conf"> ' +
        pEsc((RESP_INDEFERIMENTOS.filter(function(m) { return m.confirmacao; })[0] || {}).confirmacao || '') + '</label></div>';
  }
  function respLer(px) {
    var g = function(s) { var e = document.getElementById(px + s); return e ? e.value : ''; };
    var motivos = [].slice.call(document.querySelectorAll('.' + px + 'mot:checked')).map(function(c) { return c.value; });
    var conf = document.getElementById(px + 'conf');
    return { resultado: g('res'), servico: g('serv'), distribuidora: g('dist'), protocolo: g('prot').trim(), motivos: motivos, documento: g('doc').trim(), confirmado: !!(conf && conf.checked) };
  }
  function respAtualizar(px) {
    var d = respLer(px), def = d.resultado === 'Deferido';
    var mostra = function(s, v) { var e = document.getElementById(px + s); if (e) e.style.display = v ? '' : 'none'; };
    mostra('def_info', def);
    document.querySelectorAll('.' + px + 'ind').forEach(function(e) { e.style.display = def ? 'none' : ''; });
    var marcados = def ? [] : RESP_INDEFERIMENTOS.filter(function(m) { return d.motivos.indexOf(m.id) >= 0; });
    var tem = function(campo) { return marcados.some(function(m) { return m[campo]; }); };
    mostra('doc_box', tem('precisaDocumento')); mostra('conf_box', tem('confirmacao'));
    RESP_INDEFERIMENTOS.forEach(function(m) { if (m.aviso) mostra('aviso_' + m.id, marcados.indexOf(m) >= 0); });
  }
  function respNomes(d) {
    if (d.resultado === 'Deferido') return 'Solicitação atendida (serviço executado com o texto padrão)';
    return RESP_INDEFERIMENTOS.filter(function(m) { return d.motivos.indexOf(m.id) >= 0; }).map(function(m) { return m.nome; }).join(' + ');
  }
  function respGuardarDistribuidora(d) { try { localStorage.setItem(RESP_DIST_CHAVE, d.distribuidora); } catch (e) {} }

  function abrirResposta(id) {
    var r = pAchar(id); if (!r) return;
    var box = document.getElementById('presp_' + id);
    if (box.innerHTML) { box.innerHTML = ''; return; }
    var px = 'pres_' + id + '_';
    box.innerHTML = '<div class="pend-responder">' +
      respCamposHtml(px, { servico: /^Reativa/.test(r.pd.origem || '') ? 'Reativação' : 'Troca de Titularidade', protocolo: r.pd.nota }) +
      '<div><label>Data da resposta *</label><input type="text" id="pres_data_' + id + '" inputmode="numeric" value="' + pBR(pHoje()) + '" data-input="mascararData(this)"></div>' +
      '<div><label>Observação</label><input type="text" id="pres_obs_' + id + '" placeholder="Opcional"></div>' +
      '<div class="full pend-botoes"><button type="button" class="pend-resp" data-click="concluirPendencia(\'' + id + '\')">Confirmar resposta</button><button type="button" data-click="abrirResposta(\'' + id + '\')">Cancelar</button></div></div>';
    respAtualizar(px);
  }
  function concluirPendencia(id) {
    var r = pAchar(id); if (!r) return;
    var data = pDeBR(document.getElementById('pres_data_' + id).value);
    if (!data) { mostrarAviso('ATENÇÃO: a data da resposta deve ser uma data real (dd/mm/aaaa).'); return; }
    if (data < r.pd.abertura) { mostrarAviso('ATENÇÃO: a resposta não pode ser anterior à abertura (' + pBR(r.pd.abertura) + ').'); return; }
    var d = respLer('pres_' + id + '_'), erros = respValidar(d);
    if (erros.length) { mostrarAviso('ATENÇÃO: ' + erros[0]); return; }
    var texto = respGerar(d); // deferido: '' (o serviço segue com o texto padrão)
    r.pd.status = 'concluida'; r.pd.resultado = d.resultado; r.pd.motivo = respNomes(d); r.pd.respostaObs = document.getElementById('pres_obs_' + id).value.trim();
    r.pd.respostaTexto = texto; r.pd.respostaData = data; r.pd.respostaTs = Date.now();
    var prazo = data <= r.pd.prazo ? ' (no prazo)' : ' (fora do prazo)';
    pendGravar(r.lista); renderPendencias(); atualizarBadgePendencias();
    if (!texto) { mostrarAviso('Pendência respondida: Deferido' + prazo + '. Execute o serviço com o texto padrão.', 'ok'); return; }
    respGuardarDistribuidora(d);
    histCopiarTexto(texto);
    setTimeout(function() { mostrarAviso('Pendência respondida: Indeferido' + prazo + '. Resposta copiada para colar na Agenda.', 'ok'); }, 50);
  }
  // Serviço "Resposta da Análise de Isenção" (aba Agenda e Nota)
  function montarRespostaIsencao() {
    var box = document.getElementById('rsp_campos'); if (!box) return;
    box.innerHTML = respCamposHtml('rsp_', null, true);
    respAtualizar('rsp_');
  }
  function gerarRespostaIsencao() {
    var d = respLer('rsp_'), erros = respValidar(d);
    if (erros.length) { mostrarAviso('ATENÇÃO: ' + erros[0]); return; }
    respGuardarDistribuidora(d);
    var texto = respGerar(d);
    finalizarGeracao('sf-resposta-isencao', '', texto, 'agenda');
  }
  function copiarRespostaPend(id) { var r = pAchar(id); if (r && r.pd.respostaTexto) histCopiarTexto(r.pd.respostaTexto); }

  // ---- contador e lembretes ----
  function atualizarBadgePendencias() {
    var abertas = pendLer().filter(function(pd) { return pd.status === 'aberta'; });
    var urgente = abertas.some(function(pd) { var c = pSituacao(pd).classe; return c === 'vencida' || c === 'hoje'; });
    ['pend_badge', 'pend_badge_topo'].forEach(function(id) {
      var b = document.getElementById(id); if (!b) return;
      b.textContent = abertas.length ? String(abertas.length) : '';
      b.classList.toggle('tem', abertas.length > 0);
      b.classList.toggle('alerta', urgente);
    });
  }
  // Intervalo entre lembretes (ms). null = uma vez por dia; -1 = ainda não lembra.
  function pIntervaloLembrete(pd) {
    if (pKind(pd) === 'refat') return -1;              // refaturamento: sem data, sem lembrete
    var sit = pSituacao(pd);
    if (pKind(pd) === 'servico') {
      if (sit.classe === 'agendada') return -1;          // antes da data: sem alerta
      return sit.classe === 'vencida' ? 15 * 60000 : 30 * 60000;
    }
    var dias = sit.dias;
    if (dias < 0) return 15 * 60000;
    if (dias === 0) return 30 * 60000;
    if (dias === 1) return 2 * 3600000;
    if (dias === 2) return 4 * 3600000;
    return null;
  }
  function pDevido(pd, agora) {
    var iv = pIntervaloLembrete(pd), ult = pd.ultimoLembrete || 0;
    if (iv === -1) return false;
    if (iv === null) return pIso(new Date(ult)) !== pHoje();
    return agora - ult >= iv;
  }
  function verificarLembretes(soAtualizar) {
    atualizarBadgePendencias();
    var painel = document.getElementById('painel_pend');
    if (painel && painel.style.display !== 'none') renderPendencias();
    if (soAtualizar) return;
    var lista = pendLer(), agora = Date.now();
    var devidas = lista.filter(function(pd) { return pd.status === 'aberta' && pDevido(pd, agora); });
    if (!devidas.length) return;
    devidas.sort(function(a, b) { return pSituacao(a).classe === 'vencida' ? -1 : pSituacao(b).classe === 'vencida' ? 1 : 0; });
    devidas.forEach(function(pd) { pd.ultimoLembrete = agora; });
    pendGravar(lista);
    mostrarLembrete(devidas);
  }
  function mostrarLembrete(devidas) {
    var grave = devidas.some(function(pd) { return pSituacao(pd).classe === 'vencida'; });
    var box = document.getElementById('pend_lembrete');
    document.getElementById('pend_lembrete_tit').textContent = (grave ? '🚨 ' : '⏰ ') + (grave ? 'Pendência atrasada! ' : '') + (devidas.length === 1 ? '1 pendência para resolver' : devidas.length + ' pendências para resolver');
    document.getElementById('pend_lembrete_lista').innerHTML = devidas.map(function(pd) {
      return '<li><b>' + pEsc(pSituacao(pd).texto) + '</b> — ' + pEsc(pd.origem) + (pd.comentario ? ': ' + pEsc(pd.comentario) : '') + (pd.solicitante ? ' (' + pEsc(pd.solicitante) + ')' : '') + '</li>';
    }).join('');
    box.classList.toggle('urgente', grave);
    box.style.display = 'block';
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(grave ? 'Pendência ATRASADA — Textos Padrões' : 'Pendências — Textos Padrões', { body: devidas.map(function(pd) { return pSituacao(pd).texto + ': ' + (pd.comentario || pd.origem); }).join('\n'), tag: 'tp-pendencias', renotify: true, requireInteraction: grave }); } catch (e) {}
    }
  }
  function fecharLembrete() { document.getElementById('pend_lembrete').style.display = 'none'; }
  function verPendencias() { fecharLembrete(); mostrarAbaPrincipal('pend'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function ativarAvisosNavegador() {
    if (!('Notification' in window)) { mostrarAviso('Este navegador não permite avisos.'); return; }
    if (Notification.permission === 'denied') { mostrarAviso('Os avisos foram bloqueados neste navegador. Libere nas configurações do site (cadeado na barra de endereço).', 'longo'); return; }
    Notification.requestPermission().then(function(p) { mostrarAviso(p === 'granted' ? 'Avisos do navegador ativados.' : 'Avisos do navegador não foram ativados.', p === 'granted' ? 'ok' : ''); renderPendencias(); });
  }
  (function iniciarPendencias() {
    var limite = Date.now() - PEND_DIAS_CONCLUIDAS * 86400000, l = pendLer();
    var l2 = l.filter(function(pd) { return pd.status === 'aberta' || (pd.respostaTs || 0) >= limite; });
    if (l2.length !== l.length) pendGravar(l2);
    montarRespostaIsencao();
    montarListaServicosPend();
    pendServicoMudou();
    atualizarBadgePendencias();
    setTimeout(function() { verificarLembretes(); }, 3000);
    setInterval(function() { verificarLembretes(); }, 60000);
    document.addEventListener('visibilitychange', function() { if (!document.hidden) verificarLembretes(); });
  })();

