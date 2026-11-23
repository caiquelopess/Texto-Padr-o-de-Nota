import { defineConfig, devices } from '@playwright/test';

// Login (Cloudflare Pages Functions) rodando no simulador oficial (wrangler).
export default defineConfig({
  testDir: 'tests/login',
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-login' }]] : [['list']],
  use: { baseURL: 'http://localhost:8788', trace: 'off', screenshot: 'only-on-failure', ...devices['Desktop Chrome'] },
  webServer: {
    command:
      'node scripts/dist.mjs && wrangler pages dev dist --kv USUARIOS --port 8788 --ip 127.0.0.1 --persist-to .wrangler/teste-login' +
      ' --binding SEGREDO_SESSAO=segredo-local-de-teste-com-mais-de-32-caracteres --binding ADMIN_USUARIO=admin.teste --binding ADMIN_SENHA=senha-admin-teste',
    url: 'http://localhost:8788/entrar',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
    timeout: 120000,
  },
});
