// Canal de sugestões (#10): o atendente envia pelo menu do usuário; o responsável lê na Administração.
// KV: s:<id> — { id, usuario, tipo, texto, criado }   ·   sl:<usuario>:<dia> — contador diário
const TIPOS = ['Sugestão', 'Problema', 'Novo serviço ou formulário'];
export const MAX_TEXTO = 2000;

export function validarSugestao(dados) {
  const tipo = TIPOS.includes(dados?.tipo) ? dados.tipo : '';
  const texto = String(dados?.texto ?? '').trim();
  if (!tipo) return { erro: 'Escolha o tipo.' };
  if (texto.length < 5) return { erro: 'Escreva um pouco mais (mínimo 5 caracteres).' };
  if (texto.length > MAX_TEXTO) return { erro: `Use no máximo ${MAX_TEXTO} caracteres.` };
  return { tipo, texto };
}

export async function listarSugestoes(kv) {
  const lista = [];
  let cursor;
  do {
    const r = await kv.list({ prefix: 's:', cursor });
    for (const k of r.keys) {
      const reg = await kv.get(k.name, 'json');
      if (reg) lista.push(reg);
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return lista.sort((a, b) => b.criado - a.criado);
}
