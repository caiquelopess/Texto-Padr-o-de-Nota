import { expect, test } from '@playwright/test';

const entrar = async (page, usuario, senha, destino = '/') => {
  await page.goto(`/entrar?destino=${encodeURIComponent(destino)}`);
  await page.fill('#usuario', usuario);
  await page.fill('#senha', senha);
  await page.click('button[type=submit]');
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

test('atendente entra, volta para a página pedida e não acessa a administração', async ({ page }) => {
  await entrar(page, 'maria.silva', '1234', '/teste/');
  await expect(page).toHaveURL(/\/teste\/$/);
  await noSistema(page);
  expect((await page.request.get('/versao.json')).status()).toBe(200);
  expect((await page.goto('/admin')).status()).toBe(403);
  const sessao = await (await page.request.get('/api/sessao')).json();
  expect(sessao).toEqual({ usuario: 'maria.silva', admin: false });
});

test('não redireciona para fora do site depois do login', async ({ page }) => {
  await entrar(page, 'maria.silva', '1234', '//site-malicioso.com');
  await expect(page).toHaveURL('http://localhost:8788/');
});

test('trocar a própria senha', async ({ page }) => {
  await entrar(page, 'maria.silva', '1234');
  await page.goto('/trocar-senha');
  await page.fill('#atual', '1234');
  await page.fill('#nova', 'nova1');
  await page.fill('#confirma', 'nova2');
  await page.click('button[type=submit]');
  await expect(page.locator('.erro')).toContainText('não é igual');
  await page.fill('#atual', '1234');
  await page.fill('#nova', 'nova1');
  await page.fill('#confirma', 'nova1');
  await page.click('button[type=submit]');
  await expect(page.locator('.okmsg')).toHaveText('Senha alterada.');
  await page.goto('/');
  await noSistema(page);
  await page.goto('/sair');
  await entrar(page, 'maria.silva', '1234');
  await expect(page.locator('.erro')).toBeVisible();
  await entrar(page, 'maria.silva', 'nova1');
  await noSistema(page);
});

test('redefinir senha e desativar derrubam a sessão aberta do atendente', async ({ browser }) => {
  const atendente = await browser.newPage();
  await entrar(atendente, 'joao.souza', 'a!b@');
  await noSistema(atendente);
  const adm = await browser.newPage();
  await entrar(adm, 'admin.teste', 'senha-admin-teste');
  await adm.goto('/admin');
  adm.once('dialog', (d) => d.accept('prov1'));
  await adm.locator('tr', { hasText: 'joao.souza' }).getByRole('button', { name: 'Redefinir senha' }).click();
  await expect(adm.locator('.okmsg')).toContainText('Senha de joao.souza redefinida');
  await atendente.goto('/');
  await expect(atendente).toHaveURL(/\/entrar/);
  await entrar(atendente, 'joao.souza', 'prov1');
  await noSistema(atendente);
  await adm.locator('tr', { hasText: 'joao.souza' }).getByRole('button', { name: 'Desativar' }).click();
  await expect(adm.locator('.okmsg')).toHaveText('Usuário joao.souza desativado.');
  await atendente.goto('/');
  await expect(atendente).toHaveURL(/\/entrar/);
  await entrar(atendente, 'joao.souza', 'prov1');
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
  await page.fill('#busca_form', 'resid');
  await expect(page.locator('#form_previa iframe')).toBeVisible();

  await page.goto('/admin/formularios');
  page.once('dialog', (d) => d.accept());
  await page.click('button.perigo');
  await expect(page.locator('.okmsg')).toHaveText('Formulário removido.');
});
