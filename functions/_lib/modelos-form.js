// Converte o formulário do editor de modelos (campos repetidos) no objeto do modelo.
export const CATEGORIAS_PADRAO = [
  'Ligação e Reativação',
  'Titularidade e Cadastro',
  'Faturamento e Débitos',
  'Parcelamento',
  'Ressarcimento',
  'Medição e Rede',
  'Reclamações e Outros',
];

const texto = (v) => String(v ?? '').trim();

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescapar = (t) => String(t).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Texto de um aviso como aparece no editor: cada item de lista numa linha "• ...".
export function textoDoAviso(a) {
  if (a && typeof a === 'object')
    return desescapar(String(a.texto ?? a.html ?? ''))
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
  return texto(a);
}

// Um bloco de texto do editor (linhas) vira um aviso. Linhas "• " ou "- " viram itens de lista.
// Se o bloco for igual a um aviso que já existe, mantém o original (negrito, cor, "mostrar se", id).
function avisoDoBloco(bloco, avisosBase) {
  const linhas = bloco
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!linhas.length) return null;
  const canon = linhas.join('\n');
  const existente = avisosBase.find((a) => textoDoAviso(a) === canon);
  if (existente) return existente;
  const itens = [];
  const cabecalho = [];
  for (const l of linhas) {
    const m = /^[•-]\s+(.*)$/.exec(l);
    if (m) itens.push(m[1]);
    else cabecalho.push(l);
  }
  if (itens.length) return { html: `${escapar(cabecalho.join(' '))}<ul>${itens.map((it) => `<li>${escapar(it)}</li>`).join('')}</ul>` };
  return cabecalho.join(' ');
}

// "Mostrar se" simples (campo=A|B) cabe no formulário; regras combinadas ou "maior que" são avançadas.
export function mostrarSeSimples(r) {
  return !!r && !Array.isArray(r) && r.maiorQue === undefined;
}
export const MOSTRAR_AVANCADO = '(regra avançada — mantida)';

// Chaves que o formulário edita; o resto do rascunho (configurações avançadas dos modelos do sistema:
// subtipos, pendência, ids originais, rótulos condicionais etc.) é mantido como estava.
const CHAVES_FORM = ['id', 'nome', 'categoria', 'descricao', 'avisos', 'copiar', 'campos', 'nota', 'agenda'];
const CHAVES_CAMPO_FORM = ['id', 'rotulo', 'tipo', 'obrigatorio', 'opcoes', 'mostrarSe'];

export function modeloDoFormulario(form, id, base = null) {
  const lista = (nome) => form.getAll(nome).map(texto);
  const ids = lista('campo_id');
  const rotulos = lista('campo_rotulo');
  const tipos = lista('campo_tipo');
  const obrig = lista('campo_obrigatorio');
  const opcoes = lista('campo_opcoes');
  const mostrar = lista('campo_mostrar');
  const campos = [];
  const camposBase = Object.fromEntries((base?.campos || []).map((c) => [c.id, c]));
  ids.forEach((cid, i) => {
    if (!cid && !rotulos[i]) return; // linha em branco
    const antigo = camposBase[cid];
    // configurações avançadas do campo (ex.: id original, dica, largura) continuam
    const c = antigo ? Object.fromEntries(Object.entries(antigo).filter(([k]) => !CHAVES_CAMPO_FORM.includes(k))) : {};
    Object.assign(c, { id: cid, rotulo: rotulos[i], tipo: tipos[i] || 'texto' });
    if (obrig[i] === 'sim') c.obrigatorio = true;
    if (c.tipo === 'opcao') {
      c.opcoes = opcoes[i].split('|').map(texto).filter(Boolean);
      // nomes amigáveis das opções só valem se as opções não mudaram
      if (!antigo || JSON.stringify(antigo.opcoes) !== JSON.stringify(c.opcoes)) delete c.rotulosOpcoes;
    } else delete c.rotulosOpcoes;
    if (mostrar[i] === MOSTRAR_AVANCADO && antigo && antigo.mostrarSe) c.mostrarSe = antigo.mostrarSe;
    else {
      const m = /^([a-z][a-z0-9_]*)\s*=\s*(.+)$/.exec(mostrar[i] || '');
      if (m) c.mostrarSe = { campo: m[1], igual: m[2].split('|').map(texto).filter(Boolean) };
    }
    campos.push(c);
  });
  // avisos: um por bloco (separados por linha em branco). Dentro do bloco, linhas "• " viram lista.
  const avisosBase = base?.avisos || [];
  const avisos = String(form.get('avisos') ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((bloco) => avisoDoBloco(bloco, avisosBase))
    .filter(Boolean);
  const extras = base ? Object.fromEntries(Object.entries(base).filter(([k]) => !CHAVES_FORM.includes(k))) : {};
  return {
    ...extras,
    id,
    nome: texto(form.get('nome')),
    categoria: texto(form.get('categoria')),
    descricao: texto(form.get('descricao')),
    avisos,
    copiar: form.get('copiar') === 'agenda' ? 'agenda' : 'nota',
    campos,
    nota: String(form.get('nota') ?? '')
      .replace(/\r\n/g, '\n')
      .trimEnd(),
    agenda: String(form.get('agenda') ?? '')
      .replace(/\r\n/g, '\n')
      .trimEnd(),
  };
}
