export function compararVersoes(a, b) {
  const pa = String(a).split(/[^0-9]+/),
    pb = String(b).split(/[^0-9]+/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = parseInt(pa[i] || '0', 10) || 0,
      y = parseInt(pb[i] || '0', 10) || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}
