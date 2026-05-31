import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP-11 - Locked user login attempt (locked_out_user) @regression @critical', () => {
  test('blocks locked_out_user and displays locked out error', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login('locked_out_user', 'secret_sauce');

    // Assert
    const error = loginPage.getErrorMessage();
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/Epic sadface: Sorry, this user has been locked out\./);

    // User should remain on the login page and not reach the inventory
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(page).not.toHaveURL(/.*inventory\.html/);
  });
});
