// Mesma lógica da planilha "Calculadora refat":
//   consumo        = leitura do cliente - leitura anterior
//   diasCliente    = data da leitura do cliente - data da fatura anterior
//   média diária   = consumo / diasCliente
//   diasEsperada   = data esperada (fatura reclamada) - data da fatura anterior
//   leitura esperada = leitura anterior + diasEsperada * média diária
//   (consumo negativo → "Valor inferior")
export function calcLerNumero(txt) {
  let t = String(txt || '')
    .trim()
    .replace(/\s/g, '');
  if (!t) return null;
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  return parseFloat(t);
}

export function calcLerData(txt) {
  const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(String(txt || '').trim());
  if (!m) return null;
  const d = parseInt(m[1], 10),
    mo = parseInt(m[2], 10),
    a = parseInt(m[3], 10);
  const dt = new Date(Date.UTC(a, mo - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

export function calcDias(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
