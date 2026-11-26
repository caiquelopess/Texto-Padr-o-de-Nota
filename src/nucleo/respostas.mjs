// Respostas da Análise de Isenção de Débitos (Troca de Titularidade ou Reativação).
// Os textos de INDEFERIMENTO são os do "Texto Padrão Lojas" (Conexão Logos), com a mesma redação.
// Os textos de DEFERIMENTO seguem o mesmo formato (cabeçalho, protocolo e parágrafo da decisão).
// Com mais de um motivo de indeferimento, os textos são combinados em uma única resposta:
// título com todos os motivos, um só cabeçalho, a lista dos motivos, as normas citadas
// (sem repetir) e um só pedido de documentação no final.
// Regras puras (sem DOM): nenhum dado do cliente sai do navegador.

export const RESP_DISTRIBUIDORAS = ['Coelba', 'Pernambuco', 'Cosern', 'Brasília', 'Elektro'];
export const RESP_SERVICOS = ['Troca de Titularidade', 'Reativação'];

const PEDIDO_DOCUMENTOS =
  'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua {servico}.';

// id, título (como no PDF), texto completo do motivo sozinho, trecho para a lista combinada,
// norma citada e pedido final ('doc' = pedido de documentação; texto = pedido próprio).
export const RESP_INDEFERIMENTOS = [
  {
    id: 'debito_outra_uc',
    nome: 'CPF/CNPJ com débito em outra UC',
    titulo: 'CPF/CNPJ COM DÉBITO EM OUTRA UC',
    texto:
      'Informamos que após análise, verificamos que o(a) senhor(a) possui débitos de pagamento em outra Unidade Consumidora cadastrada em seu CPF/CNPJ, portanto, o seu pedido de {servico} não pode ser realizado.',
    item: 'o(a) senhor(a) possui débitos de pagamento em outra Unidade Consumidora cadastrada em seu CPF/CNPJ',
    norma:
      'REN 1000/2024 (Art. 346. § 2º (...) A distribuidora pode exigir o pagamento de débitos que sejam do novo titular em outra instalação na área de atuação da distribuidora',
    pedido: null,
  },
  {
    id: 'documentacao_incompleta',
    nome: 'Documentação do cliente incompleta',
    titulo: 'DOCUMENTAÇÃO DO CLIENTE INCOMPLETA',
    texto:
      'Informamos que após análise, não conseguimos identificar a presença do documento {documento} anexado em sua solicitação, portanto, seu pedido não pôde ser realizado.',
    item: 'não conseguimos identificar a presença do documento {documento} anexado em sua solicitação',
    norma:
      'REN 1000/2021 (Art. 138. § 1º A distribuidora pode exigir do novo titular os seguintes documentos para alterar a titularidade:\nI - Identificação do consumidor e demais usuários, conforme incisos I e II do art. 67;\nII - Apresentação de documento, com data, que comprove a propriedade ou posse do imóvel em que se localizam as instalações do consumidor e demais usuários, observado o art. 14);',
    pedido: 'Solicitamos que envie a documentação completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua {servico}.',
    precisaDocumento: true,
  },
  {
    id: 'endereco_divergente',
    nome: 'Endereço do documento do imóvel divergente no sistema comercial',
    titulo: 'ENDEREÇO DO DOCUMENTO DO IMÓVEL DIVERGENTE NO SISTEMA COMERCIAL',
    texto:
      'Verificamos que os endereços presentes no Documento do Imóvel e no nosso sistema comercial são divergentes, portanto, o seu pedido não pôde ser realizado.',
    item: 'os endereços presentes no Documento do Imóvel e no nosso sistema comercial são divergentes',
    norma: null,
    pedido: 'Solicitamos que envie a documentação correta e completa para que possamos prosseguir com a sua {servico}.',
    aviso: 'Use somente após validar com o cliente que não se trata de erro no cadastro da Neoenergia.',
  },
  {
    id: 'data_futura',
    nome: 'Documento do imóvel com data futura',
    titulo: 'DOCUMENTO DO IMÓVEL COM DATA FUTURA',
    texto:
      'Informamos que após análise, verificamos que a data presente no documento do imóvel é diferente da data atual, portanto, o seu pedido não pode ser realizado.',
    item: 'a data presente no documento do imóvel é diferente da data atual',
    norma:
      'REN 1000/2024 (Art. 138. §1º, II - apresentação de documento, com data, que comprove a propriedade ou posse do imóvel em que se localizam as instalações do consumidor e demais usuários, observado o art. 14.',
    pedido: 'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos seguir com sua {servico}.',
  },
  {
    id: 'cpf_invalido',
    nome: 'CPF/CNPJ inválido',
    titulo: 'CPF/CNPJ INVÁLIDO',
    texto:
      'Informamos que após análise, verificamos que o documento CPF/CNPJ se encontra anulado, cancelado, ausência de RG ou outro documento oficial com foto, portanto, o seu pedido não pôde ser realizado.',
    item: 'o documento CPF/CNPJ se encontra anulado, cancelado, ausência de RG ou outro documento oficial com foto',
    norma:
      'REN 1000/2021 (Art. 67 inciso I e II - I - para pessoa jurídica, apresentação dos documentos relativos à sua constituição, ao seu registro e dos seus representantes legais; II - para pessoa física, apresentação de: a) Cadastro de Pessoa Física – CPF, desde que não esteja em situação cadastral cancelada ou anulada de acordo com instrução normativa da Receita Federal; e b) Carteira de Identidade ou outro documento de identificação oficial com foto e, no caso de indígenas, podendo ser apenas o Registro Administrativo de Nascimento Indígena – RANI.)',
    pedido: 'Solicitamos que envie a documentação correta e completa em um de nossos Canais de Atendimento para que possamos prosseguir com a sua {servico}.',
  },
  {
    id: 'processo_fraude',
    nome: 'Processo de fraude',
    titulo: 'PROCESSO DE FRAUDE',
    texto:
      'Informamos que após análise, verificamos que existe um processo de emissão de fatura de cobrança de fraude/irregularidade em andamento, portanto, o seu pedido não pôde ser realizado.',
    item: 'existe um processo de emissão de fatura de cobrança de fraude/irregularidade em andamento',
    norma: null,
    pedido:
      'Solicitamos que a {servicoMinusculo} seja solicitada após a conclusão/emissão da fatura de fraude ou irregularidade para que possamos prosseguir com a sua {servico}.',
    pedidoProprio: true,
  },
];

