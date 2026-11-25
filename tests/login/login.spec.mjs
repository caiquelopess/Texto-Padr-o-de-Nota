import { expect, test } from '@playwright/test';

const entrar = async (page, usuario, senha, destino = '/') => {
  await page.goto(`/entrar?destino=${encodeURIComponent(destino)}`);
  await page.fill('#usuario', usuario);
  await page.fill('#senha', senha);
  await page.click('button[type=submit]');
};
// primeiro acesso com senha provisória: o sistema obriga a criar a própria senha
const primeiroAcesso = async (page, usuario, provisoria, nova) => {
  await entrar(page, usuario, provisoria);
  await expect(page).toHaveURL(/\/trocar-senha$/);
  await page.fill('#atual', provisoria);
  await page.fill('#nova', nova);
  await page.fill('#confirma', nova);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('http://localhost:8788/');
};
const noSistema = (page) => expect(page.locator('#service_nav')).toBeAttached();
const criar = async (page, usuario, senha) => {
  await page.goto('/admin');
  await page.fill('#nu', usuario);
  await page.fill('#ns', senha);
  await page.click('form[data-carrega] button[type=submit]');
};

test.describe.configure({ mode: 'serial' });

test('sem login nada é entregue; tela mostra o aviso de senha', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/entrar\?destino=%2F$/);
  await expect(page.locator('.aviso')).toContainText('Não use sua senha real de acesso aos sistemas corporativos');
  expect((await request.get('/teste/', { maxRedirects: 0 })).status()).toBe(303);
  expect((await request.get('/versao.json')).status()).toBe(401);
});

test('senha errada é recusada e não diz se o usuário existe', async ({ page }) => {
  await entrar(page, 'admin.teste', 'errada');
  await expect(page.locator('.erro')).toHaveText('Usuário ou senha incorretos.');
  await entrar(page, 'ninguem.aqui', 'errada');
  await expect(page.locator('.erro')).toHaveText('Usuário ou senha incorretos.');
});

test('primeiro acesso do administrador e criação de usuários', async ({ page }) => {
  await entrar(page, 'Admin.Teste', 'senha-admin-teste');
  await noSistema(page);
  await criar(page, 'Maria Silva', '1234');
  await expect(page.locator('.erro')).toContainText('padrão nome.sobrenome');
  await criar(page, 'maria.silva', '123');
  expect(await page.$eval('#ns', (e) => e.validity.tooShort)).toBe(true); // o navegador já barra
  const curta = await page.request.post('/admin', { form: { acao: 'criar', usuario: 'maria.silva', senha: '123' } });
  expect(await curta.text()).toContain('mínimo 4'); // e o servidor também
  await criar(page, 'maria.silva', '1234');
  await expect(page.locator('.okmsg')).toHaveText('Usuário maria.silva criado.');
  await criar(page, 'joão.souza', 'a!b@');
  await expect(page.locator('.okmsg')).toHaveText('Usuário joao.souza criado.');
  await criar(page, 'maria.silva', '9999');
  await expect(page.locator('.erro')).toHaveText('O usuário maria.silva já existe.');
  await expect(page.locator('tbody tr')).toHaveCount(3);
});

test('primeiro acesso: obriga a trocar a senha provisória antes de usar o sistema', async ({ page }) => {
  await entrar(page, 'maria.silva', '1234', '/teste/');
  await expect(page).toHaveURL(/\/trocar-senha$/);
  await expect(page.locator('h1')).toHaveText('Crie sua senha');
  await expect(page.locator('.aviso').first()).toContainText('senha provisória');
  // nada mais abre até trocar
  expect((await page.request.get('/api/sessao')).status()).toBe(403);
  await page.goto('/teste/');
  await expect(page).toHaveURL(/\/trocar-senha$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/trocar-senha$/);
  // a nova senha não pode ser igual à provisória
  await page.fill('#atual', '1234');
  await page.fill('#nova', '1234');
  await page.fill('#confirma', '1234');
  await page.click('button[type=submit]');
  await expect(page.locator('.erro')).toContainText('diferente da senha atual');
  await page.fill('#atual', '1234');
  await page.fill('#nova', 'minha1');
  await page.fill('#confirma', 'minha1');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('http://localhost:8788/');
  await noSistema(page);
});

