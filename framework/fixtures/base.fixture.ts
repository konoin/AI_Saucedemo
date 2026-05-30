import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type FrameworkFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<FrameworkFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
