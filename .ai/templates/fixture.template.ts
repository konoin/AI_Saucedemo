import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';

/**
 * Template: extend framework/fixtures/base.fixture.ts
 * Only add fixtures for new Page Objects that specs need injected.
 */
type ExtendedFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<ExtendedFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
