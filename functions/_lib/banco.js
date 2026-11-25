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
];

const prontos = new WeakSet();
export async function garantirEsquema(db) {
  if (prontos.has(db)) return;
  await db.batch(ESQUEMA.map((sql) => db.prepare(sql)));
  prontos.add(db);
}

async function checksum(texto) {
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

// Modelos em uso pelos atendentes: só a versão publicada e íntegra de cada modelo não arquivado.
export async function modelosPublicados(db) {
  const geral = await db.prepare('SELECT geral FROM publicacao WHERE id = 1').first('geral');
  const { results } = await db
    .prepare(
      "SELECT v.conteudo, v.checksum FROM modelos m JOIN modelo_versoes v ON v.modelo_id = m.id AND v.versao = m.versao_publicada WHERE m.status = 'publicado' ORDER BY m.categoria, m.nome",
    )
    .all();
  const modelos = [];
  for (const r of results) if ((await checksum(r.conteudo)) === r.checksum) modelos.push(JSON.parse(r.conteudo));
  return { geral: geral || 0, modelos };
}
