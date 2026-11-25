// Configurações gerais (só o gestor geral altera). Guardadas no KV (chave "cfg").
export const PADRAO = { avisoTexto: '', avisoTipo: 'info', avisoAte: '', sessaoHoras: 12, sugestoesDia: 10 };
const TIPOS = ['info', 'alerta'];

export function validarConfiguracoes(c) {
  const erros = [];
  if (String(c.avisoTexto || '').length > 300) erros.push('O aviso geral pode ter até 300 caracteres.');
  if (!TIPOS.includes(c.avisoTipo)) erros.push('Tipo de aviso inválido.');
  if (c.avisoAte && !/^\d{4}-\d{2}-\d{2}$/.test(c.avisoAte)) erros.push('Data final do aviso inválida.');
  if (!Number.isInteger(c.sessaoHoras) || c.sessaoHoras < 1 || c.sessaoHoras > 24) erros.push('A sessão deve durar de 1 a 24 horas.');
  if (!Number.isInteger(c.sugestoesDia) || c.sugestoesDia < 0 || c.sugestoesDia > 100) erros.push('Limite de sugestões por dia: de 0 a 100.');
  return erros;
}

export function configuracoesDoFormulario(form) {
  return {
    avisoTexto: String(form.get('avisoTexto') ?? '').trim(),
    avisoTipo: String(form.get('avisoTipo') || 'info'),
    avisoAte: String(form.get('avisoAte') ?? '').trim(),
    sessaoHoras: Number(form.get('sessaoHoras')),
    sugestoesDia: Number(form.get('sugestoesDia')),
  };
}

// Aviso geral em vigor hoje (data no fuso da Bahia), ou null.
export function avisoVigente(c, hojeIso) {
  if (!c?.avisoTexto) return null;
  if (c.avisoAte && hojeIso > c.avisoAte) return null;
  return { texto: c.avisoTexto, tipo: c.avisoTipo };
}

export async function lerConfiguracoes(kv) {
  const c = (await kv.get('cfg', 'json')) || {};
  return { ...PADRAO, revisao: 0, ...c };
}

// Salva só se ninguém salvou antes (mesma revisão). Retorna false em conflito.
export async function salvarConfiguracoes(kv, revisao, c, por) {
  const atual = await lerConfiguracoes(kv);
  if (atual.revisao !== revisao) return false;
  await kv.put('cfg', JSON.stringify({ ...c, revisao: revisao + 1, alteradoEm: Date.now(), alteradoPor: por }));
  return true;
}
