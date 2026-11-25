// Motor de modelos de texto (regras puras, sem DOM).
// Um modelo descreve os campos do formulário e o texto da NOTA/AGENDA com marcadores:
//   {{campo}}                     valor do campo (telefone sai formatado)
//   {{campo|maiusculas}}          em maiúsculas
//   {{campo|telefoneNota}}        telefone no padrão da nota: 71-912341234
//   {{campo|ou:Não informado}}    texto usado quando o campo está vazio
//   {{#se campo}}...{{/se}}       só entra se o campo estiver preenchido
//   {{#se campo=Valor}}...{{/se}} só entra se o campo for igual a Valor
// Os dados preenchidos nunca saem do navegador: o motor só monta o texto localmente.
import { formatarTelefones, telefonesPadraoNota } from './formatos.mjs';

export const MD_TIPOS = ['texto', 'textoLongo', 'telefone', 'email', 'data', 'numero', 'opcao'];
const ID_CAMPO = /^[a-z][a-z0-9_]{0,39}$/;
const ID_MODELO = /^[a-z0-9][a-z0-9-]{2,59}$/;
const MARCADOR = /\{\{\s*([a-z][a-z0-9_]*)\s*(?:\|\s*([a-zA-Z]+)(?::([^}]*))?)?\s*\}\}/g;
const BLOCO = /\{\{#se\s+([a-z][a-z0-9_]*)\s*(?:=\s*([^}]*?))?\s*\}\}\n?((?:(?!\{\{#se\s)[\s\S])*?)\{\{\/se\}\}\n?/;
const FILTROS = ['maiusculas', 'telefoneNota', 'ou'];

const vazio = (v) => String(v ?? '').trim() === '';

// Campos que aparecem com os valores atuais (regra "mostrar se").
export function mdCamposVisiveis(modelo, valores = {}) {
  return (modelo.campos || []).filter((c) => {
    if (!c.mostrarSe) return true;
    const atual = String(valores[c.mostrarSe.campo] ?? '');
    const aceitos = [].concat(c.mostrarSe.igual);
    return aceitos.includes(atual);
  });
}

// Confere a estrutura do modelo antes de salvar/publicar. Retorna a lista de erros (vazia = válido).
export function mdValidarModelo(modelo) {
  const erros = [];
  if (!modelo || typeof modelo !== 'object') return ['Modelo vazio.'];
  if (!ID_MODELO.test(String(modelo.id || ''))) erros.push('Identificador inválido: use de 3 a 60 letras minúsculas, números e hífen.');
  if (vazio(modelo.nome)) erros.push('Dê um nome ao modelo.');
  if (vazio(modelo.categoria)) erros.push('Escolha a categoria.');
  const campos = Array.isArray(modelo.campos) ? modelo.campos : [];
  const ids = new Set();
  for (const c of campos) {
    const rot = c.rotulo || c.id;
    if (!ID_CAMPO.test(String(c.id || ''))) erros.push(`Campo "${rot}": identificador inválido (letras minúsculas, números e _).`);
    else if (ids.has(c.id)) erros.push(`Campo "${c.id}" repetido.`);
    ids.add(c.id);
    if (vazio(c.rotulo)) erros.push(`Campo "${c.id}": falta o rótulo.`);
    if (!MD_TIPOS.includes(c.tipo)) erros.push(`Campo "${rot}": tipo desconhecido.`);
    if (c.tipo === 'opcao' && !(Array.isArray(c.opcoes) && c.opcoes.length)) erros.push(`Campo "${rot}": informe as opções.`);
  }
  for (const c of campos) {
    if (c.mostrarSe && !ids.has(c.mostrarSe.campo)) erros.push(`Campo "${c.rotulo || c.id}": "mostrar se" usa um campo que não existe.`);
  }
  if (vazio(modelo.nota) && vazio(modelo.agenda)) erros.push('Escreva o texto da NOTA ou da AGENDA.');
  for (const parte of ['nota', 'agenda']) {
    const t = String(modelo[parte] || '');
    const aberturas = (t.match(/\{\{#se\s/g) || []).length;
    const fechamentos = (t.match(/\{\{\/se\}\}/g) || []).length;
    if (aberturas !== fechamentos) erros.push(`Texto da ${parte.toUpperCase()}: blocos {{#se}} e {{/se}} não fecham.`);
    for (const m of t.matchAll(/\{\{#se\s+([a-z][a-z0-9_]*)/g))
      if (!ids.has(m[1])) erros.push(`Texto da ${parte.toUpperCase()}: {{#se ${m[1]}}} usa um campo que não existe.`);
    for (const m of t.matchAll(MARCADOR)) {
      if (!ids.has(m[1])) erros.push(`Texto da ${parte.toUpperCase()}: {{${m[1]}}} não é um campo do modelo.`);
      if (m[2] && !FILTROS.includes(m[2])) erros.push(`Texto da ${parte.toUpperCase()}: filtro "${m[2]}" desconhecido.`);
    }
  }
  return erros;
}

// Confere o que o atendente preencheu. Retorna a lista de erros (vazia = pode gerar).
export function mdValidarValores(modelo, valores = {}) {
  const erros = [];
  for (const c of mdCamposVisiveis(modelo, valores)) {
    const v = String(valores[c.id] ?? '').trim();
    if (!v) {
      if (c.obrigatorio) erros.push(`Preencha o campo: ${c.rotulo}`);
      continue;
    }
    if (c.tipo === 'telefone' && formatarTelefones(v) === null) erros.push(`${c.rotulo}: telefone com DDD (10 ou 11 dígitos).`);
    if (c.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.toLowerCase() !== 'não informado') erros.push(`${c.rotulo}: e-mail inválido.`);
    if (c.tipo === 'data' && !/^\d{2}\/\d{2}\/\d{4}$/.test(v)) erros.push(`${c.rotulo}: use dd/mm/aaaa.`);
    if (c.tipo === 'numero' && !/^\d+$/.test(v)) erros.push(`${c.rotulo}: só números.`);
    if (c.tipo === 'opcao' && !c.opcoes.includes(v)) erros.push(`${c.rotulo}: escolha uma das opções.`);
  }
  return erros;
}

function valorFormatado(campo, bruto, filtro, argumento) {
  let v = String(bruto ?? '').trim();
  if (!v) return filtro === 'ou' ? argumento : '';
  if (campo && campo.tipo === 'telefone') v = filtro === 'telefoneNota' ? telefonesPadraoNota(v) : formatarTelefones(v) || v;
  if (filtro === 'maiusculas') v = v.toUpperCase();
  return v;
}

function preencher(texto, modelo, valores) {
  const porId = Object.fromEntries((modelo.campos || []).map((c) => [c.id, c]));
  const visiveis = new Set(mdCamposVisiveis(modelo, valores).map((c) => c.id));
  const val = (id) => (visiveis.has(id) ? valores[id] : '');
  let t = String(texto || '');
  // blocos condicionais, do mais interno para fora
  for (let m = BLOCO.exec(t); m; m = BLOCO.exec(t)) {
    const [inteiro, campo, igual, corpo] = m;
    const atual = String(val(campo) ?? '').trim();
    const entra = igual === undefined ? atual !== '' : atual === igual.trim();
    t = t.slice(0, m.index) + (entra ? corpo : '') + t.slice(m.index + inteiro.length);
  }
  return t.replace(MARCADOR, (_, id, filtro, argumento) => valorFormatado(porId[id], val(id), filtro, argumento)).replace(/\n+$/, '');
}

// Monta os textos de NOTA e AGENDA.
export function mdGerar(modelo, valores = {}) {
  return { nota: preencher(modelo.nota, modelo, valores), agenda: preencher(modelo.agenda, modelo, valores) };
}

function exemplo(campo) {
  if (campo.tipo === 'telefone') return '71993501519';
  if (campo.tipo === 'email') return 'teste@email.com';
  if (campo.tipo === 'data') return '10/11/2026';
  if (campo.tipo === 'numero') return '123456';
  if (campo.tipo === 'opcao') return campo.opcoes[0];
  return `Teste ${campo.rotulo}`;
}

// Teste automático antes de publicar: gera o texto com dados fictícios,
// passando por cada opção dos campos de escolha.
export function mdTestarModelo(modelo) {
  const erros = mdValidarModelo(modelo);
  if (erros.length) return { ok: false, erros, exemplos: [] };
  const base = Object.fromEntries(modelo.campos.map((c) => [c.id, exemplo(c)]));
  const cenarios = [base];
  for (const c of modelo.campos) if (c.tipo === 'opcao') for (const op of c.opcoes.slice(1)) cenarios.push({ ...base, [c.id]: op });
  const exemplos = [];
  for (const valores of cenarios) {
    const problemas = mdValidarValores(modelo, valores);
    if (problemas.length) erros.push(...problemas.map((p) => `Teste: ${p}`));
    const saida = mdGerar(modelo, valores);
    if (!saida.nota && !saida.agenda) erros.push('Teste: o texto gerado ficou vazio.');
    if (/\{\{|\}\}/.test(saida.nota + saida.agenda)) erros.push('Teste: sobrou marcador {{ }} no texto gerado.');
    exemplos.push(saida);
  }
  return { ok: erros.length === 0, erros: [...new Set(erros)], exemplos };
}
