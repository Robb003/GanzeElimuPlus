import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  timeout: 30 * 1000,

  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: [
    {
      command: 'node ../server/startE2E.js',
      url: 'http://127.0.0.1:5000/',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm exec vite --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
  ],
});
