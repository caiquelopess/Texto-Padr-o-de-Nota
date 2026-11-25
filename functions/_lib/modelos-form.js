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

export function modeloDoFormulario(form, id) {
  const lista = (nome) => form.getAll(nome).map(texto);
  const ids = lista('campo_id');
  const rotulos = lista('campo_rotulo');
  const tipos = lista('campo_tipo');
  const obrig = lista('campo_obrigatorio');
  const opcoes = lista('campo_opcoes');
  const mostrar = lista('campo_mostrar');
  const campos = [];
  ids.forEach((cid, i) => {
    if (!cid && !rotulos[i]) return; // linha em branco
    const c = { id: cid, rotulo: rotulos[i], tipo: tipos[i] || 'texto' };
    if (obrig[i] === 'sim') c.obrigatorio = true;
    if (c.tipo === 'opcao') c.opcoes = opcoes[i].split('|').map(texto).filter(Boolean);
    const m = /^([a-z][a-z0-9_]*)\s*=\s*(.+)$/.exec(mostrar[i] || '');
    if (m) c.mostrarSe = { campo: m[1], igual: m[2].split('|').map(texto).filter(Boolean) };
    campos.push(c);
  });
  return {
    id,
    nome: texto(form.get('nome')),
    categoria: texto(form.get('categoria')),
    descricao: texto(form.get('descricao')),
    avisos: texto(form.get('avisos')).split('\n').map(texto).filter(Boolean),
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
