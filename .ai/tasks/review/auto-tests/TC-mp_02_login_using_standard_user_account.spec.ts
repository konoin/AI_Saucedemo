import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';
import { InventoryPage } from '@framework/pages/inventory.page';
import { LoginFlow } from '@framework/flows/login.flow';

test('MP-02 - Login using standard_user account @regression @critical @smoke', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const loginFlow = new LoginFlow(page);
  const inventoryPage = new InventoryPage(page);

  // Act
  await loginPage.goto();
  await loginFlow.login('standard_user', 'secret_sauce');

  // Assert
  // Verify user is on the Inventory page (URL) and inventory is displayed
  await expect(page).toHaveURL(/inventory/);

  const inventoryLoaded = await inventoryPage.isLoaded();
  expect(inventoryLoaded).toBeTruthy();

  const productsCount = await inventoryPage.getProductsCount();
  expect(productsCount).toBeGreaterThan(0);
});