import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_01
 */
test('@critical @smoke @regression MP-01 login with valid credentials as standard user', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();

  // Act
  await loginFlow.loginAs(standardUser);

  // Assert
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
  await expect(loginPage.errorMessage).toBeHidden();
});
