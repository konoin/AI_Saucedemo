import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP-09 - Login attempt with invalid username', () => {
  test('MP-09 - Login attempt with invalid username @regression @critical', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('invalid_user', 'secret_sauce');

    // Assert
    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Username and password do not match any user in this service'
    );

    // Ensure no authenticated session was created (did not navigate to inventory)
    await expect(page).not.toHaveURL(/.*inventory\.html/);
  });
});