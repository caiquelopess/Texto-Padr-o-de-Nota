  // === SELECT PERSONALIZADO: destaque da lista aberta na paleta do sistema ===
  // A lista aberta do <select> nativo pinta a opção destacada com o
  // azul-claro padrão do navegador/SO, fora da paleta. Aqui cada <select>
  // ganha uma lista própria (mesmas opções, mesmo valor, mesmo evento
  // 'change' borbulhante que os data-change já escutam), pintada com
  // --sel-highlight. O <select> original fica oculto no DOM guardando o
  // valor; bloqueios (disabled) e trocas programáticas de valor
  // (limparForm e os toggles) continuam valendo e são espelhados.
  (function aprimorarSelects() {
    try {
      var selects = document.querySelectorAll('select:not([data-nativo])');
      var listaAberta = null; // { wrap, list, trigger, sel, destaque }

      function fecharLista() {
        if (!listaAberta) return;
        listaAberta.list.classList.remove('aberta');
        listaAberta.trigger.classList.remove('aberta');
        listaAberta.trigger.setAttribute('aria-expanded', 'false');
        listaAberta = null;
      }

      function marcarDestaque(ctx, idx) {
        ctx.destaque = idx;
        var itens = ctx.list.children;
        for (var i = 0; i < itens.length; i++) {
          itens[i].classList.toggle('destaque', i === idx);
        }
        if (idx >= 0 && itens[idx]) itens[idx].scrollIntoView({ block: 'nearest' });
      }

      function sincronizar(sel) {
        var ctx = sel._selCtx;
        if (!ctx) return;
        var opt = sel.options[sel.selectedIndex];
        ctx.trigger.textContent = opt ? opt.textContent : '';
        ctx.trigger.disabled = sel.disabled;
        var itens = ctx.list.children;
        for (var i = 0; i < itens.length; i++) {
          var on = i === sel.selectedIndex;
          itens[i].classList.toggle('selecionada', on);
          itens[i].setAttribute('aria-selected', on ? 'true' : 'false');
        }
        if (listaAberta === ctx) marcarDestaque(ctx, sel.selectedIndex);
      }

      function escolher(ctx, idx) {
        var sel = ctx.sel;
        var mudou = idx !== sel.selectedIndex;
        fecharLista();
        ctx.trigger.focus();
        if (mudou && idx >= 0) {
          sel.selectedIndex = idx; // setter espelhado já sincroniza o rótulo
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      function abrirLista(ctx) {
        if (ctx.sel.disabled || ctx.trigger.disabled) return;
        if (listaAberta === ctx) { fecharLista(); return; }
        fecharLista();
        ctx.list.classList.add('aberta');
        ctx.trigger.classList.add('aberta');
        ctx.trigger.setAttribute('aria-expanded', 'true');
        listaAberta = ctx;
        marcarDestaque(ctx, ctx.sel.selectedIndex);
      }

      selects.forEach(function(sel) {
        if (sel._selCtx) return;
        var wrap = document.createElement('div');
        wrap.className = 'sel-wrap';
        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'sel-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        var list = document.createElement('div');
        list.className = 'sel-list';
        list.setAttribute('role', 'listbox');
        for (var i = 0; i < sel.options.length; i++) {
          var item = document.createElement('div');
          item.className = 'sel-opt';
          item.setAttribute('role', 'option');
          item.textContent = sel.options[i].textContent;
          item.setAttribute('data-idx', String(i));
          list.appendChild(item);
        }
        sel.parentNode.insertBefore(wrap, sel);
        wrap.appendChild(sel);
        wrap.appendChild(trigger);
        wrap.appendChild(list);
        sel.classList.add('sel-native-oculto');
        sel.setAttribute('tabindex', '-1');
        sel.setAttribute('aria-hidden', 'true');

        var ctx = { sel: sel, wrap: wrap, trigger: trigger, list: list, destaque: -1 };
        sel._selCtx = ctx;

        // Espelha trocas programáticas de valor (limparForm/toggles usam
        // sel.value = '...' sem disparar evento).
        ['value', 'selectedIndex'].forEach(function(prop) {
          var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
          if (!desc || !desc.set) return;
          Object.defineProperty(sel, prop, {
            configurable: true,
            enumerable: true,
            get: desc.get,
            set: function(v) { desc.set.call(this, v); sincronizar(this); }
          });
        });
        if (window.MutationObserver) {
          new MutationObserver(function() { sincronizar(sel); }).observe(sel, { attributes: true, attributeFilter: ['disabled'] });
        }
        sel.addEventListener('change', function() { sincronizar(sel); });

        trigger.addEventListener('click', function() { abrirLista(ctx); });
        trigger.addEventListener('keydown', function(ev) {
          if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            if (listaAberta !== ctx) { abrirLista(ctx); return; }
            var total = ctx.list.children.length;
            var prox = ev.key === 'ArrowDown'
              ? Math.min(ctx.destaque + 1, total - 1)
              : Math.max(ctx.destaque - 1, 0);
            marcarDestaque(ctx, prox);
          } else if (ev.key === 'Enter' || ev.key === ' ') {
            if (listaAberta === ctx) { ev.preventDefault(); escolher(ctx, ctx.destaque); }
          } else if (ev.key === 'Escape') {
            if (listaAberta === ctx) { ev.preventDefault(); fecharLista(); }
          } else if (ev.key === 'Tab') {
            fecharLista();
          }
        });
        list.addEventListener('mousedown', function(ev) { ev.preventDefault(); });
        list.addEventListener('click', function(ev) {
          var item = ev.target;
          while (item && item !== list && !item.classList.contains('sel-opt')) item = item.parentNode;
          if (!item || item === list) return;
          escolher(ctx, parseInt(item.getAttribute('data-idx'), 10));
        });
        list.addEventListener('mousemove', function(ev) {
          var item = ev.target;
          while (item && item !== list && !item.classList.contains('sel-opt')) item = item.parentNode;
          if (!item || item === list) return;
          var idx = parseInt(item.getAttribute('data-idx'), 10);
          if (idx !== ctx.destaque) marcarDestaque(ctx, idx);
        });

        sincronizar(sel);
      });

      document.addEventListener('click', function(ev) {
        if (listaAberta && !listaAberta.wrap.contains(ev.target)) fecharLista();
      });
      window.addEventListener('resize', fecharLista);
    } catch (e) {
      // Se algo falhar, os <select> nativos seguem funcionando como antes.
    }
  })();
