import { defineConfig, devices } from '@playwright/test';

// Os testes rodam na cópia de TESTE (/teste/), onde toda mudança entra primeiro.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: 'http://localhost:4173/teste/', trace: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'node tests/support/servidor.mjs', url: 'http://localhost:4173/teste/', reuseExistingServer: !process.env.CI },
});