export const RESP_DEFERIMENTOS = [
  {
    id: 'total',
    nome: 'Deferido — isenção total do débito',
    titulo: 'DEFERIDA',
    texto:
      'Informamos que após análise, a sua solicitação de isenção de débitos foi deferida. Os débitos do período analisado não serão cobrados do(a) senhor(a) e o seu pedido de {servico} seguirá normalmente.',
  },
  {
    id: 'parcial',
    nome: 'Deferido parcialmente — isenção de parte do débito/período',
    titulo: 'DEFERIDA PARCIALMENTE',
    texto:
      'Informamos que após análise, a sua solicitação de isenção de débitos foi deferida parcialmente. Período/valor isento: {detalhe}. Os demais débitos permanecem sob responsabilidade do(a) solicitante para que o seu pedido de {servico} possa seguir.',
    precisaDetalhe: true,
  },
];

const minusculaInicial = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function preencher(t, d) {
  return String(t || '')
    .replace(/\{servico\}/g, d.servico)
    .replace(/\{servicoMinusculo\}/g, d.servico.toLowerCase())
    .replace(/\{documento\}/g, d.documento || 'XXXXX')
    .replace(/\{detalhe\}/g, d.detalhe || 'XXXXX');
}

function cabecalho(d) {
  // concatenação (e não template com \n): o build reindenta as linhas de templates multilinha
  return 'Caro Cliente, a Neoenergia ' + (d.distribuidora || 'XXXXX') + ' informa:\n\nSeu protocolo de atendimento é: ' + (d.protocolo || 'XXXXX') + '.';
}

