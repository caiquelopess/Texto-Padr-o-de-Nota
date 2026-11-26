// Respostas da Análise de Isenção de Débitos (Troca de Titularidade ou Reativação).
// Os textos de INDEFERIMENTO são os do "Texto Padrão Lojas" (Conexão Logos), com a mesma redação.
// Motivos com validar: true não estão no PDF (redação proposta, a validar pela área).
// DEFERIMENTO não tem resposta própria: a solicitação é atendida e o serviço segue com o seu texto padrão.
// Com mais de um motivo de indeferimento, os textos são combinados em uma única resposta:
// título com todos os motivos, um só cabeçalho, a lista dos motivos, as normas citadas
// (sem repetir) e um só pedido de documentação no final.
// Regras puras (sem DOM): nenhum dado do cliente sai do navegador.

export const RESP_DISTRIBUIDORAS = ['Coelba', 'Pernambuco', 'Cosern', 'Brasília', 'Elektro'];
export const RESP_SERVICOS = ['Troca de Titularidade', 'Reativação'];

const REN_138_2021 =
  'REN 1000/2021 (Art. 138. § 1º A distribuidora pode exigir do novo titular os seguintes documentos para alterar a titularidade:\nI - Identificação do consumidor e demais usuários, conforme incisos I e II do art. 67;\nII - Apresentação de documento, com data, que comprove a propriedade ou posse do imóvel em que se localizam as instalações do consumidor e demais usuários, observado o art. 14);';
const REN_138_2024 =
  'REN 1000/2024 (Art. 138. §1º, II - apresentação de documento, com data, que comprove a propriedade ou posse do imóvel em que se localizam as instalações do consumidor e demais usuários, observado o art. 14.';

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
    norma: REN_138_2021,
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
    norma: REN_138_2024,
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
  {
    id: 'documento_ilegivel',
    nome: 'Documento ilegível, rasurado ou cortado',
    titulo: 'DOCUMENTO ILEGÍVEL',
    texto:
      'Informamos que após análise, verificamos que o documento {documento} anexado em sua solicitação está ilegível, rasurado ou incompleto, não sendo possível validar as suas informações, portanto, o seu pedido não pôde ser realizado.',
    item: 'o documento {documento} anexado em sua solicitação está ilegível, rasurado ou incompleto, não sendo possível validar as suas informações',
    norma: REN_138_2021,
    pedido: PEDIDO_DOCUMENTOS,
    precisaDocumento: true,
    validar: true,
  },
  {
    id: 'imovel_sem_data',
    nome: 'Documento do imóvel sem data ou sem os dados do solicitante',
    titulo: 'DOCUMENTO DO IMÓVEL SEM DATA OU SEM OS DADOS DO SOLICITANTE',
    texto:
      'Informamos que após análise, verificamos que o documento do imóvel apresentado não possui data ou não identifica o(a) solicitante como proprietário(a) ou possuidor(a) do imóvel, portanto, o seu pedido não pôde ser realizado.',
    item: 'o documento do imóvel apresentado não possui data ou não identifica o(a) solicitante como proprietário(a) ou possuidor(a) do imóvel',
    norma: REN_138_2024,
    pedido: PEDIDO_DOCUMENTOS,
    validar: true,
  },
  {
    id: 'nome_divergente_receita',
    nome: 'Nome divergente na Receita Federal (pendência do cliente)',
    titulo: 'PENDÊNCIA CADASTRAL – NOME DIVERGENTE NA RECEITA FEDERAL',
    texto:
      'Informamos que após análise, verificamos que o nome informado no documento de identificação está divergente do cadastro do CPF/CNPJ na Receita Federal. Trata-se de uma pendência cadastral do(a) solicitante, que impede a conclusão do seu pedido neste momento.',
    item: 'o nome informado no documento de identificação está divergente do cadastro do CPF/CNPJ na Receita Federal (pendência cadastral do(a) solicitante)',
    norma: null,
    pedido:
      'Solicitamos que regularize os seus dados junto à Receita Federal e, após a regularização, retorne a um de nossos Canais de Atendimento para que possamos prosseguir com a sua {servico}.',
    pedidoProprio: true,
    pendencia: true,
    aviso:
      'Não é um indeferimento de fato: é uma pendência do cliente na Receita Federal que impede concluir o pedido. Oriente o cliente a regularizar e retornar.',
    validar: true,
  },
  {
    id: 'debito_responsabilidade',
    nome: 'Débito de responsabilidade do solicitante',
    titulo: 'DÉBITO DE RESPONSABILIDADE DO SOLICITANTE',
    texto:
      'Informamos que após análise, verificamos que os débitos existentes na unidade consumidora são de responsabilidade do(a) solicitante, pois foi constatado que o(a) senhor(a) era o(a) usuário(a) ou responsável pelo imóvel no período em que os débitos foram gerados, portanto, a isenção de débitos não pôde ser concedida.',
    item: 'os débitos existentes na unidade consumidora são de responsabilidade do(a) solicitante, que era o(a) usuário(a) ou responsável pelo imóvel no período em que foram gerados',
    norma: null,
    pedido: 'Para prosseguir com a sua {servico}, os débitos deverão ser quitados ou negociados em um de nossos Canais de Atendimento.',
    pedidoProprio: true,
    aviso:
      'Use somente com comprovação de que, no período do débito, o solicitante era o usuário/responsável pelo imóvel: por exemplo, cadastro, contrato de locação ou compra e venda em nome dele com data dentro do período, atendimentos/protocolos anteriores feitos por ele para este imóvel, ou sucessão do mesmo negócio no local. NÃO use só porque o solicitante é parente do titular anterior, mora no imóvel hoje, ou porque a documentação de posse está faltando (nesses casos, use os motivos de documentação). Registre a comprovação na observação.',
    confirmacao: 'Confirmo que há comprovação de que o solicitante era o responsável pelo imóvel no período do débito e que ela está registrada.',
    validar: true,
  },
];

