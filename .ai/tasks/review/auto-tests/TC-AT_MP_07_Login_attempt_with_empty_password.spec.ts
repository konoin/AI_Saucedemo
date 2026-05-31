import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';
import { users } from '@framework/data/users';

test.describe('MP-07 - Login attempt with empty password', () => {
  test('MP-07 - Login attempt with empty password @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.open();

    // Act
    await loginPage.enterUsername(users.standard_user.username);
    // Intentionally do NOT enter a password to simulate empty password
    await loginPage.clickLogin();

    // Assert
    await expect(loginPage.errorMessage).toHaveText(/password is required/i);
    await expect(page).toHaveURL(/login/);
  });
});