test('atendente entra, volta para a página pedida e não acessa a administração', async ({ page }) => {
  await entrar(page, 'maria.silva', 'minha1', '/teste/');
  await expect(page).toHaveURL(/\/teste\/$/);
  await noSistema(page);
  expect((await page.request.get('/versao.json')).status()).toBe(200);
  expect((await page.goto('/admin')).status()).toBe(403);
  const sessao = await (await page.request.get('/api/sessao')).json();
  expect(sessao).toEqual({ usuario: 'maria.silva', perfil: 'atendente', admin: false, gestor: false });
});

test('não redireciona para fora do site depois do login', async ({ page }) => {
  await entrar(page, 'maria.silva', 'minha1', '//site-malicioso.com');
  await expect(page).toHaveURL('http://localhost:8788/');
});

test('trocar a própria senha', async ({ page }) => {
  await entrar(page, 'maria.silva', 'minha1');
  await page.goto('/trocar-senha');
  await page.fill('#atual', 'minha1');
  await page.fill('#nova', 'nova1');
  await page.fill('#confirma', 'nova2');
  await page.click('button[type=submit]');
  await expect(page.locator('.erro')).toContainText('não é igual');
  await page.fill('#atual', 'minha1');
  await page.fill('#nova', 'nova1');
  await page.fill('#confirma', 'nova1');
  await page.click('button[type=submit]');
  await expect(page.locator('.okmsg')).toHaveText('Senha alterada.');
  await page.goto('/');
  await noSistema(page);
  await page.goto('/sair');
  await entrar(page, 'maria.silva', 'minha1');
  await expect(page.locator('.erro')).toBeVisible();
  await entrar(page, 'maria.silva', 'nova1');
  await noSistema(page);
});

test('redefinir senha e desativar derrubam a sessão aberta do atendente', async ({ browser }) => {
  const atendente = await browser.newPage();
  await primeiroAcesso(atendente, 'joao.souza', 'a!b@', 'joao1');
  await noSistema(atendente);
  const adm = await browser.newPage();
  await entrar(adm, 'admin.teste', 'senha-admin-teste');
  await adm.goto('/admin');
  adm.once('dialog', (d) => d.accept('prov1'));
  await adm.locator('tr', { hasText: 'joao.souza' }).getByRole('button', { name: 'Redefinir senha' }).click();
  await expect(adm.locator('.okmsg')).toContainText('Senha de joao.souza redefinida');
  await atendente.goto('/');
  await expect(atendente).toHaveURL(/\/entrar/);
  // senha redefinida também é provisória: troca obrigatória de novo
  await primeiroAcesso(atendente, 'joao.souza', 'prov1', 'joao2');
  await noSistema(atendente);
  await adm.locator('tr', { hasText: 'joao.souza' }).getByRole('button', { name: 'Desativar' }).click();
  await expect(adm.locator('.okmsg')).toHaveText('Usuário joao.souza desativado.');
  await atendente.goto('/');
  await expect(atendente).toHaveURL(/\/entrar/);
  await entrar(atendente, 'joao.souza', 'joao2');
  await expect(atendente.locator('.erro')).toContainText('desativado');
});

test('bloqueio após 5 senhas erradas', async ({ page }) => {
  for (let i = 0; i < 5; i++) await entrar(page, 'maria.silva', `errada${i}`);
  await entrar(page, 'maria.silva', 'nova1');
  await expect(page.locator('.erro')).toContainText('Muitas tentativas');
});

test('formulário vindo de outro site é recusado', async ({ request }) => {
  const r = await request.post('/entrar', {
    form: { usuario: 'admin.teste', senha: 'senha-admin-teste' },
    headers: { origin: 'https://site-malicioso.com' },
    maxRedirects: 0,
  });
  expect(r.status()).toBe(403);
});

