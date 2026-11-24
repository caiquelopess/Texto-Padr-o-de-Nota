// Formulários para impressão: o responsável envia pela Administração e os atendentes
// encontram na aba "Formulários" do site. Ficam no mesmo KV dos usuários:
//   f:<id>  — dados (nome, tipo, tamanho, data, quem enviou)
//   fa:<id> — o arquivo
export const TAMANHO_MAXIMO = 10 * 1024 * 1024; // 10 MB (o KV aceita até 25 MB por item)

// Só PDF, PNG e JPG — conferidos pelo conteúdo do arquivo, não pelo nome.
export function tipoDoArquivo(bytes) {
  const b = new Uint8Array(bytes.slice(0, 8));
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  return null;
}

const EXTENSAO = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' };

export function nomeValido(nome) {
  const n = String(nome ?? '').trim();
  return n.length >= 2 && n.length <= 120 ? n : '';
}

export function idValido(id) {
  return /^[a-f0-9-]{36}$/.test(String(id ?? ''));
}

// nome de arquivo para o download: sem acento e sem caracteres especiais
export function nomeDoArquivo(nome, tipo) {
  const base =
    String(nome)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'formulario';
  return `${base}.${EXTENSAO[tipo]}`;
}

export async function listarFormularios(kv) {
  const lista = [];
  let cursor;
  do {
    const r = await kv.list({ prefix: 'f:', cursor });
    for (const k of r.keys) {
      const reg = await kv.get(k.name, 'json');
      if (reg) lista.push(reg);
    }
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
