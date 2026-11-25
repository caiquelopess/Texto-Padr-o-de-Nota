// Backups do painel administrativo (Cloudflare D1, binding BANCO).
// Guarda: modelos (rascunho + todas as versões), configuração do atendimento
// (+ versões) e o perfil de cada usuário. NUNCA guarda senhas nem dados de clientes.
// Cada backup tem checksum SHA-256 e passa por validação antes de poder ser restaurado.
// Restaurar troca tudo numa única transação (db.batch) e sempre cria antes um backup
// "antes de restaurar", para dar para desfazer.
import { checksum, garantirEsquema } from './banco.js';

export const FORMATO = 1;
const MANTER = 60; // backups guardados (os mais antigos saem)
const UM_DIA = 24 * 3600 * 1000;

async function garantirTabelaBackups(db) {
  await garantirEsquema(db);
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT, criado_em INTEGER NOT NULL, criado_por TEXT, motivo TEXT NOT NULL,
        tamanho INTEGER NOT NULL, checksum TEXT NOT NULL, resumo TEXT NOT NULL, conteudo TEXT NOT NULL)`,
    )
    .run();
}

async function linhas(db, sql) {
  return (await db.prepare(sql).all()).results;
}

// Monta o retrato atual (sem senhas).
async function retrato(db, kv) {
  const perfis = {};
  let cursor;
  do {
    const r = await kv.list({ prefix: 'u:', cursor });
    for (const k of r.keys) {
      const u = await kv.get(k.name, 'json');
      if (u) perfis[u.usuario] = { perfil: u.perfil || (u.admin ? 'administrador' : 'atendente'), ativo: !!u.ativo };
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return {
    formato: FORMATO,
    modelos: await linhas(db, 'SELECT * FROM modelos ORDER BY id'),
    modelo_versoes: await linhas(db, 'SELECT * FROM modelo_versoes ORDER BY modelo_id, versao'),
    atendimento: await linhas(db, 'SELECT * FROM atendimento'),
    atendimento_versoes: await linhas(db, 'SELECT * FROM atendimento_versoes ORDER BY versao'),
    perfis,
  };
}

const resumoDe = (d) => ({
  modelos: d.modelos.length,
  versoesModelos: d.modelo_versoes.length,
  versoesAtendimento: d.atendimento_versoes.length,
  usuarios: Object.keys(d.perfis || {}).length,
});

// Confere estrutura e integridade de um conteúdo de backup. Retorna a lista de problemas.
export async function validarConteudo(texto, somaEsperada) {
  const problemas = [];
  if (somaEsperada && (await checksum(texto)) !== somaEsperada) return ['O arquivo do backup foi alterado ou corrompido (checksum diferente).'];
  let d;
  try {
    d = JSON.parse(texto);
  } catch {
    return ['O backup não é um JSON válido.'];
  }
  if (d.formato !== FORMATO) problemas.push('Formato de backup desconhecido.');
  for (const t of ['modelos', 'modelo_versoes', 'atendimento', 'atendimento_versoes']) if (!Array.isArray(d[t])) problemas.push(`Falta a tabela ${t}.`);
  if (problemas.length) return problemas;
  for (const v of [...d.modelo_versoes, ...d.atendimento_versoes]) {
    if ((await checksum(v.conteudo)) !== v.checksum) problemas.push(`Versão corrompida dentro do backup: ${v.modelo_id || 'atendimento'} v${v.versao}.`);
  }
  for (const m of d.modelos) {
    if (m.versao_publicada > 0 && !d.modelo_versoes.some((v) => v.modelo_id === m.id && v.versao === m.versao_publicada))
      problemas.push(`O modelo ${m.id} aponta para a versão ${m.versao_publicada}, que não está no backup.`);
    try {
      JSON.parse(m.rascunho);
    } catch {
      problemas.push(`Rascunho ilegível no modelo ${m.id}.`);
    }
  }
  return problemas;
}

export async function criarBackup(db, kv, motivo, por) {
  await garantirTabelaBackups(db);
  const d = await retrato(db, kv);
  const texto = JSON.stringify(d);
  const soma = await checksum(texto);
  const problemas = await validarConteudo(texto, soma);
  if (problemas.length) throw new Error(`Backup recusado: ${problemas[0]}`);
  const r = await db
    .prepare('INSERT INTO backups (criado_em, criado_por, motivo, tamanho, checksum, resumo, conteudo) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(Date.now(), por, motivo, texto.length, soma, JSON.stringify(resumoDe(d)), texto)
    .run();
  await db.prepare('DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT ?)').bind(MANTER).run();
  return r.meta.last_row_id;
}

// Backup automático: no máximo um por dia, feito no primeiro acesso do dia.
export async function backupDiarioSeNecessario(db, kv) {
  await garantirTabelaBackups(db);
  const ultimo = await db.prepare("SELECT MAX(criado_em) AS t FROM backups WHERE motivo = 'automatico'").first('t');
  if (ultimo && Date.now() - ultimo < UM_DIA) return null;
  return criarBackup(db, kv, 'automatico', 'sistema');
}

export async function listarBackups(db) {
  await garantirTabelaBackups(db);
  const { results } = await db.prepare('SELECT id, criado_em, criado_por, motivo, tamanho, checksum, resumo FROM backups ORDER BY id DESC').all();
  return results.map((b) => ({ ...b, resumo: JSON.parse(b.resumo) }));
}

export async function lerBackup(db, id) {
  await garantirTabelaBackups(db);
  return db.prepare('SELECT * FROM backups WHERE id = ?').bind(id).first();
}

// Restaura modelos e atendimento numa transação. Os perfis dos usuários são
// aplicados depois (opcional), só para quem ainda existe — sem mexer em senhas.
export async function restaurarBackup(db, kv, id, por, { perfis = false } = {}) {
  const b = await lerBackup(db, id);
  if (!b) return { ok: false, problemas: ['Backup não encontrado.'] };
  const problemas = await validarConteudo(b.conteudo, b.checksum);
  if (problemas.length) return { ok: false, problemas };
  const antes = await criarBackup(db, kv, 'antes-de-restaurar', por);
  const d = JSON.parse(b.conteudo);
  const ins = (tabela, linha) => {
    const cols = Object.keys(linha);
    return db.prepare(`INSERT INTO ${tabela} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((c) => linha[c]));
  };
  await db.batch([
    db.prepare('DELETE FROM modelo_versoes'),
    db.prepare('DELETE FROM modelos'),
    db.prepare('DELETE FROM atendimento_versoes'),
    db.prepare('DELETE FROM atendimento'),
    ...d.modelos.map((l) => ins('modelos', l)),
    ...d.modelo_versoes.map((l) => ins('modelo_versoes', l)),
    ...d.atendimento.map((l) => ins('atendimento', l)),
    ...d.atendimento_versoes.map((l) => ins('atendimento_versoes', l)),
    db.prepare('INSERT OR IGNORE INTO atendimento (id) VALUES (1)'),
    db.prepare('UPDATE publicacao SET geral = geral + 1, alterado_em = ? WHERE id = 1').bind(Date.now()),
  ]);
  let perfisAplicados = 0;
  if (perfis) {
    for (const [usuario, p] of Object.entries(d.perfis || {})) {
      const reg = await kv.get(`u:${usuario}`, 'json');
      const perfilAtual = reg?.perfil || (reg?.admin ? 'administrador' : 'atendente');
      if (!reg || (perfilAtual === p.perfil && !!reg.ativo === p.ativo)) continue;
      Object.assign(reg, {
        perfil: p.perfil,
        admin: p.perfil === 'administrador',
        ativo: p.ativo,
        versaoSenha: reg.versaoSenha + (reg.ativo && !p.ativo ? 1 : 0),
      });
      await kv.put(`u:${usuario}`, JSON.stringify(reg));
      perfisAplicados++;
    }
  }
  return { ok: true, problemas: [], antes, perfisAplicados };
}
