import { test, expect } from '@fixtures/base.fixture';
import { auth } from '@flows/auth.flow';
import { InventoryPage } from '@pages/inventory.page';

test('MP-02 - Login using standard_user @regression @smoke @critical', async ({ page }) => {
  // Arrange
  const username = 'standard_user';
  const password = 'secret_sauce';
  const inventoryPage = new InventoryPage(page);

  // Act
  await auth.login(page, username, password);

  // Assert
  await expect(page).toHaveURL(/\/inventory.html/);
  await inventoryPage.waitForPageLoad();
  await expect(inventoryPage.productList).toBeVisible();
});