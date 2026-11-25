// Comparação linha a linha entre dois textos (maior subsequência comum).
// Retorna [{ tipo: 'igual' | 'removida' | 'incluida', texto }].
export function diferencaLinhas(antes, depois) {
  const a = String(antes ?? '').split('\n');
  const b = String(depois ?? '').split('\n');
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const saida = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      saida.push({ tipo: 'igual', texto: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) saida.push({ tipo: 'removida', texto: a[i++] });
    else saida.push({ tipo: 'incluida', texto: b[j++] });
  }
  while (i < n) saida.push({ tipo: 'removida', texto: a[i++] });
  while (j < m) saida.push({ tipo: 'incluida', texto: b[j++] });
  return saida;
}

// Resumo legível dos campos de um modelo, para comparar versões.
export function resumoCampos(modelo) {
  return (modelo?.campos || [])
    .map((c) => {
      const extras = [
        c.obrigatorio ? 'obrigatório' : '',
        c.opcoes?.length ? `opções: ${c.opcoes.join(' | ')}` : '',
        c.mostrarSe ? `mostrar se ${c.mostrarSe.campo} = ${[].concat(c.mostrarSe.igual).join(' ou ')}` : '',
      ]
        .filter(Boolean)
        .join('; ');
      return `${c.rotulo} (${c.id}, ${c.tipo})${extras ? ` — ${extras}` : ''}`;
    })
    .join('\n');
}
