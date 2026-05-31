import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-02
 */
test('@critical @smoke @regression MP-02 login using standard user account', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(standardUser);

  // Assert
  await expect(page).toHaveURL(/inventory/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
});
