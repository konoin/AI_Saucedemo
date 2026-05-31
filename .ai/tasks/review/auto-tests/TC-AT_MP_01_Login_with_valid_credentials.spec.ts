import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from 'framework/pages/login.page';
import { InventoryPage } from 'framework/pages/inventory.page';
import { authFlow } from 'framework/flows/auth.flow';

test.describe('MP - Login', () => {
  test('@regression @critical @smoke MP-01 - Login with valid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const username = 'standard_user';
    const password = 'secret_sauce';

    // Act: Open application
    await loginPage.goto();

    // Assert: Login page is displayed with required fields and button
    await expect(loginPage.usernameField).toBeVisible();
    await expect(loginPage.passwordField).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // Act: Perform login via existing flow
    await authFlow.login(page, username, password);

    // Assert: User is redirected to Inventory page and UI elements are visible
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.inventoryContainer).toBeVisible();
    await expect(inventoryPage.menuButton).toBeVisible();
  });
});
