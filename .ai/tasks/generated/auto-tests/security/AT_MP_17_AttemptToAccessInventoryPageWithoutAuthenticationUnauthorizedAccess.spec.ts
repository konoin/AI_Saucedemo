import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_17_Attempt_to_access_inventory_page_without_authentication_unauthorized_access.spec.ts
 */
test('@critical @regression MP-17 attempt to access inventory page without authentication unauthorized access', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  await page.goto('/inventory.html');

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.unauthorizedInventory);
  await expect.poll(() => inventoryPage.getProductsCount()).toBe(0);
});
