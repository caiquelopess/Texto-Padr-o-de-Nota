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

// Texto de um aviso como aparece no editor (avisos formatados viram texto sem marcação).
export function textoDoAviso(a) {
  if (a && typeof a === 'object')
    return String(a.texto ?? a.html ?? '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return texto(a);
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
  // avisos: linha igual a um aviso existente mantém a formatação dele; linha nova é texto puro
  const avisosBase = base?.avisos || [];
  const avisos = texto(form.get('avisos'))
    .split('\n')
    .map(texto)
    .filter(Boolean)
    .map((linha) => avisosBase.find((a) => textoDoAviso(a) === linha) ?? linha);
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
