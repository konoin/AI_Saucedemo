import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Artifact: TC-AT_MP_03_Session_persistence_after_browser_refresh.spec.ts
 */
test('@critical @regression MP-03 session persistence after browser refresh', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);

  await page.reload();

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
});
