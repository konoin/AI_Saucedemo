import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';
import { InventoryPage } from '@framework/pages/inventory.page';

test.describe('MP-01 - Login with valid credentials (standard_user)', () => {
  test('@regression @critical @smoke should authenticate and redirect to inventory page', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto(); // Open https://www.saucedemo.com/

    // Assert - Login page loads and fields are visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // Act - enter credentials and submit
    await loginPage.enterUsername('standard_user');
    await loginPage.enterPassword('secret_sauce');
    await loginPage.clickLogin();

    // Assert - user is redirected to inventory page and inventory list is displayed
    await expect(page).toHaveURL(/.*\/inventory.html$/);
    await expect(inventoryPage.inventoryList).toBeVisible();

    // Assert - no error messages are shown
    await expect(loginPage.errorMessage).toBeHidden();
  });
});
