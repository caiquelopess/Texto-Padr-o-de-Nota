// Configuração do atendimento (regras puras): ordem e nomes das categorias, em que
// categoria cada serviço aparece, serviços ocultos e scripts (falas + checklist).
import { CATEGORIAS_PADRAO } from './modelos-form.js';
import { SERVICOS_EMBUTIDOS } from './servicos-embutidos.js';

export const LIMITES = { categorias: 20, nomeCategoria: 60, itens: 20, textoItem: 300 };

export function documentoPadrao() {
  return { categorias: CATEGORIAS_PADRAO.map((nome) => ({ nome })), servicos: {}, scripts: {} };
}

const idConhecido = (id) => SERVICOS_EMBUTIDOS.some((s) => s.id === id) || /^sf-md-[a-z0-9][a-z0-9-]{2,59}$/.test(id);
const linhas = (t) =>
  String(t ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function validarAtendimento(doc) {
  const erros = [];
  const cats = Array.isArray(doc?.categorias) ? doc.categorias : [];
  if (!cats.length) erros.push('Informe pelo menos uma categoria.');
  if (cats.length > LIMITES.categorias) erros.push(`No máximo ${LIMITES.categorias} categorias.`);
  const nomes = new Set();
  for (const c of cats) {
    const n = String(c?.nome ?? '').trim();
    if (!n) erros.push('Há uma categoria sem nome.');
    else if (n.length > LIMITES.nomeCategoria) erros.push(`Categoria "${n.slice(0, 20)}…": nome muito longo.`);
    else if (nomes.has(n.toLowerCase())) erros.push(`Categoria "${n}" repetida.`);
    nomes.add(n.toLowerCase());
  }
  for (const [id, s] of Object.entries(doc?.servicos || {})) {
    if (!idConhecido(id)) erros.push(`Serviço desconhecido: ${id}.`);
    else if (s?.categoria && !nomes.has(String(s.categoria).toLowerCase())) erros.push(`Serviço ${id}: a categoria "${s.categoria}" não existe.`);
  }
  for (const [id, sc] of Object.entries(doc?.scripts || {})) {
    if (!idConhecido(id)) erros.push(`Script de serviço desconhecido: ${id}.`);
    for (const parte of ['falas', 'checklist']) {
      const itens = sc?.[parte] || [];
      if (itens.length > LIMITES.itens) erros.push(`Script de ${id}: no máximo ${LIMITES.itens} itens em ${parte}.`);
      if (itens.some((t) => String(t).length > LIMITES.textoItem))
        erros.push(`Script de ${id}: cada item de ${parte} pode ter até ${LIMITES.textoItem} caracteres.`);
    }
  }
  return erros;
}

// Lê o formulário da tela "Atendimento" (categorias uma por linha; campos por serviço).
export function atendimentoDoFormulario(form, comScripts = true) {
  const doc = { categorias: linhas(form.get('categorias')).map((nome) => ({ nome })), servicos: {}, scripts: {} };
  for (const s of SERVICOS_EMBUTIDOS) {
    const cat = String(form.get(`cat:${s.id}`) ?? '').trim();
    const oculto = form.get(`vis:${s.id}`) === 'oculto';
    if (cat || oculto) doc.servicos[s.id] = { ...(cat ? { categoria: cat } : {}), ...(oculto ? { oculto: true } : {}) };
  }
  for (const chave of comScripts ? form.keys() : []) {
    const m = /^(falas|check):(.+)$/.exec(chave);
    if (!m) continue;
    const itens = linhas(form.get(chave));
    if (!itens.length) continue;
    const id = m[2];
    doc.scripts[id] = doc.scripts[id] || { falas: [], checklist: [] };
    doc.scripts[id][m[1] === 'falas' ? 'falas' : 'checklist'] = itens;
  }
  return doc;
}

// Resumo em linhas, para comparar versões.
export function resumoAtendimento(doc, nomes = {}) {
  const nome = (id) => nomes[id] || id;
  const out = [`Categorias: ${(doc.categorias || []).map((c) => c.nome).join(' · ')}`];
  for (const [id, s] of Object.entries(doc.servicos || {}).sort())
    out.push(`${nome(id)}: ${s.oculto ? 'oculto' : 'visível'}${s.categoria ? ` em ${s.categoria}` : ''}`);
  for (const [id, sc] of Object.entries(doc.scripts || {}).sort()) {
    for (const f of sc.falas || []) out.push(`${nome(id)} · fala: ${f}`);
    for (const c of sc.checklist || []) out.push(`${nome(id)} · checklist: ${c}`);
  }
  return out.join('\n');
}
