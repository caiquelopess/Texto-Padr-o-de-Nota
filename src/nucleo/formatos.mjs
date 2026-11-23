// Telefone no padrão da NOTA: 71-912341234 (vários separados por " / ")
export function telefonesPadraoNota(valor) {
  return String(valor || '')
    .split(/\s*\/\s*|[;,]+/)
    .map((t) => {
      const d = t.replace(/\D/g, '');
      return d.length >= 10 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
    })
    .filter(Boolean)
    .join(' / ');
}

// Um ou mais telefones separados por / ; ou vírgula; cada um com 10 ou 11 dígitos
export function formatarTelefones(valor) {
  const partes = valor.split(/[/;,]+/);
  const saida = [];
  for (let i = 0; i < partes.length; i++) {
    const d = partes[i].replace(/\D/g, '');
    if (!d) continue;
    if (d.length === 11) saida.push(`(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`);
    else if (d.length === 10) saida.push(`(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`);
    else return null;
  }
  return saida.length ? saida.join(' / ') : null;
}

export function declFormatarDoc(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return null;
}

// NOTA em maiúsculas, sem espaços duplos
export function notaCaps(t) {
  return String(t || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// "TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° X / LEITURA Y"
// ou, sem leitura, "... N° X / NAO INFORMOU LEITURA"
export function notaReativVirtual(medidor, leitura) {
  return `TRATA-SE DE REATIVAÇÃO VIRTUAL MEDIDOR EM CAMPO N° ${medidor} / ${leitura ? `LEITURA ${leitura}` : 'NAO INFORMOU LEITURA'}`;
}

export function valorReais(t) {
  let v = String(t || '').replace(/[^\d,.-]/g, '');
  if (v.indexOf(',') >= 0) v = v.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}
