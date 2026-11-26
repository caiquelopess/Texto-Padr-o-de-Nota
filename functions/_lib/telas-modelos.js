// Telas do gerenciamento de modelos de texto (painel administrativo).
import { MD_TIPOS } from '../../src/nucleo/modelos.mjs';
import { diferencaLinhas, resumoCampos } from './diferenca.js';
import { CATEGORIAS_PADRAO, MOSTRAR_AVANCADO, mostrarSeSimples, textoDoAviso } from './modelos-form.js';
import { pode } from './permissoes.js';
import { MODELOS_SISTEMA, RASCUNHOS_PRONTOS } from './servicos-embutidos.js';
import { data, esc, paginaAdmin } from './telas.js';

// Scripts de atendimento (falas + checklist): prontos, mas ocultos por decisão do responsável.
// Para ligar: SCRIPTS_ATIVOS = true aqui e em src/ui/23-atendimento.js.
export const SCRIPTS_ATIVOS = false;

const STATUS = { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Arquivado' };
const NOMES_TIPO = {
  texto: 'Texto',
  textoLongo: 'Texto longo',
  telefone: 'Telefone',
  email: 'E-mail',
  data: 'Data',
  numero: 'Número',
  opcao: 'Opção (lista)',
  documento: 'CPF/CNPJ',
  dataOuMes: 'Data ou mês/ano',
  dataHora: 'Data e horário',
  faturas: 'Faturas (vencimento e valor)',
  valor: 'Valor em reais',
};

const ESTILO_MODELOS = `
.filtros{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.filtros a{padding:6px 12px;border:1px solid var(--borda);border-radius:999px;color:var(--muted);text-decoration:none;font-size:13px}
.filtros a.ativo{color:var(--txt);border-color:var(--neon);background:var(--realce)}
.selo-publicado{color:var(--ok)}.selo-sistema{color:var(--neon)}.selo-arquivado{color:var(--muted)}.selo-rascunho{color:var(--aviso)}
.selo-alerta{color:var(--aviso);border-color:var(--aviso)}
.editor fieldset{border:1px solid var(--borda);border-radius:14px;padding:14px 16px;margin:0 0 16px}
.editor legend{padding:0 6px;font-weight:700;font-size:14px}
.editor textarea{width:100%;min-height:150px;padding:11px 12px;border-radius:10px;border:1px solid var(--borda);background:rgba(127,127,127,.06);color:var(--txt);font:13.5px/1.5 ui-monospace,Menlo,Consolas,monospace}
.editor td select{min-width:120px}
.campos-tabela td{padding:4px}.campos-tabela input,.campos-tabela select{padding:8px;font-size:13px;min-width:90px}
.ajuda{font-size:12.5px;color:var(--muted);line-height:1.6;margin:6px 0 0}.ajuda code{background:var(--realce);padding:1px 5px;border-radius:5px}
.botoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.botoes button{width:auto;margin:0;padding:11px 18px}
.resultado-teste{border:1px solid var(--borda);border-radius:12px;padding:12px 14px;margin:0 0 14px}
.resultado-teste pre,.diff{white-space:pre-wrap;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;margin:6px 0 0}
.diff div{padding:1px 8px;border-radius:4px}.diff .removida{background:rgba(220,38,38,.12);text-decoration:line-through}.diff .incluida{background:rgba(22,163,74,.14)}
.diff .removida::before{content:"− "}.diff .incluida::before{content:"+ "}.diff .igual::before{content:"  "}
`;

const pagina = (titulo, ativo, ctx, corpo) => paginaAdmin(titulo, ativo, ctx, `<style>${ESTILO_MODELOS}</style>${corpo}`);
const msgs = (erro, ok, avisos = []) =>
  `${erro ? `<p class="erro" role="alert">${esc(erro)}</p>` : ''}${ok ? `<p class="okmsg" role="status">${esc(ok)}</p>` : ''}${avisos.length ? `<div class="erro" role="alert"><b>Corrija antes de publicar:</b><ul>${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}`;

export function telaSemBanco({ usuario, perfil }) {
  return pagina(
    'Modelos de texto',
    'modelos',
    { usuario, perfil },
    '<h1>Modelos de texto</h1><div class="linha-neon"></div><p class="aviso">O banco D1 (binding <b>BANCO</b>) ainda não está ligado a este ambiente. O atendimento continua funcionando normalmente com os textos atuais.</p>',
  );
}

export function telaModelos({ usuario, perfil, modelos = [], filtro = 'todos', categorias = CATEGORIAS_PADRAO, erro = '', ok = '' }) {
  const contagem = (s) => modelos.filter((m) => s === 'todos' || m.status === s).length;
  const filtros = ['todos', 'publicado', 'rascunho', 'arquivado']
    .map((f) => `<a href="/admin/modelos?status=${f}" class="${f === filtro ? 'ativo' : ''}">${f === 'todos' ? 'Todos' : STATUS[f]} (${contagem(f)})</a>`)
    .join('');
  const linhas = modelos
    .filter((m) => filtro === 'todos' || m.status === filtro)
    .map(
      (
        m,
      ) => `<tr><td><a href="/admin/modelos/${esc(m.id)}" style="color:var(--neon);font-weight:600">${esc(m.nome)}</a><br><small style="color:var(--muted)">${esc(m.id)}</small></td><td>${esc(m.categoria)}</td>
<td><span class="selo selo-${m.status}">${STATUS[m.status]}</span>${m.aguardando ? ' <span class="selo selo-alerta">Aguardando publicação</span>' : ''}</td><td>${m.versao_publicada ? `v${m.versao_publicada}` : '—'}</td><td>${data(m.alterado_em)}<br><small style="color:var(--muted)">${esc(m.alterado_por || '')}</small></td></tr>`,
    )
    .join('');
  const criar = pode(perfil, 'modelos.editar')
    ? `<form method="post" action="/admin/modelos" data-carrega><input type="hidden" name="acao" value="criar"><div class="grade grade-usuario">
<div><label for="mi">Identificador</label><input id="mi" name="id" placeholder="ex.: cadastro-irrigante" pattern="[a-z0-9][a-z0-9-]{2,59}" required></div>
<div><label for="mn">Nome</label><input id="mn" name="nome" placeholder="ex.: Cadastro de Irrigante" required></div>
<div><label for="mc">Categoria</label><select id="mc" name="categoria">${categorias.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
<button type="submit">Criar rascunho</button></div></form>`
    : '';
  // modelos do sistema: originais (vêm no site) e, se houver, a personalização feita no painel
  const porId = Object.fromEntries(modelos.map((m) => [m.id, m]));
  const sistema = MODELOS_SISTEMA.slice()
    .sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((s) => {
      const p = porId[s.id];
      const situacao = !p
        ? '<span class="selo selo-sistema">Original</span>'
        : p.status === 'publicado'
          ? '<span class="selo selo-publicado">Personalizado (em uso)</span>'
          : p.status === 'arquivado'
            ? '<span class="selo selo-arquivado">Personalização arquivada · original em uso</span>'
            : '<span class="selo selo-rascunho">Personalização em rascunho · original em uso</span>';
      const acao = p
        ? `<a href="/admin/modelos/${esc(s.id)}" style="color:var(--neon)">Abrir</a>`
        : pode(perfil, 'modelos.editar')
          ? `<form method="post" action="/admin/modelos" style="display:inline"><input type="hidden" name="acao" value="personalizar"><input type="hidden" name="id" value="${esc(s.id)}"><button type="submit" class="secundario">Personalizar</button></form>`
          : '';
      const botoes = s.subtipos ? s.subtipos.botoes.map((b) => b.nome).join(' · ') : s.nome;
      return `<tr><td><b>${esc(s.nome)}</b><br><small style="color:var(--muted)">${esc(s.id)}${s.subtipos ? ` · botões: ${esc(botoes)}` : ''}</small></td><td>${esc(s.categoria)}</td><td>${situacao}</td><td>${acao}</td></tr>`;
    })
    .join('');
  // rascunhos prontos: modelos novos preparados no repositório, que só entram no atendimento depois de publicados
  const prontos = RASCUNHOS_PRONTOS.map((r) => {
    const p = porId[r.id];
    const acao = p
      ? `<a href="/admin/modelos/${esc(r.id)}" style="color:var(--neon)">Abrir</a>`
      : pode(perfil, 'modelos.editar')
        ? `<form method="post" action="/admin/modelos" style="display:inline"><input type="hidden" name="acao" value="rascunho_pronto"><input type="hidden" name="id" value="${esc(r.id)}"><button type="submit" class="secundario">Criar rascunho</button></form>`
        : '';
    const situacao = p ? `<span class="selo selo-${p.status}">${STATUS[p.status]}</span>` : '<span class="selo selo-alerta">Aguardando revisão</span>';
    return `<tr><td><b>${esc(r.nome)}</b><br><small style="color:var(--muted)">${esc(r.id)}</small></td><td>${esc(r.categoria)}</td><td>${situacao}</td><td>${acao}</td></tr>`;
  }).join('');
  const blocoProntos = prontos
    ? `<h2 style="margin-top:28px">Modelos prontos para revisar (${RASCUNHOS_PRONTOS.length})</h2>
<p class="sub">Modelos novos preparados para você revisar. <b>Criar rascunho</b> salva o modelo como rascunho: os atendentes só passam a vê-lo depois que ele for publicado.</p>
<div class="tabela-rolagem"><table><thead><tr><th>Modelo</th><th>Categoria</th><th>Situação</th><th></th></tr></thead><tbody>${prontos}</tbody></table></div>`
    : '';
  const blocoSistema = `<h2 style="margin-top:28px">Modelos do sistema (${MODELOS_SISTEMA.length})</h2>
<p class="sub">Os serviços que já vêm no site. <b>Personalizar</b> cria uma cópia em rascunho, com todas as configurações do original; os atendentes só passam a usá-la quando for publicada. Para voltar ao original, arquive a personalização.</p>
<div class="tabela-rolagem"><table><thead><tr><th>Modelo</th><th>Categoria</th><th>Situação</th><th></th></tr></thead><tbody>${sistema}</tbody></table></div>`;
  return pagina(
    'Modelos de texto',
    'modelos',
    { usuario, perfil },
    `<h1>Modelos de texto</h1><p class="sub">Rascunhos não aparecem para os atendentes: só a versão publicada. Cada publicação guarda uma versão que pode ser comparada e restaurada.</p><div class="linha-neon"></div>
${msgs(erro, ok)}${criar}<nav class="filtros">${filtros}</nav>
<div class="tabela-rolagem"><table><thead><tr><th>Modelo</th><th>Categoria</th><th>Situação</th><th>Versão em uso</th><th>Última alteração</th></tr></thead><tbody>${linhas || '<tr><td colspan="5">Nenhum modelo nesta lista.</td></tr>'}</tbody></table></div>
${blocoProntos}${blocoSistema}`,
  );
}

function linhaCampo(c = {}) {
  const tipos = MD_TIPOS.map((t) => `<option value="${t}"${t === (c.tipo || 'texto') ? ' selected' : ''}>${NOMES_TIPO[t]}</option>`).join('');
  const avancado = c.mostrarSe && !mostrarSeSimples(c.mostrarSe);
  const mostrar = avancado ? MOSTRAR_AVANCADO : c.mostrarSe ? `${c.mostrarSe.campo}=${[].concat(c.mostrarSe.igual).join('|')}` : '';
  return `<tr><td><input name="campo_id" value="${esc(c.id)}" placeholder="nome_do_campo" aria-label="Identificador do campo"></td>
<td><input name="campo_rotulo" value="${esc(c.rotulo)}" placeholder="Rótulo" aria-label="Rótulo"></td>
<td><select name="campo_tipo" aria-label="Tipo">${tipos}</select></td>
<td><select name="campo_obrigatorio" aria-label="Obrigatório"><option value="nao">Opcional</option><option value="sim"${c.obrigatorio ? ' selected' : ''}>Obrigatório</option></select></td>
<td><input name="campo_opcoes" value="${esc((c.opcoes || []).join(' | '))}" placeholder="A | B | C" aria-label="Opções"></td>
<td><input name="campo_mostrar" value="${esc(mostrar)}" placeholder="campo=Valor" aria-label="Mostrar se"${avancado ? ' readonly title="Regra combinada do modelo do sistema: é mantida ao salvar. Para trocar, apague e escreva campo=Valor."' : ''}></td></tr>`;
}

export function telaEditorModelo({
  usuario,
  perfil,
  registro,
  versoes = [],
  categorias = CATEGORIAS_PADRAO,
  erro = '',
  ok = '',
  problemas = [],
  exemplos = [],
}) {
  const m = registro.rascunho;
  const sistema = MODELOS_SISTEMA.some((x) => x.id === registro.id);
  const edita = pode(perfil, 'modelos.editar') && registro.status !== 'arquivado';
  const publica = pode(perfil, 'modelos.publicar');
  const ro = edita ? '' : ' disabled';
  const campos = [...(m.campos || []), {}, {}].map(linhaCampo).join('');
  const resultado = exemplos.length
    ? `<div class="resultado-teste"><b>Teste automático: passou ✓</b> — exemplos com dados fictícios:${exemplos
        .slice(0, 3)
        .map((e) => `<pre>${esc(e.nota || e.agenda)}</pre>`)
        .join('<hr style="border:0;border-top:1px solid var(--borda)">')}</div>`
    : '';
  const historico = versoes
    .map(
      (
        v,
      ) => `<tr><td><b>v${v.versao}</b>${v.versao === registro.versao_publicada && registro.status === 'publicado' ? ' <span class="selo selo-publicado">em uso</span>' : ''}</td><td>${data(v.publicado_em)}</td><td>${esc(v.publicado_por)}</td>
<td><a href="/admin/modelos/${esc(registro.id)}/comparar?a=${v.versao}&b=rascunho" style="color:var(--neon)">comparar com o rascunho</a>
${edita ? `<form method="post" style="display:inline"><input type="hidden" name="acao" value="usar_versao"><input type="hidden" name="versao" value="${v.versao}"><input type="hidden" name="revisao" value="${registro.revisao}"><button type="submit" class="secundario">Trazer para o rascunho</button></form>` : ''}
${publica && v.versao !== registro.versao_publicada ? `<form method="post" style="display:inline" onsubmit="return confirm('Voltar os atendentes para a versão ${v.versao}? Ela será publicada como uma versão nova.')"><input type="hidden" name="acao" value="republicar"><input type="hidden" name="versao" value="${v.versao}"><input type="hidden" name="revisao" value="${registro.revisao}"><button type="submit" class="perigo">Restaurar para os atendentes</button></form>` : ''}</td></tr>`,
    )
    .join('');
  return pagina(
    `Modelo: ${m.nome}`,
    'modelos',
    { usuario, perfil },
    `<p style="margin:0 0 6px"><a href="/admin/modelos" style="color:var(--neon);font-size:13px">← Modelos</a></p>
<h1>${esc(m.nome)}</h1><p class="sub">${sistema ? '<span class="selo selo-sistema">Modelo do sistema personalizado</span> · ' : ''}<code>${esc(registro.id)}</code> · <span class="selo selo-${registro.status}">${STATUS[registro.status]}</span> ${registro.versao_publicada ? `· em uso pelos atendentes: <b>v${registro.versao_publicada}</b>` : '· ainda não publicado'}${registro.aguardando ? ' · <span class="selo selo-alerta">Aguardando publicação</span>' : ''}</p><div class="linha-neon"></div>
${msgs(erro, ok, problemas)}${resultado}
<form method="post" class="editor" data-carrega><input type="hidden" name="revisao" value="${registro.revisao}">
<fieldset${ro}><legend>Identificação</legend><div class="grade grade-usuario">
<div><label for="en">Nome</label><input id="en" name="nome" value="${esc(m.nome)}" required></div>
<div><label for="ec">Categoria</label><select id="ec" name="categoria">${[...new Set([...categorias, m.categoria])].map((c) => `<option${c === m.categoria ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
<div><label for="ecp">Ao gerar, copiar</label><select id="ecp" name="copiar"><option value="nota">NOTA</option><option value="agenda"${m.copiar === 'agenda' ? ' selected' : ''}>AGENDA</option></select></div><span></span></div>
<label for="ed">Descrição (para os administradores)</label><input id="ed" name="descricao" value="${esc(m.descricao)}">
<label for="ea">Avisos para o atendente (um por linha)</label><textarea id="ea" name="avisos" style="min-height:70px">${esc((m.avisos || []).map(textoDoAviso).join('\n'))}</textarea>
${sistema ? '<p class="ajuda">Modelo do sistema: avisos que você não alterar mantêm a formatação original (negrito, listas, cores e "mostrar se"). Configurações avançadas que não aparecem aqui (subtipos, pendência, rótulos que mudam, ids originais) são mantidas ao salvar.</p>' : ''}</fieldset>
<fieldset${ro}><legend>Campos do formulário</legend><div class="tabela-rolagem"><table class="campos-tabela"><thead><tr><th>Identificador</th><th>Rótulo</th><th>Tipo</th><th>Obrigatório</th><th>Opções (se lista)</th><th>Mostrar se</th></tr></thead><tbody id="campos">${campos}</tbody></table></div>
${edita ? '<button type="button" class="secundario" style="width:auto" onclick="var t=document.getElementById(\'campos\');var l=t.rows[t.rows.length-1].cloneNode(true);l.querySelectorAll(\'input\').forEach(function(i){i.value=\'\'});l.querySelectorAll(\'select\').forEach(function(s){s.selectedIndex=0});t.appendChild(l)">+ Campo</button>' : ''}
<p class="ajuda">Linhas em branco são ignoradas. "Mostrar se": <code>motivo=Unificar PN</code> (várias opções: <code>motivo=A|B</code>).</p></fieldset>
<fieldset${ro}><legend>Texto</legend><label for="etn">NOTA</label><textarea id="etn" name="nota">${esc(m.nota)}</textarea>
<label for="eta">AGENDA</label><textarea id="eta" name="agenda">${esc(m.agenda)}</textarea>
<p class="ajuda">Use <code>{{campo}}</code> para o valor · <code>{{campo|maiusculas}}</code> · <code>{{campo|telefoneNota}}</code> (71-912341234) · <code>{{campo|ou:Não informado}}</code> · <code>{{campo|ponto}}</code> (ponto final) · <code>{{campo|semRS}}</code> · <code>{{campo|original}}</code> (fica como digitado na nota em maiúsculas) · filtros em sequência: <code>{{campo|maiusculas|ponto}}</code> ·
<code>{{#se campo}}</code>…<code>{{/se}}</code> (só se preenchido) · <code>{{#se campo=Valor}}</code>…<code>{{/se}}</code>. Linhas vazias são removidas no fim do texto.</p></fieldset>
${
  edita
    ? `<div class="botoes"><button type="submit" name="acao" value="salvar" class="secundario">Salvar rascunho</button><button type="submit" name="acao" value="testar" class="secundario">Testar</button>
${publica ? '<button type="submit" name="acao" value="publicar" onclick="return confirm(\'Publicar para todos os atendentes? O teste automático roda antes.\')">Testar e publicar</button>' : '<button type="submit" name="acao" value="enviar">Salvar e enviar para publicação</button>'}</div>`
    : ''
}</form>
${
  pode(perfil, 'modelos.editar')
    ? `<div class="botoes" style="margin-top:12px"><form method="post" onsubmit="var n=prompt('Identificador da cópia (letras minúsculas, números e hífen):','${esc(registro.id)}-copia');if(!n)return false;this.novo_id.value=n;"><input type="hidden" name="acao" value="duplicar"><input type="hidden" name="novo_id"><button type="submit" class="secundario">Duplicar</button></form>
${publica ? `<form method="post" onsubmit="return confirm('${registro.status === 'arquivado' ? 'Desarquivar este modelo?' : sistema ? 'Arquivar a personalização? Os atendentes voltam a usar o modelo original do sistema. Nada é apagado e dá para desarquivar.' : 'Arquivar? O modelo sai do atendimento, mas nada é apagado e dá para desarquivar.'}')"><input type="hidden" name="acao" value="${registro.status === 'arquivado' ? 'desarquivar' : 'arquivar'}"><input type="hidden" name="revisao" value="${registro.revisao}"><button type="submit" class="${registro.status === 'arquivado' ? 'secundario' : 'perigo'}">${registro.status === 'arquivado' ? 'Desarquivar' : 'Arquivar'}</button></form>` : ''}</div>`
    : ''
}
<h2 style="margin-top:26px;font-size:17px">Versões publicadas</h2>
<div class="tabela-rolagem"><table><thead><tr><th>Versão</th><th>Publicada em</th><th>Por</th><th>Ações</th></tr></thead><tbody>${historico || '<tr><td colspan="4">Ainda não publicado.</td></tr>'}</tbody></table></div>`,
  );
}

export function telaComparar({ usuario, perfil, id, rotuloA, rotuloB, a, b }) {
  const bloco = (titulo, x, y) =>
    `<h2 style="font-size:15px;margin:18px 0 4px">${titulo}</h2><div class="diff">${diferencaLinhas(x, y)
      .map((l) => `<div class="${l.tipo}">${esc(l.texto) || '&nbsp;'}</div>`)
      .join('')}</div>`;
  return pagina(
    'Comparar versões',
    'modelos',
    { usuario, perfil },
    `<p style="margin:0 0 6px"><a href="/admin/modelos/${esc(id)}" style="color:var(--neon);font-size:13px">← Voltar ao modelo</a></p>
<h1>Comparar: ${esc(rotuloA)} → ${esc(rotuloB)}</h1><p class="sub"><span style="background:rgba(220,38,38,.12);padding:0 6px">− saiu</span> <span style="background:rgba(22,163,74,.14);padding:0 6px">+ entrou</span></p><div class="linha-neon"></div>
${bloco('Nome e categoria', `${a.nome}\n${a.categoria}`, `${b.nome}\n${b.categoria}`)}${bloco('Campos', resumoCampos(a), resumoCampos(b))}${bloco('NOTA', a.nota, b.nota)}${bloco('AGENDA', a.agenda, b.agenda)}${bloco('Avisos', (a.avisos || []).join('\n'), (b.avisos || []).join('\n'))}`,
  );
}

// ---- Atendimento: categorias, serviços e scripts ----
export function telaAtendimento({ usuario, perfil, registro, doc, servicos = [], versoes = [], erro = '', ok = '', problemas = [] }) {
  const edita = pode(perfil, 'modelos.editar');
  const publica = pode(perfil, 'modelos.publicar');
  const ro = edita ? '' : ' disabled';
  const cats = (doc.categorias || []).map((c) => c.nome);
  const opcoesCat = (atual) => `<option value="">Automática</option>${cats.map((c) => `<option${c === atual ? ' selected' : ''}>${esc(c)}</option>`).join('')}`;
  const linhasServ = servicos
    .map((s) => {
      const conf = doc.servicos?.[s.id] || {};
      const sc = doc.scripts?.[s.id] || {};
      const tem = (sc.falas?.length || 0) + (sc.checklist?.length || 0);
      return `<tr><td><b>${esc(s.nome)}</b></td>
<td><select name="cat:${esc(s.id)}" aria-label="Categoria de ${esc(s.nome)}">${opcoesCat(conf.categoria)}</select></td>
<td><select name="vis:${esc(s.id)}" aria-label="Visibilidade de ${esc(s.nome)}"><option value="visivel">Visível</option><option value="oculto"${conf.oculto ? ' selected' : ''}>Oculto</option></select></td>
${SCRIPTS_ATIVOS ? '' : '<!--'}<td><details${tem ? ' open' : ''}><summary>${tem ? `Script (${tem})` : 'Adicionar script'}</summary>
<label>Falas para o atendente (uma por linha)</label><textarea name="falas:${esc(s.id)}" style="min-height:70px">${esc((sc.falas || []).join('\n'))}</textarea>
<label>Checklist antes de gerar (um item por linha)</label><textarea name="check:${esc(s.id)}" style="min-height:70px">${esc((sc.checklist || []).join('\n'))}</textarea></details></td>${SCRIPTS_ATIVOS ? '' : '-->'}</tr>`;
    })
    .join('');
  const historico = versoes
    .map(
      (
        v,
      ) => `<tr><td><b>v${v.versao}</b>${v.versao === registro.versao_publicada ? ' <span class="selo selo-publicado">em uso</span>' : ''}</td><td>${data(v.publicado_em)}</td><td>${esc(v.publicado_por)}</td>
<td><a href="/admin/atendimento/comparar?a=${v.versao}&b=rascunho" style="color:var(--neon)">comparar com o rascunho</a>
${publica && v.versao !== registro.versao_publicada ? `<form method="post" style="display:inline" onsubmit="return confirm('Voltar os atendentes para a versão ${v.versao}? Ela será publicada como uma versão nova.')"><input type="hidden" name="acao" value="republicar"><input type="hidden" name="versao" value="${v.versao}"><input type="hidden" name="revisao" value="${registro.revisao}"><button type="submit" class="perigo">Restaurar para os atendentes</button></form>` : ''}</td></tr>`,
    )
    .join('');
  return pagina(
    'Atendimento',
    'atendimento',
    { usuario, perfil },
    `<h1>Categorias e serviços</h1><p class="sub">Organize a lista de serviços dos atendentes: ordem e nome das categorias, onde cada serviço aparece e quais ficam ocultos. Como nos modelos: o rascunho não muda nada até ser publicado.
${registro.versao_publicada ? ` Em uso: <b>v${registro.versao_publicada}</b>.` : ' Ainda não publicado: os atendentes veem a organização padrão.'}${registro.aguardando ? ' <span class="selo selo-alerta">Aguardando publicação</span>' : ''}</p><div class="linha-neon"></div>
${msgs(erro, ok, problemas)}
<form method="post" class="editor" data-carrega><input type="hidden" name="revisao" value="${registro.revisao}">
<fieldset${ro}><legend>Categorias (na ordem em que aparecem)</legend><textarea name="categorias" style="min-height:150px">${esc(cats.join('\n'))}</textarea>
<p class="ajuda">Uma por linha. "Automática" nos serviços abaixo usa a categoria padrão do serviço. Modelos de texto continuam na categoria escolhida no próprio modelo.</p></fieldset>
<fieldset${ro}><legend>Serviços</legend><div class="tabela-rolagem"><table><thead><tr><th>Serviço</th><th>Categoria</th><th>Na lista</th>${SCRIPTS_ATIVOS ? '<th>Script de atendimento</th>' : ''}</tr></thead><tbody>${linhasServ}</tbody></table></div>
<p class="ajuda">Serviço oculto sai da lista e da busca, mas nada é apagado.</p></fieldset>
${
  edita
    ? `<div class="botoes"><button type="submit" name="acao" value="salvar" class="secundario">Salvar rascunho</button>${
        publica
          ? '<button type="submit" name="acao" value="publicar" onclick="return confirm(\'Publicar para todos os atendentes?\')">Validar e publicar</button>'
          : '<button type="submit" name="acao" value="enviar">Salvar e enviar para publicação</button>'
      }</div>`
    : ''
}</form>
<h2 style="margin-top:26px;font-size:17px">Versões publicadas</h2>
<div class="tabela-rolagem"><table><thead><tr><th>Versão</th><th>Publicada em</th><th>Por</th><th>Ações</th></tr></thead><tbody>${historico || '<tr><td colspan="4">Ainda não publicado.</td></tr>'}</tbody></table></div>`,
  );
}

export function telaCompararTexto({ usuario, perfil, voltar, titulo, rotuloA, rotuloB, a, b }) {
  return pagina(
    'Comparar versões',
    'atendimento',
    { usuario, perfil },
    `<p style="margin:0 0 6px"><a href="${esc(voltar)}" style="color:var(--neon);font-size:13px">← Voltar</a></p>
<h1>${esc(titulo)}: ${esc(rotuloA)} → ${esc(rotuloB)}</h1><div class="linha-neon"></div><div class="diff">${diferencaLinhas(a, b)
      .map((l) => `<div class="${l.tipo}">${esc(l.texto) || '&nbsp;'}</div>`)
      .join('')}</div>`,
  );
}

// ---- Backups ----
const MOTIVOS = { automatico: 'Automático (diário)', manual: 'Manual', 'antes-de-restaurar': 'Antes de restaurar' };
export function telaBackups({ usuario, perfil, backups = [], erro = '', ok = '', problemas = [] }) {
  const restaura = pode(perfil, 'backups.restaurar');
  const tam = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const linhas = backups
    .map(
      (
        b,
      ) => `<tr><td><b>#${b.id}</b></td><td>${data(b.criado_em)}<br><small style="color:var(--muted)">${esc(b.criado_por)}</small></td><td>${esc(MOTIVOS[b.motivo] || b.motivo)}</td>
<td>${b.resumo.modelos} modelos · ${b.resumo.versoesModelos} versões<br><small style="color:var(--muted)">${b.resumo.versoesAtendimento} versões de categorias · ${b.resumo.usuarios} perfis · ${tam(b.tamanho)}</small></td>
<td style="white-space:nowrap"><form method="post" style="display:inline"><input type="hidden" name="acao" value="validar"><input type="hidden" name="id" value="${b.id}"><button type="submit" class="secundario">Validar</button></form>
<a href="/admin/backups/${b.id}/baixar" style="color:var(--neon);margin:0 6px">baixar</a>
${restaura ? `<form method="post" style="display:inline" onsubmit="if(!confirm('Restaurar o backup #${b.id}? Modelos, versões e categorias voltam ao estado dele. Antes, um backup do estado atual é criado.'))return false;this.perfis.value=confirm('Restaurar também os perfis dos usuários (Administrador, Supervisor...)? Senhas não são alteradas.')?'1':'';"><input type="hidden" name="acao" value="restaurar"><input type="hidden" name="id" value="${b.id}"><input type="hidden" name="perfis"><button type="submit" class="perigo">Restaurar</button></form>` : ''}</td></tr>`,
    )
    .join('');
  return pagina(
    'Backups',
    'backups',
    { usuario, perfil },
    `<h1>Backups</h1><p class="sub">Cópias de modelos (com todas as versões), categorias e perfis dos usuários. <b>Senhas e dados de clientes nunca entram no backup.</b> Um backup automático é feito por dia; os ${60} mais recentes ficam guardados.</p><div class="linha-neon"></div>
${msgs(erro, ok, problemas)}
<form method="post" data-carrega><input type="hidden" name="acao" value="criar"><button type="submit" style="width:auto">Fazer backup agora</button></form>
<p class="ajuda">"Validar" confere o checksum e a estrutura de cada versão guardada. ${restaura ? 'Restaurar é feito de uma vez (tudo ou nada) e cria antes um backup do estado atual.' : 'Restaurar é exclusivo do gestor geral.'}</p>
<div class="tabela-rolagem"><table><thead><tr><th>Nº</th><th>Quando</th><th>Tipo</th><th>Conteúdo</th><th>Ações</th></tr></thead><tbody>${linhas || '<tr><td colspan="5">Nenhum backup ainda.</td></tr>'}</tbody></table></div>`,
  );
}

// ---- Configurações gerais ----
export function telaConfiguracoes({ usuario, perfil, cfg, erro = '', ok = '', problemas = [] }) {
  return pagina(
    'Configurações',
    'configuracoes',
    { usuario, perfil },
    `<h1>Configurações gerais</h1><p class="sub">Exclusivo do gestor geral. Toda alteração fica registrada na auditoria e entra nos backups.</p><div class="linha-neon"></div>
${msgs(erro, ok, problemas)}
<form method="post" class="editor" data-carrega><input type="hidden" name="revisao" value="${Number(cfg.revisao) || 0}">
<fieldset><legend>Aviso geral para os atendentes</legend>
<label for="cfa">Mensagem (vazio = sem aviso)</label><textarea id="cfa" name="avisoTexto" maxlength="300" style="min-height:70px" placeholder="Ex.: SAP fora do ar até 14h — anote os atendimentos em Pendências.">${esc(cfg.avisoTexto)}</textarea>
<div class="grade grade-usuario"><div><label for="cft">Tipo</label><select id="cft" name="avisoTipo"><option value="info">Informação</option><option value="alerta"${cfg.avisoTipo === 'alerta' ? ' selected' : ''}>Alerta</option></select></div>
<div><label for="cfd">Mostrar até (inclusive)</label><input id="cfd" name="avisoAte" type="date" value="${esc(cfg.avisoAte)}"></div><span></span><span></span></div>
<p class="ajuda">Aparece no topo do sistema para todos com login. Não coloque dados de clientes.</p></fieldset>
<fieldset><legend>Acesso</legend><div class="grade grade-usuario">
<div><label for="cfs">Duração da sessão (horas)</label><input id="cfs" name="sessaoHoras" type="number" min="1" max="24" value="${Number(cfg.sessaoHoras)}"></div>
<div><label for="cfg">Sugestões por pessoa por dia</label><input id="cfg" name="sugestoesDia" type="number" min="0" max="100" value="${Number(cfg.sugestoesDia)}"></div><span></span><span></span></div>
<p class="ajuda">A nova duração da sessão vale a partir do próximo login de cada pessoa. 0 sugestões por dia desliga o envio de sugestões.</p></fieldset>
<div class="botoes"><button type="submit">Salvar configurações</button></div></form>${cfg.alteradoEm ? `<p class="ajuda">Última alteração: ${data(cfg.alteradoEm)} por ${esc(cfg.alteradoPor)}.</p>` : ''}`,
  );
}
