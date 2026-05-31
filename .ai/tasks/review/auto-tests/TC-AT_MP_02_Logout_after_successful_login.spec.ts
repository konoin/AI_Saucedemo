import { test, expect } from '@fixtures/base.fixture';
import { AuthFlow } from '@flows/auth.flow';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';

test.describe('MP - Logout flow', () => {
  test('MP-02 - Logout after successful login @regression @critical @smoke', async ({ page }) => {
    // Arrange
    const authFlow = new AuthFlow(page);
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    // Act: Login with valid credentials
    await authFlow.login('standard_user', 'secret_sauce');

    // Assert: Verify we are on the inventory page
    const onInventory = await inventoryPage.isDisplayed();
    expect(onInventory).toBe(true);

    // Act: Open menu and click Logout
    await inventoryPage.openHamburgerMenu();
    await inventoryPage.clickLogoutOption();

    // Assert: User is redirected to the login page
    const onLogin = await loginPage.isDisplayed();
    expect(onLogin).toBe(true);

    // Assert: Inventory page requires re-authentication and protected content is not accessible
    await page.goto('/inventory.html');
    const stillOnLogin = await loginPage.isDisplayed();
    expect(stillOnLogin).toBe(true);
  });
});
