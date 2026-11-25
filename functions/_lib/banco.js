// Modelos de texto no Cloudflare D1 (binding BANCO).
// - Rascunho e versão publicada ficam separados: editar o rascunho não muda o que os atendentes usam.
// - Cada publicação cria uma versão nova (as anteriores ficam guardadas, com checksum SHA-256).
// - Publicar é atômico (db.batch é uma transação) e protegido contra edição simultânea pela "revisão".
import { mdTestarModelo } from '../../src/nucleo/modelos.mjs';

const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS modelos (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'rascunho', rascunho TEXT NOT NULL,
    versao_publicada INTEGER NOT NULL DEFAULT 0, revisao INTEGER NOT NULL DEFAULT 1,
    aguardando INTEGER NOT NULL DEFAULT 0,
    criado_em INTEGER, criado_por TEXT, alterado_em INTEGER, alterado_por TEXT)`,
  `CREATE TABLE IF NOT EXISTS modelo_versoes (
    modelo_id TEXT NOT NULL, versao INTEGER NOT NULL, conteudo TEXT NOT NULL, checksum TEXT NOT NULL,
    publicado_em INTEGER, publicado_por TEXT, PRIMARY KEY (modelo_id, versao))`,
  'CREATE TABLE IF NOT EXISTS publicacao (id INTEGER PRIMARY KEY CHECK (id = 1), geral INTEGER NOT NULL, alterado_em INTEGER)',
  'INSERT OR IGNORE INTO publicacao (id, geral, alterado_em) VALUES (1, 0, 0)',
  `CREATE TABLE IF NOT EXISTS atendimento (
    id INTEGER PRIMARY KEY CHECK (id = 1), rascunho TEXT, versao_publicada INTEGER NOT NULL DEFAULT 0,
    revisao INTEGER NOT NULL DEFAULT 1, aguardando INTEGER NOT NULL DEFAULT 0, alterado_em INTEGER, alterado_por TEXT)`,
  'INSERT OR IGNORE INTO atendimento (id) VALUES (1)',
  `CREATE TABLE IF NOT EXISTS atendimento_versoes (
    versao INTEGER PRIMARY KEY, conteudo TEXT NOT NULL, checksum TEXT NOT NULL, publicado_em INTEGER, publicado_por TEXT)`,
];

const prontos = new WeakSet();
export async function garantirEsquema(db) {
  if (prontos.has(db)) return;
  await db.batch(ESQUEMA.map((sql) => db.prepare(sql)));
  prontos.add(db);
}

export async function checksum(texto) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const linha = (r) => r && { ...r, rascunho: JSON.parse(r.rascunho) };

export async function listarModelos(db) {
  const { results } = await db.prepare('SELECT * FROM modelos ORDER BY categoria, nome').all();
  return results.map(linha);
}

export async function lerModelo(db, id) {
  return linha(await db.prepare('SELECT * FROM modelos WHERE id = ?').bind(id).first());
}

export async function criarModelo(db, modelo, por) {
  const agora = Date.now();
  const r = await db
    .prepare('INSERT OR IGNORE INTO modelos (id, nome, categoria, rascunho, criado_em, criado_por, alterado_em, alterado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(modelo.id, modelo.nome, modelo.categoria, JSON.stringify(modelo), agora, por, agora, por)
    .run();
  return r.meta.changes === 1;
}

// Salva o rascunho só se ninguém salvou antes (mesma revisão). Retorna false em caso de conflito.
export async function salvarRascunho(db, id, revisao, modelo, por, aguardando = false) {
  const r = await db
    .prepare(
      'UPDATE modelos SET nome = ?, categoria = ?, rascunho = ?, revisao = revisao + 1, aguardando = ?, alterado_em = ?, alterado_por = ? WHERE id = ? AND revisao = ?',
    )
    .bind(modelo.nome, modelo.categoria, JSON.stringify(modelo), aguardando ? 1 : 0, Date.now(), por, id, revisao)
    .run();
  return r.meta.changes === 1;
}

// Publica o conteúdo informado como nova versão, numa transação.
// Retorna { ok, erros, versao } — erros vêm do teste automático ou de conflito.
export async function publicar(db, id, revisao, conteudo, por) {
  const teste = mdTestarModelo(conteudo);
  if (!teste.ok) return { ok: false, erros: teste.erros };
  const atual = await lerModelo(db, id);
  if (!atual || atual.revisao !== revisao)
    return { ok: false, erros: ['Outro administrador alterou este modelo. Recarregue a página e confira antes de publicar.'] };
  const versao = atual.versao_publicada + 1;
  const texto = JSON.stringify(conteudo);
  const soma = await checksum(texto);
  const agora = Date.now();
  const [ins] = await db.batch([
    db
      .prepare(
        'INSERT INTO modelo_versoes (modelo_id, versao, conteudo, checksum, publicado_em, publicado_por) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM modelos WHERE id = ? AND revisao = ?)',
      )
      .bind(id, versao, texto, soma, agora, por, id, revisao),
    db
      .prepare(
        "UPDATE modelos SET status = 'publicado', versao_publicada = ?, nome = ?, categoria = ?, rascunho = ?, aguardando = 0, revisao = revisao + 1, alterado_em = ?, alterado_por = ? WHERE id = ? AND revisao = ?",
      )
      .bind(versao, conteudo.nome, conteudo.categoria, texto, agora, por, id, revisao),
    db
      .prepare(
        'UPDATE publicacao SET geral = geral + 1, alterado_em = ? WHERE id = 1 AND EXISTS (SELECT 1 FROM modelo_versoes WHERE modelo_id = ? AND versao = ? AND publicado_em = ?)',
      )
      .bind(agora, id, versao, agora),
  ]);
  if (ins.meta.changes !== 1) return { ok: false, erros: ['Outro administrador alterou este modelo. Recarregue a página e confira antes de publicar.'] };
  return { ok: true, erros: [], versao };
}

// Arquivar tira o modelo do atendimento (sem apagar nada); desarquivar devolve.
export async function mudarArquivamento(db, id, revisao, arquivar, por) {
  const atual = await lerModelo(db, id);
  if (!atual || atual.revisao !== revisao) return false;
  const status = arquivar ? 'arquivado' : atual.versao_publicada > 0 ? 'publicado' : 'rascunho';
  const [r] = await db.batch([
    db
      .prepare('UPDATE modelos SET status = ?, revisao = revisao + 1, alterado_em = ?, alterado_por = ? WHERE id = ? AND revisao = ?')
      .bind(status, Date.now(), por, id, revisao),
    db.prepare('UPDATE publicacao SET geral = geral + 1, alterado_em = ? WHERE id = 1').bind(Date.now()),
  ]);
  return r.meta.changes === 1;
}

export async function listarVersoes(db, id) {
  const { results } = await db
    .prepare('SELECT versao, checksum, publicado_em, publicado_por FROM modelo_versoes WHERE modelo_id = ? ORDER BY versao DESC')
    .bind(id)
    .all();
  return results;
}

// Lê uma versão conferindo a integridade (checksum). Retorna null se não existir ou estiver corrompida.
export async function lerVersao(db, id, versao) {
  const r = await db.prepare('SELECT * FROM modelo_versoes WHERE modelo_id = ? AND versao = ?').bind(id, versao).first();
  if (!r || (await checksum(r.conteudo)) !== r.checksum) return null;
  return { ...r, conteudo: JSON.parse(r.conteudo) };
}

// Modelos em uso pelos atendentes: a versão publicada de cada modelo não arquivado.
// Recuperação automática: se a versão publicada estiver corrompida (checksum), usa a
// última versão anterior íntegra — o atendimento nunca recebe conteúdo adulterado.
export async function modelosPublicados(db) {
  const geral = await db.prepare('SELECT geral FROM publicacao WHERE id = 1').first('geral');
  const { results } = await db
    .prepare(
      "SELECT m.id, m.versao_publicada, v.versao, v.conteudo, v.checksum FROM modelos m JOIN modelo_versoes v ON v.modelo_id = m.id AND v.versao <= m.versao_publicada WHERE m.status = 'publicado' ORDER BY m.categoria, m.nome, v.versao DESC",
    )
    .all();
  const modelos = [];
  const resolvidos = new Set();
  for (const r of results) {
    if (resolvidos.has(r.id)) continue;
    if ((await checksum(r.conteudo)) !== r.checksum) continue; // corrompida: tenta a anterior
    modelos.push(JSON.parse(r.conteudo));
    resolvidos.add(r.id);
  }
  return { geral: geral || 0, modelos };
}

// ---- Configuração do atendimento (categorias, serviços e scripts): um documento com rascunho e versões ----
export async function lerAtendimento(db) {
  const r = await db.prepare('SELECT * FROM atendimento WHERE id = 1').first();
  return { ...r, rascunho: r.rascunho ? JSON.parse(r.rascunho) : null };
}

export async function salvarAtendimento(db, revisao, doc, por, aguardando = false) {
  const r = await db
    .prepare('UPDATE atendimento SET rascunho = ?, revisao = revisao + 1, aguardando = ?, alterado_em = ?, alterado_por = ? WHERE id = 1 AND revisao = ?')
    .bind(JSON.stringify(doc), aguardando ? 1 : 0, Date.now(), por, revisao)
    .run();
  return r.meta.changes === 1;
}

// Publica o documento como nova versão (transação; recusa se alguém salvou antes).
export async function publicarAtendimento(db, revisao, doc, por) {
  const atual = await lerAtendimento(db);
  if (atual.revisao !== revisao) return null;
  const versao = atual.versao_publicada + 1;
  const texto = JSON.stringify(doc);
  const soma = await checksum(texto);
  const agora = Date.now();
  const [ins] = await db.batch([
    db
      .prepare(
        'INSERT INTO atendimento_versoes (versao, conteudo, checksum, publicado_em, publicado_por) SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM atendimento WHERE id = 1 AND revisao = ?)',
      )
      .bind(versao, texto, soma, agora, por, revisao),
    db
      .prepare(
        'UPDATE atendimento SET rascunho = ?, versao_publicada = ?, aguardando = 0, revisao = revisao + 1, alterado_em = ?, alterado_por = ? WHERE id = 1 AND revisao = ?',
      )
      .bind(texto, versao, agora, por, revisao),
    db
      .prepare(
        'UPDATE publicacao SET geral = geral + 1, alterado_em = ? WHERE id = 1 AND EXISTS (SELECT 1 FROM atendimento_versoes WHERE versao = ? AND publicado_em = ?)',
      )
      .bind(agora, versao, agora),
  ]);
  return ins.meta.changes === 1 ? versao : null;
}

export async function listarVersoesAtendimento(db) {
  const { results } = await db.prepare('SELECT versao, checksum, publicado_em, publicado_por FROM atendimento_versoes ORDER BY versao DESC').all();
  return results;
}

export async function lerVersaoAtendimento(db, versao) {
  const r = await db.prepare('SELECT * FROM atendimento_versoes WHERE versao = ?').bind(versao).first();
  if (!r || (await checksum(r.conteudo)) !== r.checksum) return null;
  return { ...r, conteudo: JSON.parse(r.conteudo) };
}

// Versão em uso pelos atendentes (íntegra) — null se nada foi publicado.
export async function atendimentoPublicado(db) {
  const v = await db.prepare('SELECT versao_publicada FROM atendimento WHERE id = 1').first('versao_publicada');
  if (!v) return null;
  // recuperação automática: se a versão em uso estiver corrompida, volta para a última íntegra
  for (let n = v; n > 0; n--) {
    const versao = await lerVersaoAtendimento(db, n);
    if (versao) return versao.conteudo;
  }
  return null;
}
