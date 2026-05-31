import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-03
 */
test('@critical @smoke @regression MP-03 access inventory page after login', async ({
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
  await expect.poll(() => inventoryPage.getProductNames()).not.toHaveLength(0);
  await expect.poll(() => inventoryPage.getProductPrices()).not.toHaveLength(0);
  expect(await inventoryPage.getProductNames()).toEqual(
    expect.arrayContaining([expect.stringMatching(/\S+/)]),
  );
  expect(await inventoryPage.getProductPrices()).toEqual(
    expect.arrayContaining([expect.stringMatching(/^\$\d+\.\d{2}$/)]),
  );

  // Act
  await page.goto('/inventory.html');

  // Assert
  await expect(page).toHaveURL(/inventory/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
});