test('administrador envia formulário; atendente encontra, vê e baixa', async ({ page, request }) => {
  expect((await request.get('/api/formularios')).status()).toBe(401);
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await noSistema(page);
  await page.goto('/admin/formularios');
  await page.fill('#fn', 'Declaração de Residência');
  await page.setInputFiles('#fa', { name: 'falso.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>não é pdf</html>') });
  await page.click('form[data-carrega] button[type=submit]');
  await expect(page.locator('.erro')).toContainText('Só são aceitos PDF, PNG ou JPG');
  await page.fill('#fn', 'Declaração de Residência');
  await page.setInputFiles('#fa', 'tests/support/formulario-exemplo.pdf');
  await page.click('form[data-carrega] button[type=submit]');
  await expect(page.locator('.okmsg')).toContainText('enviado');

  const lista = await (await page.request.get('/api/formularios')).json();
  expect(lista.map((f) => f.nome)).toEqual(['Declaração de Residência']);
  const arq = await page.request.get(`/api/formularios/${lista[0].id}?baixar=1`);
  expect(arq.headers()['content-type']).toBe('application/pdf');
  expect(arq.headers()['content-disposition']).toBe('attachment; filename="declaracao-de-residencia.pdf"');

  await page.goto('/');
  await page.click('[data-aba="form"]');
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/*', (r) =>
    r.fulfill({ path: `node_modules/pdfjs-dist/build/${r.request().url().split('/').pop()}`, contentType: 'text/javascript' }),
  );
  await page.fill('#busca_form', 'resid');
  await expect(page.locator('#form_previa canvas')).toHaveCount(1);

  await page.goto('/admin/formularios');
  page.once('dialog', (d) => d.accept());
  await page.click('button.perigo');
  await expect(page.locator('.okmsg')).toHaveText('Formulário removido.');
});

test('menu do usuário no topo reúne as opções da conta', async ({ page }) => {
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await noSistema(page);
  await expect(page.locator('#btn_usuario')).toContainText('admin.teste');
  await expect(page.locator('.menu-usuario-lista')).toBeHidden();
  await page.click('#btn_usuario');
  await expect(page.locator('.menu-usuario-lista a')).toHaveText(['Painel administrativo', 'Trocar senha', 'Sair']);
  await expect(page.locator('#btn_usuario_tema')).toContainText('Tema');
  await page.click('#btn_usuario_tema');
  await expect(page.locator('#tema_menu')).toBeVisible();
  await expect(page.locator('.menu-usuario-lista')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tema_menu')).toBeHidden();
  await page.click('#btn_usuario');
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu-usuario-lista')).toBeHidden();
});

test('atendente envia sugestão pelo menu; responsável lê e conclui', async ({ page }) => {
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await noSistema(page);
  await page.click('#btn_usuario');
  await page.click('#btn_usuario_sugestao');
  await expect(page.locator('#sug_overlay')).toBeVisible();
  await page.fill('#sug_texto', 'oi');
  await page.click('#btn_sug_enviar');
  await expect(page.locator('#sug_status')).toContainText('mínimo 5');
  await page.evaluate(() => {
    document.getElementById('sug_tipo').value = 'Novo serviço ou formulário';
  });
  await page.fill('#sug_texto', 'Incluir o serviço de Cadastro de Irrigante');
  await page.click('#btn_sug_enviar');
  await expect(page.locator('#sug_status')).toHaveText('Enviada. Obrigado!');
  await expect(page.locator('#sug_overlay')).toBeHidden();
  await page.goto('/admin/sugestoes');
  await expect(page.locator('tbody')).toContainText('Incluir o serviço de Cadastro de Irrigante');
  await expect(page.locator('tbody')).toContainText('Novo serviço ou formulário');
  // "Concluída" não apaga: vai para a aba Concluídas e dá para reabrir
  await page.getByRole('button', { name: 'Concluída' }).click();
  await expect(page.locator('.okmsg')).toContainText('concluída');
  await expect(page.locator('tbody')).toContainText('Nenhuma sugestão pendente');
  await page.click('a.aba >> text=Concluídas');
  await expect(page.locator('tbody')).toContainText('Incluir o serviço de Cadastro de Irrigante');
  await expect(page.locator('tbody')).toContainText('Concluída em');
  await page.getByRole('button', { name: 'Reabrir' }).click();
  await expect(page.locator('.okmsg')).toHaveText('Sugestão reaberta.');
  await expect(page.locator('tbody')).toContainText('Incluir o serviço de Cadastro de Irrigante');
  // excluir pede confirmação; cancelando, nada muda
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.locator('tbody')).toContainText('Incluir o serviço de Cadastro de Irrigante');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.locator('.okmsg')).toHaveText('Sugestão excluída.');
  await expect(page.locator('tbody')).toContainText('Nenhuma sugestão pendente');
  await page.goto('/admin/auditoria');
  await expect(page.locator('tbody')).toContainText('Excluiu a sugestão');
  await expect(page.locator('tbody')).toContainText('Reabriu a sugestão');
  await expect(page.locator('tbody')).toContainText('Concluiu a sugestão');
});

test('gestor geral é protegido e só ele vê as sugestões', async ({ page, browser }) => {
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await criar(page, 'outro.admin', 'senha-outro');
  // marca como admin pelo formulário de criação não é possível depois; cria um admin novo
  await page.goto('/admin');
  await page.fill('#nu', 'chefe.equipe');
  await page.fill('#ns', 'senha-chefe');
  await page.selectOption('#np', 'administrador');
  await page.click('form[data-carrega] button[type=submit]');
  await expect(page.locator('tbody')).toContainText('(gestor geral)');

  const ctx = await browser.newContext({ baseURL: 'http://localhost:8788' });
  const outro = await ctx.newPage();
  await primeiroAcesso(outro, 'chefe.equipe', 'senha-chefe', 'chefe-nova');
  await outro.goto('/admin');
  const linhaGestor = outro.locator('tr', { has: outro.locator('td:first-child', { hasText: 'admin.teste' }) });
  await expect(linhaGestor).toContainText('protegido');
  await expect(linhaGestor.locator('button')).toHaveCount(0);
  // mesmo forçando o pedido, o servidor recusa
  const r = await outro.request.post('/admin', { form: { acao: 'remover', usuario: 'admin.teste' }, headers: { origin: 'http://localhost:8788' } });
  expect(await r.text()).toContain('não pode ser alterado por outros administradores');
  expect((await outro.request.get('/admin/sugestoes')).status()).toBe(403);
  await expect(outro.locator('a[href="/admin/sugestoes"]')).toHaveCount(0);
  await ctx.close();
});

test('auditoria: mostra quem criou cada acesso e quem enviou cada formulário', async ({ page, browser }) => {
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await page.goto('/admin');
  await expect(page.locator('tr', { hasText: 'chefe.equipe' })).toContainText('admin.teste');
  // um administrador comum cria um acesso e envia um formulário
  const ctx = await browser.newContext({ baseURL: 'http://localhost:8788' });
  const chefe = await ctx.newPage();
  await entrar(chefe, 'chefe.equipe', 'chefe-nova');
  await criar(chefe, 'ana.lima', '4321');
  await expect(chefe.locator('tr', { hasText: 'ana.lima' })).toContainText('chefe.equipe');
  await chefe.goto('/admin/formularios');
  await chefe.fill('#fn', 'Termo de Ciência');
  await chefe.setInputFiles('#fa', 'tests/support/formulario-exemplo.pdf');
  await chefe.click('form[data-carrega] button[type=submit]');
  await expect(chefe.locator('tr', { hasText: 'Termo de Ciência' })).toContainText('chefe.equipe');
  expect((await chefe.request.get('/admin/auditoria')).status()).toBe(403);
  await ctx.close();
  // o gestor vê tudo na auditoria, do mais recente para o mais antigo
  await page.goto('/admin/auditoria');
  const linhas = page.locator('tbody tr');
  await expect(linhas.nth(0)).toContainText('chefe.equipe');
  await expect(linhas.nth(0)).toContainText('Enviou o formulário');
  await expect(linhas.nth(0)).toContainText('Termo de Ciência');
  await expect(linhas.nth(1)).toContainText('Criou acesso de atendente');
  await expect(linhas.nth(1)).toContainText('ana.lima');
  await expect(page.locator('tbody')).toContainText('Redefiniu a senha');
});

test('perfis: supervisor, consulta e atendente respeitam as permissões', async ({ page, browser }) => {
  // o gestor cria um supervisor
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await page.goto('/admin');
  await page.fill('#nu', 'sara.supervisora');
  await page.fill('#ns', 'prov1');
  await page.selectOption('#np', 'supervisor');
  await page.click('form[data-carrega] button[type=submit]');
  await expect(page.locator('tr', { has: page.locator('td:first-child', { hasText: 'sara.supervisora' }) })).toContainText('Supervisor');

  const nova = async (usuario, prov, nova) => {
    const ctx = await browser.newContext({ baseURL: 'http://localhost:8788' });
    const p = await ctx.newPage();
    await primeiroAcesso(p, usuario, prov, nova);
    return { ctx, p };
  };

  // supervisor: cria só atendente/consulta, não mexe em administradores
  const sup = await nova('sara.supervisora', 'prov1', 'sara-nova');
  await sup.p.goto('/admin');
  await expect(sup.p.locator('#np option')).toHaveText(['Atendente', 'Consulta']);
  await sup.p.fill('#nu', 'caio.consulta');
  await sup.p.fill('#ns', 'prov2');
  await sup.p.selectOption('#np', 'consulta');
  await sup.p.click('form[data-carrega] button[type=submit]');
  await expect(sup.p.locator('.okmsg')).toContainText('caio.consulta criado');
  const linhaChefe = sup.p.locator('tr', { has: sup.p.locator('td:first-child', { hasText: 'chefe.equipe' }) });
  await expect(linhaChefe.locator('button')).toHaveCount(0);
  const forcado = await sup.p.request.post('/admin', {
    form: { acao: 'criar', usuario: 'x.admin', senha: '1234', perfil: 'administrador' },
    headers: { origin: 'http://localhost:8788' },
  });
  expect(await forcado.text()).toContain('não pode criar usuários com esse perfil');
  const forcado2 = await sup.p.request.post('/admin', { form: { acao: 'desativar', usuario: 'chefe.equipe' }, headers: { origin: 'http://localhost:8788' } });
  expect(await forcado2.text()).toContain('não pode alterar usuários com perfil Administrador');
  expect((await sup.p.request.get('/admin/auditoria')).status()).toBe(403);
  await sup.p.goto('/admin/formularios');
  await expect(sup.p.locator('#fn')).toHaveCount(0);

  // consulta: gera textos, vê o painel, não altera nada
  const con = await nova('caio.consulta', 'prov2', 'caio-nova');
  await con.p.goto('/');
  await expect(con.p.locator('#service_nav')).toBeAttached();
  await con.p.goto('/admin/painel');
  await expect(con.p.locator('h1')).toHaveText('Dashboard');
  await con.p.goto('/admin');
  await expect(con.p.locator('#nu')).toHaveCount(0);
  await expect(con.p.locator('.aviso')).toContainText('consultar os usuários');
  const forcado3 = await con.p.request.post('/admin', { form: { acao: 'remover', usuario: 'ana.lima' }, headers: { origin: 'http://localhost:8788' } });
  expect(forcado3.status()).toBe(403);

  // atendente: sem painel
  const ate = await nova('ana.lima', '4321', 'ana-nova');
  expect((await ate.p.goto('/admin/painel')).status()).toBe(403);
  expect((await ate.p.goto('/admin')).status()).toBe(403);
  await ate.p.goto('/sair');

  // supervisor muda o perfil de um atendente para consulta
  await sup.p.goto('/admin');
  await sup.p
    .locator('tr', { has: sup.p.locator('td:first-child', { hasText: 'ana.lima' }) })
    .locator('select[name=perfil]')
    .selectOption('consulta');
  await expect(sup.p.locator('.okmsg')).toContainText('Perfil de ana.lima alterado para Consulta');
  for (const x of [sup, con, ate]) await x.ctx.close();

  // gestor vê o dashboard completo e a auditoria registra entradas, saídas e mudanças de perfil
  await page.goto('/admin/painel');
  await expect(page.locator('.kpi')).toHaveCount(5);
  await expect(page.locator('.lista-perfis')).toContainText('Supervisor');
  await page.goto('/admin/auditoria');
  const aud = page.locator('tbody');
  await expect(aud).toContainText('Entrou no sistema');
  await expect(aud).toContainText('Saiu do sistema');
  await expect(aud).toContainText('Criou a própria senha (primeiro acesso)');
  await expect(aud).toContainText('Criou acesso de consulta');
  await expect(aud).toContainText('Mudou o perfil: Atendente → Consulta');
});

test('modelos: rascunho, teste, publicação, versões, conflito, restauração e arquivamento', async ({ page, browser }) => {
  const URL_BASE = 'http://localhost:8788';
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await page.goto('/admin/modelos');
  await page.fill('#mi', 'cadastro-irrigante');
  await page.fill('#mn', 'Cadastro de Irrigante');
  await page.selectOption('#mc', 'Titularidade e Cadastro');
  await page.click('form[data-carrega] button[type=submit]');
  await expect(page).toHaveURL(/\/admin\/modelos\/cadastro-irrigante$/);

  const campo = async (i, id, rotulo, tipo, obrig = 'nao', opcoes = '', mostrar = '') => {
    const l = page.locator('#campos tr').nth(i);
    await l.locator('[name=campo_id]').fill(id);
    await l.locator('[name=campo_rotulo]').fill(rotulo);
    await l.locator('[name=campo_tipo]').selectOption(tipo);
    await l.locator('[name=campo_obrigatorio]').selectOption(obrig);
    await l.locator('[name=campo_opcoes]').fill(opcoes);
    await l.locator('[name=campo_mostrar]').fill(mostrar);
  };
  await campo(0, 'tipo', 'Tipo', 'opcao', 'sim', 'Novo | Renovação');
  await campo(1, 'nome', 'Nome', 'texto', 'sim');
  await page.click('button:has-text("+ Campo")');
  await campo(2, 'tel', 'Telefone', 'telefone', 'sim');
  await page.fill('#etn', 'Gentileza cadastrar irrigante\nTipo: {{tipo}}\nNome: {{nome}}\nTelefone: {{tel}}\n{{#se obs}}\nObs: {{obs}}\n{{/se}}');
  // o teste automático pega o campo que não existe
  await page.click('button[value=testar]');
  await expect(page.locator('.erro')).toContainText('{{#se obs}} usa um campo que não existe');
  await page.fill('#etn', 'Gentileza cadastrar irrigante\nTipo: {{tipo}}\nNome: {{nome}}\nTelefone: {{tel}}');
  await page.click('button[value=testar]');
  await expect(page.locator('.resultado-teste')).toContainText('Teste automático: passou');
  await page.click('button[value=salvar]');
  await expect(page.locator('.okmsg')).toContainText('Rascunho salvo');

  // rascunho não aparece para os atendentes
  expect((await (await page.request.get('/api/modelos')).json()).modelos).toEqual([]);

  page.once('dialog', (d) => d.accept());
  await page.click('button[value=publicar]');
  await expect(page.locator('.okmsg')).toContainText('Publicado como versão 1');

  // atendente: aparece na categoria e gera o texto (sem enviar dados ao servidor)
  const ctx = await browser.newContext({ baseURL: URL_BASE });
  const at = await ctx.newPage();
  await entrar(at, 'chefe.equipe', 'chefe-nova');
  await at.click('#btn_alternar_servicos');
  const btn = at.locator('#service_nav .sub-btn[data-modelo="cadastro-irrigante"]');
  await expect(btn).toHaveText('Cadastro de Irrigante');
  await expect(btn.locator('xpath=..').locator('.svc-grupo-titulo')).toHaveText('Titularidade e Cadastro');
  await btn.click();
  const pedidos = [];
  at.on('request', (r) => {
    if (r.method() !== 'GET') pedidos.push(r.url());
  });
  await at.click('#sf-md-cadastro-irrigante .actions .btn:not(.btn-clear)');
  await expect(at.locator('#toastAviso')).toContainText('Preencha o campo: Nome');
  await at.fill('#md_cadastro_irrigante__nome', 'Maria Teste');
  await at.fill('#md_cadastro_irrigante__tel', '71993501519');
  await at.selectOption('#md_cadastro_irrigante__tipo', 'Renovação');
  await at.click('#sf-md-cadastro-irrigante .actions .btn:not(.btn-clear)');
  await expect(at.locator('#out-nota')).toHaveValue('Gentileza cadastrar irrigante\nTipo: Renovação\nNome: Maria Teste\nTelefone: (71) 99350-1519');
  expect(pedidos).toEqual([]);

  // edição em rascunho não muda o que o atendente usa
  await page.fill('#etn', 'Gentileza cadastrar irrigante (v2)\nTipo: {{tipo}}\nNome: {{nome}}\nTelefone: {{tel}}');
  await page.click('button[value=salvar]');
  expect((await (await page.request.get('/api/modelos')).json()).modelos[0].nota).toContain('Gentileza cadastrar irrigante\n');

  // conflito: outro administrador salvou antes
  const outro = await browser.newContext({ baseURL: URL_BASE });
  const adm2 = await outro.newPage();
  await entrar(adm2, 'admin.teste', 'senha-admin-teste');
  await adm2.goto('/admin/modelos/cadastro-irrigante');
  await page.fill('#ed', 'alterado pelo primeiro');
  await page.click('button[value=salvar]');
  await adm2.fill('#ed', 'alterado pelo segundo');
  await adm2.click('button[value=salvar]');
  await expect(adm2.locator('.erro')).toContainText('Outro administrador alterou este modelo');
  await outro.close();

  // publica v2, compara e restaura a v1 para os atendentes
  await page.goto('/admin/modelos/cadastro-irrigante');
  page.once('dialog', (d) => d.accept());
  await page.click('button[value=publicar]');
  await expect(page.locator('.okmsg')).toContainText('versão 2');
  await page.goto('/admin/modelos/cadastro-irrigante/comparar?a=1&b=2');
  await expect(page.locator('.diff .removida')).toContainText('Gentileza cadastrar irrigante');
  await expect(page.locator('.diff .incluida').first()).toContainText('(v2)');
  await page.goto('/admin/modelos/cadastro-irrigante');
  page.once('dialog', (d) => d.accept());
  await page.locator('tr', { hasText: 'v1' }).getByRole('button', { name: 'Restaurar para os atendentes' }).click();
  await expect(page.locator('.okmsg')).toContainText('Versão 1 restaurada');
  const api = await (await page.request.get('/api/modelos')).json();
  expect(api.modelos[0].nota).not.toContain('(v2)');
  await expect(page.locator('tbody tr', { hasText: 'em uso' })).toContainText('v3');

  // arquivar tira do atendimento sem apagar
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Arquivar")');
  await expect(page.locator('.okmsg')).toContainText('Modelo arquivado');
  expect((await (await page.request.get('/api/modelos')).json()).modelos).toEqual([]);
  await at.reload();
  await expect(at.locator('#service_nav .sub-btn[data-modelo="cadastro-irrigante"]')).toHaveCount(0);
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Desarquivar")');
  expect((await (await page.request.get('/api/modelos')).json()).modelos).toHaveLength(1);
  await ctx.close();

  // supervisor edita rascunho mas não publica
  const sup = await browser.newContext({ baseURL: URL_BASE });
  const s = await sup.newPage();
  await entrar(s, 'sara.supervisora', 'sara-nova');
  await s.goto('/admin/modelos/cadastro-irrigante');
  await expect(s.locator('button[value=publicar]')).toHaveCount(0);
  await s.fill('#ed', 'sugestão do supervisor');
  await s.click('button[value=enviar]');
  await expect(s.locator('.okmsg')).toContainText('enviado para um administrador publicar');
  const forcado = await s.request.post('/admin/modelos/cadastro-irrigante', { form: { acao: 'publicar', revisao: '1' }, headers: { origin: URL_BASE } });
  expect(forcado.status()).toBe(403);
  await sup.close();
  await page.goto('/admin/modelos');
  await expect(page.locator('tr', { hasText: 'Cadastro de Irrigante' })).toContainText('Aguardando publicação');

  // auditoria
  await page.goto('/admin/auditoria');
  for (const t of [
    'Criou o modelo (rascunho)',
    'Publicou o modelo (v1)',
    'Restaurou a versão v1 (publicada como v3)',
    'Arquivou o modelo',
    'Enviou o modelo para publicação',
  ])
    await expect(page.locator('tbody')).toContainText(t);
});

test('categorias e scripts: rascunho, validação, publicação, conflito e restauração', async ({ page, browser }) => {
  const URL_BASE = 'http://localhost:8788';
  await entrar(page, 'admin.teste', 'senha-admin-teste');
  await page.goto('/admin/atendimento');
  await expect(page.locator('h1')).toHaveText('Categorias, serviços e scripts');
  // validação: categoria repetida
  await page.fill('textarea[name=categorias]', 'Mais pedidos\nmais pedidos');
  await page.click('button[value=salvar]');
  await expect(page.locator('.erro')).toContainText('Categoria "mais pedidos" repetida');
  await page.fill(
    'textarea[name=categorias]',
    'Mais pedidos\nLigação e Reativação\nTitularidade e Cadastro\nFaturamento e Débitos\nParcelamento\nRessarcimento\nMedição e Rede\nReclamações e Outros',
  );
  await page.click('button[value=salvar]');
  await expect(page.locator('.okmsg')).toContainText('Rascunho salvo');
  await page.selectOption('select[name="cat:sf-relig"]', 'Mais pedidos');
  await page.selectOption('select[name="vis:sf-afericao"]', 'oculto');
  const det = page.locator('tr', { hasText: 'Religação' }).first().locator('details');
  await det.locator('summary').click();
  await det.locator('textarea[name="falas:sf-relig"]').fill('Bom dia! Com quem eu falo?');
  await det.locator('textarea[name="check:sf-relig"]').fill('Comprovante de pagamento');
  await page.click('button[value=salvar]');
  // rascunho não chega ao atendente
  expect((await (await page.request.get('/api/atendimento')).json()).documento).toBeNull();
  page.once('dialog', (d) => d.accept());
  await page.click('button[value=publicar]');
  await expect(page.locator('.okmsg')).toContainText('Publicado como versão 1');
  const doc = (await (await page.request.get('/api/atendimento')).json()).documento;
  expect(doc.categorias[0].nome).toBe('Mais pedidos');
  expect(doc.servicos['sf-afericao']).toEqual({ oculto: true });
  expect(doc.scripts['sf-relig']).toEqual({ falas: ['Bom dia! Com quem eu falo?'], checklist: ['Comprovante de pagamento'] });

  // atendente vê a nova organização e o roteiro
  const ctx = await browser.newContext({ baseURL: URL_BASE });
  const at = await ctx.newPage();
  await entrar(at, 'chefe.equipe', 'chefe-nova');
  await expect(at.locator('#service_nav .svc-grupo-titulo').first()).toHaveText('Mais pedidos');
  await at.click('#btn_alternar_servicos');
  await at.click('#service_nav .sub-btn >> text="Religação"');
  await expect(at.locator('#sf-relig > .roteiro')).toContainText('Bom dia! Com quem eu falo?');
  await expect(at.locator('#service_nav .sub-btn', { hasText: 'Aferição' })).toHaveCount(0);
  // modelo de texto escolhe entre as categorias publicadas
  await page.goto('/admin/modelos');
  await expect(page.locator('#mc option').first()).toHaveText('Mais pedidos');

  // conflito entre administradores
  const outro = await browser.newContext({ baseURL: URL_BASE });
  const adm2 = await outro.newPage();
  await entrar(adm2, 'admin.teste', 'senha-admin-teste');
  await adm2.goto('/admin/atendimento');
  await page.goto('/admin/atendimento');
  await page.selectOption('select[name="vis:sf-afericao"]', 'visivel');
  page.once('dialog', (d) => d.accept());
  await page.click('button[value=publicar]');
  await expect(page.locator('.okmsg')).toContainText('versão 2');
  await adm2.click('button[value=salvar]');
  await expect(adm2.locator('.erro')).toContainText('Outro administrador alterou esta configuração');
  await outro.close();

  // comparar e restaurar a v1
  await page.goto('/admin/atendimento/comparar?a=1&b=2');
  await expect(page.locator('.diff .removida')).toContainText('Aferição: oculto');
  await page.goto('/admin/atendimento');
  page.once('dialog', (d) => d.accept());
  await page.locator('tr', { hasText: 'v1' }).getByRole('button', { name: 'Restaurar para os atendentes' }).click();
  await expect(page.locator('.okmsg')).toContainText('Versão 1 restaurada');
  expect((await (await page.request.get('/api/atendimento')).json()).documento.servicos['sf-afericao']).toEqual({ oculto: true });
  await ctx.close();

  // supervisor envia, não publica
  const sup = await browser.newContext({ baseURL: URL_BASE });
  const s = await sup.newPage();
  await entrar(s, 'sara.supervisora', 'sara-nova');
  await s.goto('/admin/atendimento');
  await expect(s.locator('button[value=publicar]')).toHaveCount(0);
  await s.click('button[value=enviar]');
  await expect(s.locator('.okmsg')).toContainText('enviado para um administrador');
  const forcado = await s.request.post('/admin/atendimento', { form: { acao: 'publicar', revisao: '1', categorias: 'X' }, headers: { origin: URL_BASE } });
  expect(forcado.status()).toBe(403);
  await sup.close();
  await page.goto('/admin/auditoria');
  for (const t of [
    'Publicou categorias e scripts (v1)',
    'Restaurou a configuração do atendimento v1 (publicada como v3)',
    'Enviou categorias e scripts para publicação',
  ])
    await expect(page.locator('tbody')).toContainText(t);
});
