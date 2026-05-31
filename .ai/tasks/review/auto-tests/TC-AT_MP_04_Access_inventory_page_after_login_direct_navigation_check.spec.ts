import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@flows/login.flow';
import { InventoryPage } from '@pages/inventory.page';
import { users } from '@data/users';

// MP-04 - Access inventory page after login (direct navigation check)
// Tags: @regression @critical @smoke
test('MP-04 - Access inventory page after login (direct navigation check) @regression @critical @smoke', async ({ page, baseURL }) => {
  // Arrange
  const loginFlow = new LoginFlow(page);
  const inventoryPage = new InventoryPage(page);
  const { username, password } = users.standard_user;
  const inventoryAbsoluteUrl = `${baseURL}/inventory.html`;

  // Act
  await loginFlow.loginWithCredentials(username, password);
  // Simulate manual navigation to the inventory URL (address bar navigation)
  await page.goto(inventoryAbsoluteUrl);

  // Assert
  // Verify inventory page loads and items are visible
  await expect(inventoryPage.inventoryContainer).toBeVisible();
  await expect(inventoryPage.inventoryItems.first()).toBeVisible();
});