const minusculaInicial = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function preencher(t, d) {
  return String(t || '')
    .replace(/\{servico\}/g, d.servico)
    .replace(/\{servicoMinusculo\}/g, d.servico.toLowerCase())
    .replace(/\{documento\}/g, d.documento || 'XXXXX');
}

function cabecalho(d) {
  // concatenação (e não template com \n): o build reindenta as linhas de templates multilinha
  return 'Caro Cliente, a Neoenergia ' + (d.distribuidora || 'XXXXX') + ' informa:\n\nSeu protocolo de atendimento é: ' + (d.protocolo || 'XXXXX') + '.';
}

// Confere os dados da resposta. Retorna a lista de erros (vazia = pode gerar).
export function respValidar(d = {}) {
  const erros = [];
  if (!['Deferido', 'Indeferido'].includes(d.resultado)) erros.push('Escolha o resultado (Deferido ou Indeferido).');
  if (d.resultado === 'Deferido') return erros; // deferido: sem texto de resposta (o serviço segue com o texto padrão)
  if (!RESP_SERVICOS.includes(d.servico)) erros.push('Escolha o serviço (Troca de Titularidade ou Reativação).');
  if (!String(d.protocolo || '').trim()) erros.push('Informe o protocolo de atendimento.');
  if (!RESP_DISTRIBUIDORAS.includes(d.distribuidora)) erros.push('Escolha a distribuidora.');
  const ids = [].concat(d.motivos || []);
  if (d.resultado === 'Indeferido') {
    const motivos = RESP_INDEFERIMENTOS.filter((m) => ids.includes(m.id));
    if (!motivos.length) erros.push('Marque pelo menos um motivo do indeferimento.');
    if (motivos.some((m) => m.precisaDocumento) && !String(d.documento || '').trim())
      erros.push('Informe qual documento não foi identificado ou está ilegível.');
    if (motivos.some((m) => m.confirmacao) && !d.confirmado)
      erros.push('Confirme que há comprovação do débito de responsabilidade do solicitante (leia as orientações).');
  }
  return erros;
}

// Monta o texto da resposta (Agenda do Contrato).
// d = { resultado, servico, distribuidora, protocolo, motivos: [ids], documento, confirmado }
export function respGerar(d = {}) {
  const dados = { ...d, servico: RESP_SERVICOS.includes(d.servico) ? d.servico : RESP_SERVICOS[0] };
  const ids = [].concat(d.motivos || []);
  const servicoTitulo = dados.servico.toUpperCase();
  if (d.resultado !== 'Indeferido') return ''; // deferido: o serviço segue com o texto padrão
  const motivos = RESP_INDEFERIMENTOS.filter((m) => ids.includes(m.id));
  if (!motivos.length) return '';
  // só pendência do cliente (não é indeferimento de fato): o título diz "NÃO CONCLUÍDA"
  const situacao = motivos.every((m) => m.pendencia) ? 'NÃO CONCLUÍDA' : 'INDEFERIDA';
  const titulo = `Título: ${servicoTitulo} ${situacao} – ${motivos.map((m) => m.titulo).join(' / ')}`;
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
