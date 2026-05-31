import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@flows/login.flow';
import { InventoryPage } from '@pages/inventory.page';
import { USERS } from '@data/users.data';

test('@regression @critical @smoke MP-05 - Session persistence after page refresh', async ({ page }) => {
  // Arrange
  const loginFlow = new LoginFlow(page);
  const inventoryPage = new InventoryPage(page);

  // Act
  await loginFlow.login(USERS.STANDARD);
  await inventoryPage.waitForLoad();
  const productCountBefore = await inventoryPage.getProductsCount();

  await page.reload();
  await inventoryPage.waitForLoad();
  const productCountAfter = await inventoryPage.getProductsCount();

  // Assert
  expect(productCountBefore).toBeGreaterThan(0);
  expect(productCountAfter).toBe(productCountBefore);
  expect(page.url()).toContain(inventoryPage.routePath || '/inventory');
});