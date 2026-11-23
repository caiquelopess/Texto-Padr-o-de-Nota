// Regras de login (sem dependências; roda no Cloudflare e no Node para os testes).
// Senhas: PBKDF2-SHA256 com sal aleatório. As iterações cabem no limite de CPU do
// plano gratuito do Cloudflare; a proteção extra vem do bloqueio após tentativas erradas.

const ITERACOES = 10000;
export const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000; // um turno
export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_SEGUNDOS = 15 * 60;

const cod = new TextEncoder();

export function normalizarUsuario(txt) {
  return String(txt || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

// nome.sobrenome (pode ter mais partes e número no fim para homônimos: maria.silva2)
export function usuarioValido(u) {
  return /^[a-z]+(\.[a-z]+)+\d*$/.test(u) && u.length <= 60;
}

// mínimo 4 caracteres: letras, números ou especiais
export function senhaValida(s) {
  if (typeof s !== 'string' || s.length < 4 || s.length > 128) return false;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) < 32) return false; // sem caracteres de controle
  return true;
}

const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const deB64 = (txt) => Uint8Array.from(atob(txt), (c) => c.charCodeAt(0));
const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function pbkdf2(senha, sal, iteracoes) {
  const chave = await crypto.subtle.importKey('raw', cod.encode(senha), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, 256);
}

export function iguais(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function gerarHash(senha) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return { alg: 'pbkdf2-sha256', it: ITERACOES, sal: b64(sal), hash: b64(await pbkdf2(senha, sal, ITERACOES)) };
}

export async function conferirSenha(senha, registro) {
  if (!registro?.sal || !registro.hash) return false;
  const calc = b64(await pbkdf2(senha, deB64(registro.sal), registro.it || ITERACOES));
  return iguais(calc, registro.hash);
}

async function hmac(segredo, texto) {
  const chave = await crypto.subtle.importKey('raw', cod.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', chave, cod.encode(texto)));
}

// Sessão: "usuario.versaoSenha.expira.assinatura" (trocar/redefinir a senha derruba sessões antigas)
export async function criarSessao(segredo, usuario, versaoSenha, agora = Date.now()) {
  const corpo = `${usuario}~${versaoSenha}~${agora + DURACAO_SESSAO_MS}`;
  return `${corpo}~${await hmac(segredo, corpo)}`;
}

export async function lerSessao(segredo, token, agora = Date.now()) {
  const partes = String(token || '').split('~');
  if (partes.length !== 4) return null;
  const [usuario, versao, expira, assinatura] = partes;
  if (!iguais(await hmac(segredo, `${usuario}~${versao}~${expira}`), assinatura)) return null;
  if (!(Number(expira) > agora)) return null;
  return { usuario, versaoSenha: Number(versao), expira: Number(expira) };
}

export function lerCookie(cabecalho, nome) {
  for (const parte of String(cabecalho || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0 && parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}

// Só aceita voltar para caminhos do próprio site (evita redirecionar para fora)
export function destinoSeguro(destino) {
  const d = String(destino || '/');
  return d.startsWith('/') && !d.startsWith('//') && !d.startsWith('/\\') ? d : '/';
}
