import test, { expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP-10 - Login attempt with invalid password', () => {
  test('MP-10 - Login attempt with invalid password @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const validUsername = 'standard_user';
    const invalidPassword = 'wrong_password';

    await loginPage.goto();

    // Act
    await loginPage.login(validUsername, invalidPassword);

    // Assert
    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Username and password do not match any user in this service'
    );

    // Ensure no session was created / no successful redirect to inventory
    await expect(page).not.toHaveURL(/.*inventory.*/);
  });
});