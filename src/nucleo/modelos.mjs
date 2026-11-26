// Motor de modelos de texto (regras puras, sem DOM).
// Um modelo descreve os campos do formulário e o texto da NOTA/AGENDA com marcadores:
//   {{campo}}                     valor do campo (telefone sai formatado)
//   {{campo|maiusculas}}          em maiúsculas
//   {{campo|telefoneNota}}        telefone no padrão da nota: 71-912341234
//   {{campo|ou:Não informado}}    texto usado quando o campo está vazio
//   {{#se campo}}...{{/se}}       só entra se o campo estiver preenchido
//   {{#se campo=Valor}}...{{/se}} só entra se o campo for igual a Valor
// Os dados preenchidos nunca saem do navegador: o motor só monta o texto localmente.
import { formatarTelefones, telefonesPadraoNota, valorReais } from './formatos.mjs';

export const MD_TIPOS = [
  'texto',
  'textoLongo',
  'telefone',
  'email',
  'data',
  'numero',
  'opcao',
  'documento',
  'dataOuMes',
  'dataHora',
  'faturas',
  'valor',
  'hora',
];
// Campo "valor": valor em reais (ex.: 3.250,80 ou R$ 3.250,80).
// Campo "faturas": lista de { vencimento, valor } (linhas que o atendente adiciona).
// No texto sai como na Reclamação: "vencimento 10/10/2026 R$ 150,00; vencimento ...".
// Campo "documento": aceita CPF (11 números) e/ou CNPJ (14), conforme c.documento ('doc' = os dois, 'cpf', 'cnpj').
const DOC_TIPOS = ['doc', 'cpf', 'cnpj'];
const ID_CAMPO = /^[a-z][a-z0-9_]{0,39}$/;
const ID_MODELO = /^[a-z0-9][a-z0-9-]{2,59}$/;
// {{campo}} ou {{campo|filtro|filtro:argumento}} (filtros em sequência, da esquerda para a direita)
const MARCADOR = /\{\{\s*([a-z][a-z0-9_]*)\s*((?:\|\s*[a-zA-Z]+(?::[^}|]*)?\s*)*)\}\}/g;
const BLOCO = /\{\{#se\s+([a-z][a-z0-9_]*)\s*(?:=\s*([^}]*?))?\s*\}\}\n?((?:(?!\{\{#se\s)[\s\S])*?)\{\{\/se\}\}\n?/;
const FILTROS = ['maiusculas', 'telefoneNota', 'ou', 'original', 'ponto', 'semRS'];
//   ponto: garante um ponto final (tira pontos repetidos do fim); semRS: tira o "R$" do começo.
function lerFiltros(t) {
  return [...String(t || '').matchAll(/\|\s*([a-zA-Z]+)(?::([^}|]*))?/g)].map((m) => ({ nome: m[1], arg: m[2] }));
}
// {{campo|original}}: com notaMaiusculas, o valor fica como foi digitado (ex.: e-mail).
const ORIG_INI = '\uE000';
const ORIG_FIM = '\uE001';

const vazio = (v) => (Array.isArray(v) ? !faturasPreenchidas(v).length : String(v ?? '').trim() === '');

// campo de data que também aceita um texto fixo (ex.: aceita: ["N/A"]), sem diferenciar maiúsculas
const aceitaTexto = (c, v) => [].concat(c.aceita || []).some((a) => String(a).toUpperCase() === String(v).trim().toUpperCase());

// Horário do dia (campo "hora"): aceita 7, 07h, 7:30, 15h30, 0730... e só minutos 00 ou 30.
// Retorna os minutos desde a meia-noite, ou null se inválido.
export function minutosHora(v) {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s/g, '');
  const m = /^(\d{1,2})(?:[h:.](\d{2}))?h?$/.exec(s) || /^(\d{2})(\d{2})$/.exec(s);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2] || 0);
  if (hh > 23 || (mm !== 0 && mm !== 30)) return null;
  return hh * 60 + mm;
}
// Minutos → "07h" (cheia) ou "07h30" (meia).
export function horaDisplay(min) {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return `${String(hh).padStart(2, '0')}h${mm ? '30' : ''}`;
}
// Duração em minutos de HHhMM: "8h30" → 510, "0h30" → 30.
const fmtDuracao = (min) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`;

// linhas de fatura com algum dado
function faturasPreenchidas(lista) {
  return (Array.isArray(lista) ? lista : []).filter((f) => f && (String(f.vencimento ?? '').trim() || String(f.valor ?? '').trim()));
}
function textoFaturas(lista) {
  return faturasPreenchidas(lista)
    .map((f) => `vencimento ${String(f.vencimento ?? '').trim() || 'N/A'} R$ ${String(f.valor ?? '').trim() || '0,00'}`)
    .join('; ');
}

// CPF/CNPJ formatado, ou null se a quantidade de números não serve para o tipo.
function formatarDocumento(valor, tipo = 'doc') {
  const d = String(valor || '').replace(/\D/g, '');
  if (d.length === 11 && tipo !== 'cnpj') return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (d.length === 14 && tipo !== 'cpf') return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return null;
}

// Rótulo do campo com os valores atuais (regra "rotuloSe": o rótulo muda conforme outro campo).
export function mdRotulo(campo, valores = {}) {
  // "rotuloSe" pode ser uma regra só ou uma lista (vale a primeira que bater)
  for (const r of [].concat(campo.rotuloSe || [])) if (r && mdCondicao(r, valores)) return r.rotulo;
  return campo.rotulo;
}

// Campos que aparecem com os valores atuais (regra "mostrar se").
// Confere uma regra "mostrar se". Aceita uma regra { campo, igual | maiorQue } ou uma lista
// de regras (todas precisam valer: ex.: tipo = Atendimento E canal = Presencial).
export function mdCondicao(regra, valores = {}) {
  if (Array.isArray(regra)) return regra.every((r) => mdCondicao(r, valores));
  if (!regra) return true;
  // "maiorQue": vale quando o valor em reais do outro campo passa do limite (ex.: débito > R$ 12.000)
  if (regra.maiorQue !== undefined) {
    const n = valorReais(valores[regra.campo]);
    return n !== null && n > Number(regra.maiorQue);
  }
  return [].concat(regra.igual).includes(String(valores[regra.campo] ?? ''));
}

// Campos que aparecem com os valores atuais (regra "mostrar se").
export function mdCamposVisiveis(modelo, valores = {}) {
  return (modelo.campos || []).filter((c) => mdCondicao(c.mostrarSe, valores));
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
    if (c.tipo === 'documento' && c.documento !== undefined && !DOC_TIPOS.includes(c.documento))
      erros.push(`Campo "${rot}": documento deve ser doc, cpf ou cnpj.`);
  }
  for (const c of campos) {
    if ([].concat(c.mostrarSe || []).some((r) => !ids.has(r.campo))) erros.push(`Campo "${c.rotulo || c.id}": "mostrar se" usa um campo que não existe.`);
    if ([].concat(c.rotuloSe || []).some((r) => !ids.has(r.campo) || vazio(r.rotulo))) erros.push(`Campo "${c.rotulo || c.id}": "rótulo se" incompleto.`);
    if (c.preencherSe && (!ids.has(c.preencherSe.campo) || vazio(c.preencherSe.valor))) erros.push(`Campo "${c.rotulo || c.id}": "preencher se" incompleto.`);
  }
  for (const per of Array.isArray(modelo.periodos) ? modelo.periodos : [])
    if (!ids.has(per.de) || !ids.has(per.ate)) erros.push('Período: os campos "de" e "até" precisam existir.');
  if (modelo.horarioBeneficio)
    for (const per of modelo.horarioBeneficio.periodos || [])
      if (!ids.has(per.de) || !ids.has(per.ate)) erros.push('Horário do benefício: os campos "de" e "até" de cada período precisam existir.');
  // Subtipos: um modelo atende vários botões; cada botão escolhe um valor de um campo de opção.
  if (modelo.subtipos) {
    const alvo = campos.find((c) => c.id === modelo.subtipos.campo);
    const botoes = Array.isArray(modelo.subtipos.botoes) ? modelo.subtipos.botoes : [];
    if (alvo?.tipo !== 'opcao') erros.push('Subtipos: o campo escolhido precisa ser uma opção (lista).');
    else if (!botoes.length || botoes.some((b) => vazio(b.nome) || !alvo.opcoes.includes(b.valor)))
      erros.push('Subtipos: cada botão precisa de nome e de uma opção do campo.');
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
      for (const f of lerFiltros(m[2])) if (!FILTROS.includes(f.nome)) erros.push(`Texto da ${parte.toUpperCase()}: filtro "${f.nome}" desconhecido.`);
    }
  }
  return erros;
}

// Confere o que o atendente preencheu. Retorna a lista de erros (vazia = pode gerar).
export function mdValidarValores(modelo, valores = {}) {
  const erros = [];
  for (const c of mdCamposVisiveis(modelo, valores)) {
    if (c.tipo === 'faturas') {
      const fs = faturasPreenchidas(valores[c.id]);
      if (!fs.length && c.obrigatorio) erros.push(`Preencha o campo: ${mdRotulo(c, valores)}`);
      for (const f of fs) if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(f.vencimento ?? '').trim())) erros.push(`${c.rotulo}: vencimento em dd/mm/aaaa.`);
      continue;
    }
    const v = String(valores[c.id] ?? '').trim();
    if (!v) {
      if (c.obrigatorio) erros.push(`Preencha o campo: ${mdRotulo(c, valores)}`);
      continue;
    }
    if (c.tipo === 'telefone' && formatarTelefones(v) === null) erros.push(`${c.rotulo}: telefone com DDD (10 ou 11 dígitos).`);
    if (c.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.toLowerCase() !== 'não informado') erros.push(`${c.rotulo}: e-mail inválido.`);
    if (c.tipo === 'data' && !aceitaTexto(c, v) && !/^\d{2}\/\d{2}\/\d{4}$/.test(v)) erros.push(`${c.rotulo}: use dd/mm/aaaa.`);
    if (c.tipo === 'numero' && !/^\d+$/.test(v)) erros.push(`${c.rotulo}: só números.`);
    if (c.tipo === 'opcao' && !c.opcoes.includes(v)) erros.push(`${c.rotulo}: escolha uma das opções.`);
    if (c.tipo === 'documento' && formatarDocumento(v, c.documento) === null) erros.push(`${c.rotulo}: documento inválido.`);
    if (c.tipo === 'dataOuMes' && !/^\d{2}\/(\d{2}\/)?\d{4}$/.test(v)) erros.push(`${c.rotulo}: use dd/mm/aaaa ou mm/aaaa.`);
    if (c.tipo === 'valor' && valorReais(v) === null) erros.push(c.mensagem || `${c.rotulo}: informe um valor em reais.`);
    if (c.tipo === 'hora' && minutosHora(v) === null) erros.push(`${c.rotulo}: use um horário de 30 em 30 minutos (ex.: 07h ou 07h30).`);
    if (c.tipo === 'dataHora' && !/\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{4}/.test(v)) erros.push(`${c.rotulo}: comece com a data (dd/mm/aaaa).`);
  }
  return erros;
}

// Padroniza o que o atendente digitou, igual ao sistema anterior (padronizarCampos):
// data aceita d/m/aaaa e vira dd/mm/aaaa; data com dataRegra "passada" não pode ser futura;
// telefone sai no formato (71) 99350-1519. Só campos visíveis. Retorna { valores, erros }.
export function mdNormalizarValores(modelo, valores = {}, hoje = new Date()) {
  const saida = { ...valores };
  const erros = [];
  const dois = (n) => String(n).padStart(2, '0');
  for (const c of mdCamposVisiveis(modelo, valores)) {
    if (c.tipo === 'faturas') {
      // cada vencimento: data real (dd/mm/aaaa), corrigida como antes; valor fica como digitado
      const linhas = [];
      for (const f of faturasPreenchidas(valores[c.id])) {
        const venc = String(f.vencimento ?? '').trim();
        const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(venc);
        const [dia, mes, ano] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
        const dt = new Date(ano, mes - 1, dia);
        if (!m || mes < 1 || mes > 12 || dia < 1 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) {
          erros.push('O vencimento da fatura deve ser uma data real, no formato dd/mm/aaaa.');
          linhas.push(f);
        } else linhas.push({ vencimento: `${dois(dia)}/${dois(mes)}/${ano}`, valor: String(f.valor ?? '').trim() });
      }
      saida[c.id] = linhas;
      continue;
    }
    const v = String(valores[c.id] ?? '').trim();
    if (!v) continue;
    if (c.tipo === 'telefone') {
      const t = formatarTelefones(v);
      if (t === null) erros.push(`O telefone do campo "${c.rotulo}" deve ter 10 ou 11 dígitos, com DDD.`);
      else saida[c.id] = t;
    }
    if (c.tipo === 'documento') {
      const d = formatarDocumento(v, c.documento);
      if (d === null) {
        const esperado =
          c.documento === 'cnpj'
            ? 'um CNPJ com 14 números'
            : c.documento === 'cpf'
              ? 'um CPF com 11 números'
              : 'um CPF com 11 números ou um CNPJ com 14 números';
        erros.push(c.mensagem || `O campo "${mdRotulo(c, valores)}" deve conter ${esperado}. Verifique e tente novamente.`);
      } else saida[c.id] = d;
    }
    if (c.tipo === 'valor' && valorReais(v) === null) erros.push(c.mensagem || `O campo "${mdRotulo(c, valores)}" deve ter um valor em reais (ex: 3.250,80).`);
    // "data e horário" (ex.: 10/10/2026 às 14:00): o texto fica como foi digitado; só confere a data
    if (c.tipo === 'dataHora') {
      const m = /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/.exec(v);
      const rot = mdRotulo(c, valores);
      if (!m) {
        erros.push(`O campo "${rot}" deve começar com uma data no formato dd/mm/aaaa.`);
        continue;
      }
      const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const dt = new Date(ano, mes - 1, dia);
      if (mes < 1 || mes > 12 || dia < 1 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia)
        erros.push(`A data do campo "${rot}" não é uma data real. Verifique o dia e o mês.`);
      else if (c.dataRegra === 'passada' && dt.getTime() > new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime())
        erros.push(`A data do campo "${rot}" não pode ser uma data futura.`);
    }
    if (c.tipo === 'dataOuMes') {
      const mm = /^(\d{1,2})\s*\/\s*(\d{4})$/.exec(v);
      if (mm) {
        const mes = Number(mm[1]);
        if (mes < 1 || mes > 12) erros.push(`O mês do campo "${mdRotulo(c, valores)}" deve ser entre 01 e 12.`);
        else saida[c.id] = `${dois(mes)}/${mm[2]}`;
        continue;
      }
      const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(v);
      const [dia, mes, ano] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
      const dt = new Date(ano, mes - 1, dia);
      if (!m || mes < 1 || mes > 12 || dia < 1 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia)
        erros.push(`O campo "${mdRotulo(c, valores)}" deve ter uma data real (dd/mm/aaaa) ou um mês/ano (mm/aaaa) válido.`);
      else saida[c.id] = `${dois(dia)}/${dois(mes)}/${ano}`;
    }
    if (c.tipo === 'hora') {
      const min = minutosHora(v);
      if (min === null) erros.push(`O campo "${mdRotulo(c, valores)}" deve ter um horário de 30 em 30 minutos (ex.: 07h ou 07h30).`);
      else saida[c.id] = horaDisplay(min);
    }
    if (c.tipo === 'data' && aceitaTexto(c, v)) continue; // ex.: "N/A" na data da leitura
    if (c.tipo === 'data') {
      const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(v);
      if (!m) {
        erros.push(`A data do campo "${c.rotulo}" deve estar no formato dd/mm/aaaa.`);
        continue;
      }
      const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const dt = new Date(ano, mes - 1, dia);
      if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) {
        erros.push(`A data do campo "${c.rotulo}" não é uma data real. Verifique o dia e o mês.`);
        continue;
      }
      const meiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      if (c.dataRegra === 'passada' && dt.getTime() > meiaNoite.getTime()) {
        erros.push(`A data do campo "${c.rotulo}" não pode ser uma data futura.`);
        continue;
      }
      saida[c.id] = `${dois(dia)}/${dois(mes)}/${ano}`;
    }
  }
  // períodos (de/até): os dois preenchidos ou os dois em branco; o fim não pode ser antes do início
  for (const per of Array.isArray(modelo.periodos) ? modelo.periodos : []) {
    const de = String(saida[per.de] ?? '').trim();
    const ate = String(saida[per.ate] ?? '').trim();
    if (!de && !ate) continue;
    if (!de || !ate) {
      erros.push('preencha as duas datas do período (de e até) ou deixe as duas em branco.');
      continue;
    }
    const n = (t) => t.split('/').reverse().join('');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(de) && /^\d{2}\/\d{2}\/\d{4}$/.test(ate) && n(ate) < n(de))
      erros.push('a data final do período não pode ser anterior à inicial.');
  }
  // horário do benefício (ex.: Irrigante): os períodos devem somar o total, em blocos de 30 min,
  // fora da(s) janela(s) vedada(s) (ponta). Um período pode atravessar a meia-noite (22h → 00h30).
  if (modelo.horarioBeneficio) {
    const cfg = modelo.horarioBeneficio;
    let soma = 0;
    let temErro = false;
    for (const per of cfg.periodos || []) {
      const de = String(saida[per.de] ?? '').trim();
      const ate = String(saida[per.ate] ?? '').trim();
      if (!de && !ate) {
        if (!per.opcional) {
          erros.push('Informe o início e o fim de cada período do benefício.');
          temErro = true;
        }
        continue;
      }
      if (!de || !ate) {
        erros.push('Preencha o início e o fim do período (ou deixe os dois em branco).');
        temErro = true;
        continue;
      }
      const mde = minutosHora(de);
      const mate = minutosHora(ate);
      if (mde === null || mate === null) {
        temErro = true;
        continue;
      }
      const dur = (mate - mde + 1440) % 1440;
      if (dur === 0) {
        erros.push('O fim do período deve ser diferente do início.');
        temErro = true;
        continue;
      }
      soma += dur;
      for (const [ini, fim] of cfg.vedado || []) {
        let caiNaPonta = false;
        for (let off = 0; off < dur; off += 30) if ((mde + off) % 1440 >= ini && (mde + off) % 1440 < fim) caiNaPonta = true;
        if (caiNaPonta) {
          erros.push(`Os horários não podem cair no horário de ponta (${horaDisplay(ini)} às ${horaDisplay(fim)}).`);
          temErro = true;
        }
      }
    }
    if (!temErro && soma !== cfg.totalMin) erros.push(`Os períodos devem somar ${fmtDuracao(cfg.totalMin)} por dia (agora somam ${fmtDuracao(soma)}).`);
  }
  return { valores: saida, erros: [...new Set(erros)] };
}

function valorFormatado(campo, bruto, filtros) {
  let v = Array.isArray(bruto) ? textoFaturas(bruto) : String(bruto ?? '').trim();
  const ou = filtros.find((f) => f.nome === 'ou');
  if (!v) return ou ? (ou.arg ?? '') : '';
  const nomes = filtros.map((f) => f.nome);
  if (campo && campo.tipo === 'telefone') v = nomes.includes('telefoneNota') ? telefonesPadraoNota(v) : formatarTelefones(v) || v;
  for (const n of nomes) {
    if (n === 'maiusculas') v = v.toUpperCase();
    if (n === 'ponto') v = `${v.replace(/\.+$/, '')}.`;
    if (n === 'semRS') v = v.replace(/^R\$\s*/i, '');
  }
  return v;
}

function preencher(texto, modelo, valores, marcarOriginal = false) {
  const porId = Object.fromEntries((modelo.campos || []).map((c) => [c.id, c]));
  const visiveis = new Set(mdCamposVisiveis(modelo, valores).map((c) => c.id));
  const val = (id) => (visiveis.has(id) ? valores[id] : '');
  let t = String(texto || '');
  // blocos condicionais, do mais interno para fora
  for (let m = BLOCO.exec(t); m; m = BLOCO.exec(t)) {
    const [inteiro, campo, igual, corpo] = m;
    const bruto = val(campo);
    const atual = Array.isArray(bruto) ? textoFaturas(bruto) : String(bruto ?? '').trim();
    const entra = igual === undefined ? atual !== '' : atual === igual.trim();
    t = t.slice(0, m.index) + (entra ? corpo : '') + t.slice(m.index + inteiro.length);
  }
  return t
    .replace(MARCADOR, (_, id, lista) => {
      const filtros = lerFiltros(lista);
      const v = valorFormatado(porId[id], val(id), filtros);
      return marcarOriginal && filtros.some((f) => f.nome === 'original') ? ORIG_INI + v + ORIG_FIM : v;
    })
    .replace(/\n+$/, '');
}

// Preenche um texto qualquer com os marcadores do modelo (ex.: dados da pendência criada ao gerar).
export function mdPreencher(modelo, valores, texto) {
  return preencher(texto, modelo, valores);
}

// Monta os textos de NOTA e AGENDA.
// notaMaiusculas: a NOTA sai toda em maiúsculas e sem espaços repetidos (padrão das notas de campo).
// Como notaCaps (maiúsculas, sem espaços repetidos), mas os trechos marcados com |original ficam como foram digitados.
function maiusculasExceto(t) {
  let saida = '';
  let ultimo = 0;
  for (const m of t.matchAll(/\uE000([\s\S]*?)\uE001/g)) {
    saida += t.slice(ultimo, m.index).toUpperCase() + m[1];
    ultimo = m.index + m[0].length;
  }
  return (saida + t.slice(ultimo).toUpperCase()).replace(/\s+/g, ' ').trim();
}
export function mdGerar(modelo, valores = {}) {
  const agenda = preencher(modelo.agenda, modelo, valores);
  if (!modelo.notaMaiusculas) return { nota: preencher(modelo.nota, modelo, valores), agenda };
  return { nota: maiusculasExceto(preencher(modelo.nota, modelo, valores, true)), agenda };
}

function exemplo(campo) {
  if (campo.tipo === 'telefone') return '71993501519';
  if (campo.tipo === 'email') return 'teste@email.com';
  if (campo.tipo === 'data') return '10/11/2026';
  if (campo.tipo === 'numero') return '123456';
  if (campo.tipo === 'opcao') return campo.opcoes[0];
  if (campo.tipo === 'documento') return campo.documento === 'cnpj' ? '12345678000195' : '12345678901';
  if (campo.tipo === 'dataOuMes') return '10/2026';
  if (campo.tipo === 'dataHora') return '10/11/2025 às 14:00';
  if (campo.tipo === 'faturas') return [{ vencimento: '10/11/2026', valor: '150,00' }];
  if (campo.tipo === 'valor') return '1.500,00';
  if (campo.tipo === 'hora') return '07h30';
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
