import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_02
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

  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(loginPage.usernameInput).toBeVisible();

  await page.goto('/inventory.html');
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
  await expect(loginPage.errorMessage).toContainText(
    "You can only access '/inventory.html' when you are logged in.",
  );
});
