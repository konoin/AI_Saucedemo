import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_03
 */
test('@critical @regression MP-03 session persists after browser refresh', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);

  // Act
  await page.reload();

  // Assert
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
});
