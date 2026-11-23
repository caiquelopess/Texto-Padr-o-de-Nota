  // === TENSÃO DE FORNECIMENTO (Bahia — Neoenergia Coelba) ===
  // Lista completa embutida na ferramenta (418 cidades), extraída da
  // planilha oficial de tensão de fornecimento da Neoenergia Coelba.
  // Formato: [cidade, tensão]. Os valores seguem exatamente a fonte —
  // inclusive João Dourado, que consta como 220/380 na planilha.
  // As cidades ficam ocultas: só aparecem como sugestão ao digitar.
  var TENSOES_FORNECIMENTO = [
    ["Abaíra","380/220"],["Abaré","380/220"],["Acajutiba","380/220"],["Adustina","380/220"],
    ["Água Fria","380/220"],["Aiquara","220/127"],["Alagoinhas","220/127"],["Alcobaça","380/220"],
    ["Almadina","220/127"],["Amargosa","380/220"],["Amélia Rodrigues","220/127"],["América Dourada","380/220"],
    ["Anagé","380/220"],["Andaraí","380/220"],["Andorinha","380/220"],["Angical","380/220"],
    ["Anguera","220/127"],["Antas","220/127"],["Antônio Cardoso","220/127"],["Antônio Gonçalves","380/220"],
    ["Aporá","380/220"],["Apuarema","380/220"],["Araças","220/127"],["Aracatu","380/220"],
    ["Araci","380/220"],["Aramari","380/220"],["Arataca","220/127"],["Aratuípe","220/127"],
    ["Aurelino Leal","220/127"],["Baianópolis","380/220"],["Baixa Grande","380/220"],["Banzaê","380/220"],
    ["Barra","380/220"],["Barra da Estiva","380/220"],["Barra do Choça","380/220"],["Barra do Mendes","380/220"],
    ["Barra do Rocha","220/127"],["Barreiras","380/220"],["Barro Alto","380/220"],["Barro Preto","220/127"],
    ["Barrocas","380/220"],["Belmonte","220/127"],["Belo Campo","380/220"],["Biritinga","380/220"],
    ["Boa Nova","380/220"],["Boa Vista do Tupim","380/220"],["Bom Jesus da Lapa","220/127"],["Bom Jesus da Serra","380/220"],
    ["Boninal","380/220"],["Bonito","380/220"],["Boquira","220/127"],["Botuporã","380/220"],
    ["Brejões","220/127"],["Brejolândia","380/220"],["Brotas de Macaúbas","380/220"],["Brumado","380/220"],
    ["Buerarema","220/127"],["Buritirama","380/220"],["Caatiba","380/220"],["Cabaceiras do Paraguaçu","220/127"],
    ["Cachoeira","220/127"],["Caculé","380/220"],["Caém","380/220"],["Caetanos","380/220"],
    ["Caetité","380/220"],["Cafarnaum","380/220"],["Cairu","380/220"],["Caldeirão Grande","380/220"],
    ["Camacan","380/220"],["Camaçari","220/127"],["Camamu","380/220"],["Campo Alegre de Lourdes","380/220"],
    ["Campo Formoso","380/220"],["Canápolis","380/220"],["Canarana","380/220"],["Canavieiras","220/127"],
    ["Candeal","380/220"],["Candeias","220/127"],["Candiba","380/220"],["Cândido Sales","380/220"],
    ["Cansanção","380/220"],["Canudos","380/220"],["Capela do Alto Alegre","380/220"],["Capim Grosso","380/220"],
    ["Caraíbas","380/220"],["Caravelas","380/220"],["Cardeal da Silva","380/220"],["Carinhanha","380/220"],
    ["Casa Nova","380/220"],["Castro Alves","220/127"],["Catolândia","380/220"],["Catu","220/127"],
    ["Caturama","380/220"],["Central","380/220"],["Chorrochó","380/220"],["Cícero Dantas","380/220"],
    ["Cipó","220/127"],["Coaraci","220/127"],["Cocos","380/220"],["Conceição da Feira","220/127"],
    ["Conceição do Almeida","220/127"],["Conceição do Coité","380/220"],["Conceição do Jacuípe","220/127"],["Conde","380/220"],
    ["Condeúba","380/220"],["Contendas do Sincorá","380/220"],["Coração de Maria","220/127"],["Cordeiros","380/220"],
    ["Coribe","380/220"],["Coronel João Sá","220/127"],["Correntina","220/127"],["Cotegipe","380/220"],
    ["Cravolândia","220/127"],["Crisópolis","380/220"],["Cristópolis","380/220"],["Cruz das Almas","220/127"],
    ["Curaçá","380/220"],["Dário Meira","220/127"],["Delmiro Gouveia","220/127"],["Dias d`Ávila","220/127"],
    ["Dom Basílio","380/220"],["Dom Macedo Costa","380/220"],["Elísio Medrado","380/220"],["Encruzilhada","380/220"],
    ["Entre Rios","380/220"],["Érico Cardoso","380/220"],["Esplanada","380/220"],["Euclides da Cunha","380/220"],
    ["Eunápolis","220/127"],["Fátima","380/220"],["Feira da Mata","380/220"],["Feira de Santana","220/127"],
    ["Filadélfia","380/220"],["Firmino Alves","220/127"],["Floresta Azul","220/127"],["Formosa do Rio Preto","380/220"],
    ["Gandu","380/220"],["Gavião","380/220"],["Gentio do Ouro","380/220"],["Glória","380/220"],
    ["Gongogi","220/127"],["Governador Mangabeira","220/127"],["Guajeru","380/220"],["Guanambi","380/220"],
    ["Guaratinga","380/220"],["Heliópolis","380/220"],["Iaçu","380/220"],["Ibiassucê","380/220"],
    ["Ibicaraí","220/127"],["Ibicoara","380/220"],["Ibicuí","220/127"],["Ibipeba","380/220"],
    ["Ibipitanga","380/220"],["Ibiquera","380/220"],["Ibirapitanga","220/127"],["Ibirapuã","380/220"],
    ["Ibirataia","220/127"],["Ibitiara","380/220"],["Ibititá","380/220"],["Ibotirama","380/220"],
    ["Ichu","380/220"],["Igaporã","380/220"],["Igrapiúna","380/220"],["Iguaí","220/127"],
    ["Ilhéus","220/127"],["Inhambupe","380/220"],["Ipecaetá","220/127"],["Ipiaú","220/127"],
    ["Ipirá","380/220"],["Ipupiara","380/220"],["Irajuba","380/220"],["Iramaia","380/220"],
    ["Iraquara","380/220"],["Irará","220/127"],["Irecê","380/220"],["Itabela","380/220"],
    ["Itaberaba","380/220"],["Itabuna","220/127"],["Itacaré","220/127"],["Itaeté","380/220"],
    ["Itagi","220/127"],["Itagibá","220/127"],["Itagimirim","380/220"],["Itaguaçu da Bahia","380/220"],
    ["Itaju do Colônia","220/127"],["Itajuípe","220/127"],["Itamaraju","380/220"],["Itamari","380/220"],
    ["Itambé","380/220"],["Itanagra","220/127"],["Itanhém","380/220"],["Itaparica","220/127"],
    ["Itapé","220/127"],["Itapebi","380/220"],["Itapetinga","380/220"],["Itapicuru","380/220"],
    ["Itapitanga","220/127"],["Itaquara","220/127"],["Itarantim","380/220"],["Itatim","380/220"],
    ["Itiruçu","220/127"],["Itiúba","380/220"],["Itororó","220/127"],["Ituaçu","380/220"],
    ["Ituberá","380/220"],["Iuiú","380/220"],["Jaborandi","380/220"],["Jacaraci","380/220"],
    ["Jacobina","380/220"],["Jaguaquara","220/127"],["Jaguarari","380/220"],["Jaguaripe","380/220"],
    ["Jandaíra","380/220"],["Jequié","380/220"],["Jeremoabo","380/220"],["Jiquiriçá","220/127"],
    ["Jitaúna","220/127"],["João Dourado","220/380"],["Juazeiro","380/220"],["Jucuruçu","380/220"],
    ["Jussara","380/220"],["Jussari","220/127"],["Jussiape","380/220"],["Lafaiete Coutinho","380/220"],
    ["Lagoa Real","380/220"],["Laje","380/220"],["Lajedão","380/220"],["Lajedinho","380/220"],
    ["Lajedo do Tabocal","380/220"],["Lamarão","380/220"],["Lapão","380/220"],["Lauro de Freitas","220/127"],
    ["Lençóis","380/220"],["Licínio de Almeida","380/220"],["Livramento de Nossa Senhora","380/220"],["Luís Eduardo Magalhães","380/220"],
    ["Macajuba","380/220"],["Macarani","380/220"],["Macaúbas","220/127"],["Macururé","380/220"],
    ["Madre de Deus","220/127"],["Maetinga","380/220"],["Maiquinique","380/220"],["Mairi","380/220"],
    ["Malhada","380/220"],["Malhada de Pedras","380/220"],["Manoel Vitorino","380/220"],["Mansidão","380/220"],
    ["Maracás","380/220"],["Maragogipe","220/127"],["Maraú","380/220"],["Marcionílio Souza","380/220"],
    ["Mascote","380/220"],["Mata de São João","220/127"],["Matina","380/220"],["Medeiros Neto","380/220"],
    ["Miguel Calmon","380/220"],["Milagres","380/220"],["Mirangaba","380/220"],["Mirante","380/220"],
    ["Monte Santo","380/220"],["Morpará","380/220"],["Morro do Chapéu","380/220"],["Mortugaba","380/220"],
    ["Mucugê","380/220"],["Mucuri","380/220"],["Mulungu do Morro","380/220"],["Mundo Novo","380/220"],
    ["Muniz Ferreira","220/127"],["Muquém de São Francisco","380/220"],["Muritiba","220/127"],["Mutuípe","380/220"],
    ["Nazaré","220/127"],["Nilo Peçanha","380/220"],["Nordestina","380/220"],["Nova Canaã","220/127"],
    ["Nova Fátima","380/220"],["Nova Ibiá","380/220"],["Nova Itarana","220/127"],["Nova Redenção","380/220"],
    ["Nova Soure","380/220"],["Nova Viçosa","380/220"],["Novo Horizonte","380/220"],["Novo Triunfo","220/127"],
    ["Olindina","380/220"],["Oliveira dos Brejinhos","380/220"],["Ouriçangas","380/220"],["Ourolândia","380/220"],
    ["Palmas de Monte Alto","380/220"],["Palmeiras","380/220"],["Paramirim","380/220"],["Paratinga","380/220"],
    ["Paripiranga","220/127"],["Pau Brasil","380/220"],["Paulo Afonso","220/127"],["Pé de Serra","380/220"],
    ["Pedrão","380/220"],["Pedro Alexandre","220/127"],["Piatã","380/220"],["Pilão Arcado","380/220"],
    ["Pindaí","380/220"],["Pindobaçu","380/220"],["Pintadas","380/220"],["Piraí do Norte","380/220"],
    ["Piripá","380/220"],["Piritiba","380/220"],["Planaltino","380/220"],["Planalto","380/220"],
    ["Poções","380/220"],["Pojuca","220/127"],["Ponto Novo","380/220"],["Porto Seguro","380/220"],
    ["Potiraguá","380/220"],["Prado","380/220"],["Presidente Dutra","380/220"],["Presidente Jânio Quadros","380/220"],
    ["Presidente Tancredo Neves","380/220"],["Queimadas","380/220"],["Quijingue","380/220"],["Quixabeira","380/220"],
    ["Rafael Jambeiro","220/127"],["Remanso","380/220"],["Retirolândia","380/220"],["Riachão das Neves","380/220"],
    ["Riachão do Jacuípe","380/220"],["Riacho de Santana","380/220"],["Ribeira do Amparo","380/220"],["Ribeira do Pombal","220/127"],
    ["Ribeirão do Largo","380/220"],["Rio de Contas","380/220"],["Rio do Antônio","380/220"],["Rio do Pires","380/220"],
    ["Rio Real","220/127"],["Rodelas","380/220"],["Ruy Barbosa","380/220"],["Salinas da Margarida","220/127"],
    ["Salvador","220/127"],["Santa Bárbara","380/220"],["Santa Brígida","380/220"],["Santa Cruz Cabrália","380/220"],
    ["Santa Cruz da Vitória","220/127"],["Santa Inês","220/127"],["Santa Luzia","380/220"],["Santa Maria da Vitória","380/220"],
    ["Santa Rita de Cássia","380/220"],["Santa Teresinha","380/220"],["Santaluz","220/127"],["Santana","220/127"],
    ["Santanópolis","220/127"],["Santo Amaro","220/127"],["Santo Antônio de Jesus","220/127"],["Santo Estêvão","220/127"],
    ["São Desidério","380/220"],["São Domingos","380/220"],["São Felipe","220/127"],["São Félix","220/127"],
    ["São Félix do Coribe","220/127"],["São Francisco do Conde","220/127"],["São Gabriel","380/220"],["São Gonçalo dos Campos","220/127"],
    ["São José da Vitória","220/127"],["São José do Jacuípe","380/220"],["São Miguel das Matas","380/220"],["São Sebastião do Passé","220/127"],
    ["Sapeaçu","220/127"],["Sátiro Dias","380/220"],["Saubara","220/127"],["Saúde","380/220"],
    ["Seabra","380/220"],["Sebastião Laranjeiras","380/220"],["Senhor do Bonfim","380/220"],["Sento Sé","380/220"],
    ["Serra do Ramalho","220/127"],["Serra Dourada","380/220"],["Serra Preta","220/127"],["Serrinha","380/220"],
    ["Serrolândia","380/220"],["Simões Filho","220/127"],["Sítio do Mato","380/220"],["Sítio do Quinto","220/127"],
    ["Sobradinho","380/220"],["Souto Soares","380/220"],["Tabocas do Brejo Velho","380/220"],["Tanhaçu","380/220"],
    ["Tanque Novo","380/220"],["Tanquinho","380/220"],["Taperoá","380/220"],["Tapiramutá","380/220"],
    ["Teixeira de Freitas","380/220"],["Teodoro Sampaio","220/127"],["Teofilândia","380/220"],["Teolândia","380/220"],
    ["Terra Nova","220/127"],["Tremedal","380/220"],["Tucano","380/220"],["Uauá","380/220"],
    ["Ubaíra","220/127"],["Ubaitaba","220/127"],["Ubatã","380/220"],["Uibaí","380/220"],
    ["Umburanas","380/220"],["Una","380/220"],["Urandi","380/220"],["Uruçuca","220/127"],
    ["Utinga","380/220"],["Valença","380/220"],["Valente","380/220"],["Várzea da Roça","380/220"],
    ["Várzea do Poço","380/220"],["Várzea Nova","380/220"],["Varzedo","220/127"],["Vera Cruz","220/127"],
    ["Vereda","380/220"],["Vitória da Conquista","380/220"],["Wagner","380/220"],["Wanderley","380/220"],
    ["Wenceslau Guimarães","380/220"],["Xique-Xique","380/220"]
  ];

  var tensaoSugDestaque = -1;
  function fecharSugestoesCidade(){
    var caixa = document.getElementById('tensao_sugestoes');
    var inp = document.getElementById('busca_cidade');
    if (caixa) { caixa.classList.remove('aberta'); caixa.innerHTML = ''; }
    if (inp) inp.setAttribute('aria-expanded', 'false');
    tensaoSugDestaque = -1;
  }
  function letraTensao(tensao){
    var direita = String(tensao).split('/')[1];
    if (direita === '127') return 'Y';
    if (direita === '220') return 'X';
    return '';
  }
  function exibirResultadoTensao(item){
    var res = document.getElementById('tensao_resultado');
    var nao = document.getElementById('tensao_nao_encontrada');
    if (nao) nao.style.display = 'none';
    if (!res) return;
    var letra = letraTensao(item[1]);
    document.getElementById('tensao_result_cidade').textContent = item[0];
    document.getElementById('tensao_result_valor').textContent = item[1] + (letra ? ' | ' + letra : '');
    res.style.display = '';
  }
  function exibirCidadeNaoEncontrada(){
    var res = document.getElementById('tensao_resultado');
    var nao = document.getElementById('tensao_nao_encontrada');
    if (res) res.style.display = 'none';
    if (nao) nao.style.display = 'block';
  }
  function filtrarCidades(){
    var inp = document.getElementById('busca_cidade');
    var caixa = document.getElementById('tensao_sugestoes');
    if (!inp || !caixa) return;
    var termo = normalizarTxt(inp.value.trim());
    if (!termo) { fecharSugestoesCidade(); return; }
    var prefixo = [], contem = [];
    for (var j=0;j<TENSOES_FORNECIMENTO.length;j++){
      var nn = normalizarTxt(TENSOES_FORNECIMENTO[j][0]);
      if (nn.indexOf(termo) === 0) prefixo.push(j);
      else if (nn.indexOf(termo) !== -1) contem.push(j);
    }
    var achados = prefixo.concat(contem).slice(0, 10);
    caixa.innerHTML = '';
    tensaoSugDestaque = -1;
    if (!achados.length){
      var vazio = document.createElement('div');
      vazio.className = 'sug-vazia';
      vazio.textContent = 'Nenhuma cidade encontrada. Tente outro nome.';
      caixa.appendChild(vazio);
    } else {
      achados.forEach(function(idx){
        var item = TENSOES_FORNECIMENTO[idx];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sug-item';
        b.setAttribute('role', 'option');
        b.setAttribute('data-click', 'selecionarCidadeTensao(' + idx + ')');
        b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span></span>';
        b.querySelector('span').textContent = item[0];
        caixa.appendChild(b);
      });
    }
    caixa.classList.add('aberta');
    inp.setAttribute('aria-expanded', 'true');
  }
  function selecionarCidadeTensao(idx){
    var item = TENSOES_FORNECIMENTO[parseInt(idx, 10)];
    if (!item) return;
    var inp = document.getElementById('busca_cidade');
    if (inp) inp.value = item[0];
    fecharSugestoesCidade();
    exibirResultadoTensao(item);
  }
  function buscarCidade(){
    var inp = document.getElementById('busca_cidade');
    if (!inp) return;
    var termo = normalizarTxt(inp.value.trim());
    fecharSugestoesCidade();
    if (!termo) { mostrarAviso('Digite o nome da cidade para consultar a tensão de fornecimento.'); return; }
    var i, nn;
    for (i=0;i<TENSOES_FORNECIMENTO.length;i++){
      nn = normalizarTxt(TENSOES_FORNECIMENTO[i][0]);
      if (nn === termo) { exibirResultadoTensao(TENSOES_FORNECIMENTO[i]); return; }
    }
    for (i=0;i<TENSOES_FORNECIMENTO.length;i++){
      nn = normalizarTxt(TENSOES_FORNECIMENTO[i][0]);
      if (nn.indexOf(termo) === 0) { exibirResultadoTensao(TENSOES_FORNECIMENTO[i]); return; }
    }
    exibirCidadeNaoEncontrada();
  }

  filtrarServicos();

  // Temas: cada um combina o modo base (escuro/claro) com uma paleta.
  // A escolha fica salva neste computador. 'dark'/'light' (versões antigas)
  // viram Neon Escuro / Neon Claro.
  var TEMAS = [
    { id: 'neon-escuro',     nome: 'Neon Escuro',      base: 'dark',  paleta: '',                fundo: '#05060D', cor: '#22E5FF' },
    { id: 'neon-claro',      nome: 'Neon Claro',       base: 'light', paleta: '',                fundo: '#F4F6FB', cor: '#0891B2' },
    { id: 'preto-vermelho',  nome: 'Preto e Vermelho', base: 'dark',  paleta: 'preto-vermelho',  fundo: '#070505', cor: '#FF3B47' },
    { id: 'branco-vermelho', nome: 'Branco e Vermelho',base: 'light', paleta: 'branco-vermelho', fundo: '#FBF7F7', cor: '#D61F2C' },
    { id: 'preto-azul',      nome: 'Preto e Azul',     base: 'dark',  paleta: 'preto-azul',      fundo: '#04060C', cor: '#3B9CFF' },
    { id: 'branco-azul',     nome: 'Branco e Azul',    base: 'light', paleta: 'branco-azul',     fundo: '#F5F8FD', cor: '#1D4ED8' },
    { id: 'preto-verde',     nome: 'Preto e Verde',    base: 'dark',  paleta: 'preto-verde',     fundo: '#030805', cor: '#2BE07A' },
    { id: 'branco-verde',    nome: 'Branco e Verde',   base: 'light', paleta: 'branco-verde',    fundo: '#F5FAF6', cor: '#15803D' },
    { id: 'sepia',           nome: 'Sépia / Papel',    base: 'light', paleta: 'sepia',           fundo: '#F3EAD7', cor: '#8A5A2B' },
    { id: 'ardosia',         nome: 'Ardósia',          base: 'dark',  paleta: 'ardosia',         fundo: '#1B222C', cor: '#93B4D6' },
    { id: 'logos',           nome: 'Logos Executive',  base: 'dark',  paleta: 'logos',           fundo: '#0D0E12', cor: '#E8174E' },
    { id: 'contraste',       nome: 'Alto Contraste',   base: 'dark',  paleta: 'contraste',       fundo: '#000000', cor: '#FFE600' }
  ];
  var temaAtual = 'neon-escuro';
  function acharTema(id) { for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === id) return TEMAS[i]; return TEMAS[0]; }

  function aplicarTema(id) {
    if (id === 'dark') id = 'neon-escuro';
    if (id === 'light') id = 'neon-claro';
    var t = acharTema(id);
    temaAtual = t.id;
    var raiz = document.documentElement;
    raiz.setAttribute('data-theme', t.base);
    if (t.paleta) raiz.setAttribute('data-paleta', t.paleta); else raiz.removeAttribute('data-paleta');
    raiz.style.colorScheme = t.base;
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', t.base);
    var lbl = document.getElementById('lbl_tema');
    if (lbl) lbl.textContent = t.nome;
    document.querySelectorAll('.tema-opcao').forEach(function(b) {
      var on = b.getAttribute('data-tema') === t.id;
      b.classList.toggle('ativo', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function escolherTema(id) {
    aplicarTema(id);
    try { localStorage.setItem('tp_tema', temaAtual); } catch (e) {}
    fecharTemas();
  }
  function montarMenuTemas() {
    var menu = document.getElementById('tema_menu');
    if (!menu || menu.childNodes.length) return;
    var tit = document.createElement('div'); tit.className = 'tema-menu-titulo'; tit.textContent = 'Escolha o tema'; menu.appendChild(tit);
    TEMAS.forEach(function(t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tema-opcao'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('data-tema', t.id);
      b.setAttribute('data-click', "escolherTema('" + t.id + "')");
      var sw = document.createElement('span'); sw.className = 'tema-amostra';
      sw.style.background = t.fundo; sw.style.setProperty('--amostra-cor', t.cor);
      var nm = document.createElement('span'); nm.textContent = t.nome;
      b.appendChild(sw); b.appendChild(nm); menu.appendChild(b);
    });
    aplicarTema(temaAtual);
  }
  function abrirTemas() {
    var menu = document.getElementById('tema_menu'), btn = document.getElementById('btn_tema');
    if (!menu) return;
    montarMenuTemas();
    var abrir = menu.style.display === 'none';
    menu.style.display = abrir ? 'grid' : 'none';
    if (btn) btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) { var at = menu.querySelector('.tema-opcao.ativo') || menu.querySelector('.tema-opcao'); if (at) at.focus(); }
  }
  function fecharTemas() {
    var menu = document.getElementById('tema_menu'), btn = document.getElementById('btn_tema');
    if (menu) menu.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  // compatibilidade: versões antigas chamavam alternarTema
  function alternarTema() { abrirTemas(); }
  document.addEventListener('click', function(ev) {
    var wrap = document.querySelector('.tema-wrap');
    if (wrap && !wrap.contains(ev.target)) fecharTemas();
  });
  document.addEventListener('keydown', function(ev) { if (ev.key === 'Escape') fecharTemas(); });
  (function() {
    var salvo = null;
    try { salvo = localStorage.getItem('tp_tema'); } catch (e) {}
    aplicarTema(salvo || 'neon-escuro');
  })();

  var servicosVisiveis = false;
  function alternarServicos(btn){
    servicosVisiveis = !servicosVisiveis;
    var painel = document.getElementById('painel_servicos');
    if (painel) painel.style.display = servicosVisiveis ? '' : 'none';
    if (btn) {
      btn.setAttribute('aria-expanded', servicosVisiveis ? 'true' : 'false');
      btn.classList.toggle('fechado', !servicosVisiveis);
      var lbl = btn.querySelector('.nav-toggle-label');
      if (lbl) lbl.textContent = servicosVisiveis ? 'Ocultar serviços' : 'Exibir serviços';
    }
  }

