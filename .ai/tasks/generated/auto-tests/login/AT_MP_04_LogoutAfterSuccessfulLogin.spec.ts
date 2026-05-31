import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-04
 */
test('@critical @smoke @regression MP-04 logout after successful login', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);

  // Act
  await inventoryPage.logout();

  // Assert
  await expect(page).toHaveURL(/\/(?:index\.html)?$/);
  await expect(loginPage.loginButton).toBeVisible();

  // Act
  await page.goto('/inventory.html');

  // Assert
  await expect(page).toHaveURL(/\/(?:index\.html)?$/);
  await expect(loginPage.loginButton).toBeVisible();
  await expect.poll(() => loginPage.getErrorMessage()).toContain('You can only access');
});
