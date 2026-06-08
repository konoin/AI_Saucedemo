import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES, standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Artifact: TC-AT_MP_02_Logout_after_successful_login.spec.ts
 */
test('@critical @smoke @regression MP-02 logout after successful login', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/\/inventory\.html$/);

  await inventoryPage.logout();

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.usernameInput).toBeVisible();

  await page.goto('/inventory.html');

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.unauthorizedInventory);
});
