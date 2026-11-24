  // === SUGESTÕES (#10) — modal aberto pelo menu do usuário ===
  function abrirSugestao() {
    document.getElementById('sug_status').textContent = '';
    document.getElementById('sug_status').className = 'sug-status';
    document.getElementById('sug_overlay').style.display = 'flex';
    document.getElementById('sug_texto').focus();
  }
  function fecharSugestao() { document.getElementById('sug_overlay').style.display = 'none'; }
  function enviarSugestao() {
    var status = document.getElementById('sug_status');
    var btn = document.getElementById('btn_sug_enviar');
    var texto = getVal('sug_texto');
    if (texto.length < 5) { status.className = 'sug-status erro'; status.textContent = 'Escreva um pouco mais (mínimo 5 caracteres).'; return; }
    btn.disabled = true;
    btn.classList.add('carregando');
    fetch('/api/sugestoes', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tipo: getVal('sug_tipo'), texto: texto })
    })
      .then(function(r) { return r.json().catch(function() { return {}; }).then(function(d) { return { ok: r.ok, d: d }; }); })
      .then(function(res) {
        if (!res.ok) throw new Error(res.d.erro || 'Não foi possível enviar agora.');
        document.getElementById('sug_texto').value = '';
        atualizarContadorSugestao();
        status.className = 'sug-status ok';
        status.textContent = 'Enviada. Obrigado!';
        setTimeout(fecharSugestao, 1200);
      })
      .catch(function(e) { status.className = 'sug-status erro'; status.textContent = e.message || 'Não foi possível enviar agora.'; })
      .then(function() { btn.disabled = false; btn.classList.remove('carregando'); });
  }
  function atualizarContadorSugestao() {
    document.getElementById('sug_contador').textContent = getVal('sug_texto').length + ' / 2000';
  }
  document.getElementById('sug_texto').addEventListener('input', atualizarContadorSugestao);
  document.getElementById('sug_overlay').addEventListener('click', function(ev) { if (ev.target === this) fecharSugestao(); });
  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape' && document.getElementById('sug_overlay').style.display !== 'none') fecharSugestao();
  });
