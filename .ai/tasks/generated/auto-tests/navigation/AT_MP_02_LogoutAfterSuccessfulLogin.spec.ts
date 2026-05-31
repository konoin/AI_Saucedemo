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

  // Arrange
  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/\/inventory\.html$/);

  // Act
  await inventoryPage.logout();

  // Assert
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();

  await page.goto('/inventory.html');
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
  await expect(loginPage.errorMessage).toContainText("You can only access '/inventory.html' when you are logged in.");
});
