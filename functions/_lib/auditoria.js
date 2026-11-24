// Registro de auditoria: quem fez o quê na administração, e quando.
// KV: a:<inverso do tempo>-<aleatório> — a listagem do KV já vem do mais recente para o mais antigo.
// Guarda por 1 ano. Nunca registra senhas nem dados de clientes.
const UM_ANO = 365 * 24 * 3600;
const MAX_TEMPO = 9999999999999;

export async function registrar(kv, quem, acao, alvo) {
  const agora = Date.now();
  const id = `${String(MAX_TEMPO - agora).padStart(13, '0')}-${crypto.randomUUID().slice(0, 6)}`;
  await kv.put(`a:${id}`, JSON.stringify({ quando: agora, quem, acao, alvo }), { expirationTtl: UM_ANO });
}

export async function listarAuditoria(kv, limite = 300) {
  const r = await kv.list({ prefix: 'a:', limit: limite });
  const lista = await Promise.all(r.keys.map((k) => kv.get(k.name, 'json')));
  return lista.filter(Boolean);
}