// Confere os dados da resposta. Retorna a lista de erros (vazia = pode gerar).
export function respValidar(d = {}) {
  const erros = [];
  if (!['Deferido', 'Indeferido'].includes(d.resultado)) erros.push('Escolha o resultado (Deferido ou Indeferido).');
  if (!RESP_SERVICOS.includes(d.servico)) erros.push('Escolha o serviço (Troca de Titularidade ou Reativação).');
  if (!String(d.protocolo || '').trim()) erros.push('Informe o protocolo de atendimento.');
  if (!RESP_DISTRIBUIDORAS.includes(d.distribuidora)) erros.push('Escolha a distribuidora.');
  const ids = [].concat(d.motivos || []);
  if (d.resultado === 'Indeferido') {
    const motivos = RESP_INDEFERIMENTOS.filter((m) => ids.includes(m.id));
    if (!motivos.length) erros.push('Marque pelo menos um motivo do indeferimento.');
    if (motivos.some((m) => m.precisaDocumento) && !String(d.documento || '').trim()) erros.push('Informe qual documento não foi identificado.');
  }
  if (d.resultado === 'Deferido') {
    const def = RESP_DEFERIMENTOS.find((m) => m.id === ids[0]);
    if (!def) erros.push('Escolha o tipo de deferimento.');
    else if (def.precisaDetalhe && !String(d.detalhe || '').trim()) erros.push('Informe o período/valor isento no deferimento parcial.');
  }
  return erros;
}

// Monta o texto da resposta (Agenda do Contrato).
// d = { resultado, servico, distribuidora, protocolo, motivos: [ids], documento, detalhe }
export function respGerar(d = {}) {
  const dados = { ...d, servico: RESP_SERVICOS.includes(d.servico) ? d.servico : RESP_SERVICOS[0] };
  const ids = [].concat(d.motivos || []);
  const servicoTitulo = dados.servico.toUpperCase();
  if (d.resultado === 'Deferido') {
    const def = RESP_DEFERIMENTOS.find((m) => m.id === ids[0]) || RESP_DEFERIMENTOS[0];
    return 'Título: ' + servicoTitulo + ' – ISENÇÃO DE DÉBITOS ' + def.titulo + '\n\n' + cabecalho(dados) + '\n\n' + preencher(def.texto, dados);
  }
  const motivos = RESP_INDEFERIMENTOS.filter((m) => ids.includes(m.id));
  if (!motivos.length) return '';
  const titulo = `Título: ${servicoTitulo} INDEFERIDA – ${motivos.map((m) => m.titulo).join(' / ')}`;
  const partes = [titulo, cabecalho(dados)];
  if (motivos.length === 1) {
    // um motivo: exatamente o texto padrão
    partes.push(preencher(motivos[0].texto, dados));
  } else {
    // vários motivos: um parágrafo só, com a lista
    const lista = motivos.map((m, i) => `${i + 1}. ${minusculaInicial(preencher(m.item, dados))}${i === motivos.length - 1 ? '.' : ';'}`).join('\n');
    partes.push('Informamos que após análise, verificamos que:\n' + lista + '\n\nPortanto, o seu pedido de ' + dados.servico + ' não pôde ser realizado.');
  }
  // normas citadas, sem repetir
  for (const n of [...new Set(motivos.map((m) => m.norma).filter(Boolean))]) partes.push(n);
  // pedido final: um só pedido de documentação; o da fraude (aguardar a fatura) é à parte
  const pedidos = motivos.filter((m) => m.pedido && !m.pedidoProprio);
  if (pedidos.length === 1) partes.push(preencher(pedidos[0].pedido, dados));
  else if (pedidos.length > 1) partes.push(preencher(PEDIDO_DOCUMENTOS, dados));
  for (const m of motivos.filter((x) => x.pedidoProprio)) partes.push(preencher(m.pedido, dados));
  return partes.join('\n\n');
}
