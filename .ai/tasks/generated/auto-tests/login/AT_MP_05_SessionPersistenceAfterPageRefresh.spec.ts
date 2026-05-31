import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-05
 */
test('@critical @smoke @regression MP-05 session persistence after page refresh', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);
  const productCountBeforeRefresh = await inventoryPage.getProductsCount();

  // Act
  await page.reload();

  // Assert
  await expect(page).toHaveURL(/inventory/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBe(productCountBeforeRefresh);
});
