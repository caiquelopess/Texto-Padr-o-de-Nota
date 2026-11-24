  // === MIGRAÇÃO DE ENDEREÇO E CÓPIA DOS DADOS ===
  // O navegador guarda histórico e pendências por endereço do site. Para levar
  // esses dados do endereço antigo (GitHub Pages) para o novo (Cloudflare, com
  // login): "Exportar meus dados" gera um arquivo .json e "Importar dados" junta
  // o arquivo ao que já existe (sem duplicar).
  // No endereço antigo aparece um aviso de mudança; a partir de DATA_REDIRECIONAR
  // ('aaaa-mm-dd'), ele leva sozinho para o novo endereço.
  var DATA_REDIRECIONAR = '2026-11-26';   // endereço antigo disponível até 25/11/2026

  function ehEnderecoAntigo() { return /\.github\.io$/i.test(location.hostname); }

  function exportarDados() {
    var dados = { app: 'textos-padroes', formato: 1, exportadoEm: new Date().toISOString(), origem: location.host,
      historico: histLer(), pendencias: pendLer(), tema: (function() { try { return localStorage.getItem('tp_tema'); } catch (e) { return null; } })() };
    var blob = new Blob([JSON.stringify(dados)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'textos-padroes-meus-dados-' + pIso(new Date()) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 2000);
    mostrarAviso('Arquivo salvo com ' + dados.historico.length + ' textos e ' + dados.pendencias.length + ' pendências. Abra o novo endereço e use "Importar dados".', 'longo');
  }

  // Junta duas listas pelo id, sem duplicar (o que já existe aqui é mantido)
  function juntarPorId(atual, novos) {
    var ids = {}, add = 0;
    atual.forEach(function(x) { if (x && x.id) ids[x.id] = true; });
    novos.forEach(function(x) { if (x && x.id && !ids[x.id]) { atual.push(x); ids[x.id] = true; add++; } });
    return add;
  }

  function importarDados() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.addEventListener('change', function() {
      var arq = inp.files && inp.files[0]; if (!arq) return;
      if (arq.size > 20 * 1024 * 1024) { mostrarAviso('Arquivo grande demais para ser uma cópia dos dados.'); return; }
      var leitor = new FileReader();
      leitor.onload = function() { importarTexto(String(leitor.result || '')); };
      leitor.readAsText(arq);
    });
    inp.click();
  }

  function importarTexto(texto) {
    var dados;
    try { dados = JSON.parse(texto); } catch (e) { dados = null; }
    if (!dados || dados.app !== 'textos-padroes' || !Array.isArray(dados.historico) || !Array.isArray(dados.pendencias)) {
      mostrarAviso('Este arquivo não é uma cópia de dados do Textos Padrões.'); return null;
    }
    var hist = histLer(), pend = pendLer();
    var nh = juntarPorId(hist, dados.historico), np = juntarPorId(pend, dados.pendencias);
    hist.sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
    histGravar(hist); pendGravar(pend);
    if (dados.tema) { try { if (!localStorage.getItem('tp_tema')) { localStorage.setItem('tp_tema', dados.tema); aplicarTema(dados.tema); } } catch (e) {} }
    atualizarContadorHistorico(); atualizarBadgePendencias();
    var painel = document.getElementById('painel_pend'); if (painel && painel.style.display !== 'none') renderPendencias();
    mostrarAviso('Importado: ' + nh + ' textos e ' + np + ' pendências (o que já existia foi mantido).', 'ok');
    return { historico: nh, pendencias: np };
  }

  function mostrarAvisoMudanca(forcar) {
    if (!forcar && !ehEnderecoAntigo()) return;
    if (DATA_REDIRECIONAR && pIso(new Date()) >= DATA_REDIRECIONAR) { location.replace(SITE_PRODUCAO); return; }
    // Balão flutuante no canto: avisa sem atrapalhar o uso do sistema.
    var balao = document.createElement('div');
    balao.className = 'aviso-mudanca';
    balao.setAttribute('role', 'status');
    balao.innerHTML = '<button type="button" class="aviso-mudanca-fechar" aria-label="Minimizar aviso">✕</button>' +
      '<b>O Textos Padrões mudou de endereço e agora tem login.</b> ' +
      '1) Clique em <b>Exportar meus dados</b> para salvar seu histórico e suas pendências. ' +
      '2) Abra o novo endereço, entre com seu usuário e use <b>Histórico → Importar dados</b>.' +
      (DATA_REDIRECIONAR ? ' Este endereço funciona normalmente até ' + pBR(pSomarDiasIso(DATA_REDIRECIONAR, -1)) + '.' : '') +
      '<span class="aviso-mudanca-acoes"><button type="button" class="btn" data-click="exportarDados()">Exportar meus dados</button>' +
      '<a class="btn btn-clear" href="' + SITE_PRODUCAO + '">Ir para o novo endereço</a></span>';
    var mini = document.createElement('button');
    mini.type = 'button';
    mini.className = 'aviso-mudanca-mini';
    mini.textContent = 'Novo endereço do sistema';
    mini.style.display = 'none';
    balao.querySelector('.aviso-mudanca-fechar').addEventListener('click', function() { balao.style.display = 'none'; mini.style.display = ''; });
    mini.addEventListener('click', function() { balao.style.display = ''; mini.style.display = 'none'; });
    document.body.appendChild(balao);
    document.body.appendChild(mini);
  }
  function pSomarDiasIso(iso, dias) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    return pIso(d);
  }
  mostrarAvisoMudanca(false);
