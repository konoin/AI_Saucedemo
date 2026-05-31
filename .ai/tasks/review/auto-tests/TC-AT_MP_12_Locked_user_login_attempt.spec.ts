import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';

test.describe('MP-12 - Locked user login attempt', () => {
  test('MP-12 - Locked user login attempt @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.open();

    // Act
    await loginPage.login('locked_out_user', 'secret_sauce');

    // Assert
    // Error message is displayed preventing login
    await expect(loginPage.errorBanner).toBeVisible();
    await expect(loginPage.errorBanner).toHaveText(/Sorry, this user has been locked out\.?/i);

    // User should not be able to access Inventory
    await expect(page).not.toHaveURL(/.*\/inventory.*/);

    // Ensure no session was created (no session username in localStorage)
    const sessionUsername = await page.evaluate(() => localStorage.getItem('session-username'));
    expect(sessionUsername).toBeNull();

    // Optionally verify inventory page is not reachable directly
    await inventoryPage.open();
    await expect(page).not.toHaveURL(/.*\/inventory.*/);
  });
});