const pFeriadosCache = {};

// ---- datas e dias úteis (datas como 'aaaa-mm-dd') ----
export function pIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function pHoje() {
  return pIso(new Date());
}

export function pDeBR(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || '').trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? pIso(d) : null;
}

export function pBR(iso) {
  const x = String(iso || '').split('-');
  return x.length === 3 ? `${x[2]}/${x[1]}/${x[0]}` : '';
}

export function pData(iso) {
  const x = iso.split('-');
  return new Date(+x[0], +x[1] - 1, +x[2]);
}

export function pDiasCorridos(a, b) {
  return Math.round((pData(b) - pData(a)) / 86400000);
}

export function pFeriados(ano) {
  if (pFeriadosCache[ano]) return pFeriadosCache[ano];
  const f = {};
  ['01-01', '04-21', '05-01', '07-02', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].forEach((md) => {
    f[`${ano}-${md}`] = true;
  });
  const a = ano % 19,
    b = Math.floor(ano / 100),
    c = ano % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    g = Math.floor((8 * b + 13) / 25),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 19 * l) / 433),
    mes = Math.floor((h + l - 7 * m + 90) / 25),
    dia = (h + l - 7 * m + 33 * mes + 19) % 32;
  const sextaSanta = new Date(ano, mes - 1, dia);
  sextaSanta.setDate(sextaSanta.getDate() - 2);
  f[pIso(sextaSanta)] = true;
  pFeriadosCache[ano] = f;
  return f;
}

export function pUtil(iso) {
  const d = pData(iso),
    w = d.getDay();
  return w !== 0 && w !== 6 && !pFeriados(d.getFullYear())[iso];
}

export function pSomarUteis(iso, n) {
  let d = pData(iso),
    c = 0;
  while (c < n) {
    d.setDate(d.getDate() + 1);
    if (pUtil(pIso(d))) c++;
  }
  return pIso(d);
}

export function pUteisAte(prazoIso) {
  const hoje = pHoje();
  if (hoje === prazoIso) return 0;
  // datas 'aaaa-mm-dd' comparam como texto: ordenar dá [mais antiga, mais nova]
  const [ini, fim] = [hoje, prazoIso].sort();
  const d = pData(ini);
  let c = 0;
  while (pIso(d) < fim) {
    d.setDate(d.getDate() + 1);
    if (pUtil(pIso(d))) c++;
  }
  return hoje < prazoIso ? c : -Math.max(c, 1);
}
