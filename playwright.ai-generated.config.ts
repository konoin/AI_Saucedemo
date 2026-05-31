import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for AI-generated tests only.
 * Does not use framework/tests — see testDir below.
 * Invoked explicitly: npx playwright test --config=playwright.ai-generated.config.ts
 */
export default defineConfig({
  testDir: '.ai/tasks/generated/auto-tests',
  testMatch: '**/*.{spec,test}.ts',
  testIgnore: ['**/*.example.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-ai-generated', open: 'never' }],
    ['json', { outputFile: 'playwright-report-ai-generated/results.json' }],
    [
      './framework/reporters/ai-reporter.ts',
      { outputFile: 'test-results-ai-generated/ai-report.json' },
    ],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
