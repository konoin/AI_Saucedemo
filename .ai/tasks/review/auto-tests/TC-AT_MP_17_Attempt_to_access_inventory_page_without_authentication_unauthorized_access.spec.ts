import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from 'framework/pages/login.page';
import { InventoryPage } from 'framework/pages/inventory.page';

test.describe('MP-17 - Unauthorized access to inventory', () => {
  test('@regression @critical MP-17 - Attempt to access inventory page without authentication (unauthorized access)', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    // Act
    await page.goto('/inventory.html');

    // Assert
    // Expect not to remain on the inventory route
    await expect(page).not.toHaveURL(/\/inventory\.html/);

    // Login page should be displayed to unauthenticated users
    const isLoginVisible = await loginPage.isDisplayed();
    expect(isLoginVisible).toBeTruthy();

    // Inventory content must not be visible to unauthenticated users
    const isInventoryVisible = await inventoryPage.isDisplayed();
    expect(isInventoryVisible).toBeFalsy();
  });
});
