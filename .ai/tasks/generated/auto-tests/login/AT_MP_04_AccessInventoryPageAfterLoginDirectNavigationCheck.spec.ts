import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-04
 */
test('@critical @smoke @regression MP-04 access inventory page after login direct navigation check', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await page.goto('/inventory.html');

  await expect(page).toHaveURL(/inventory/);
  await expect(inventoryPage.inventoryItems.first()).toBeVisible();
});
