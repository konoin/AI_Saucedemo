import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from 'framework/pages/login.page';

test.describe('MP - Login', () => {
  test('MP-06 - Login attempt with empty password @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.setUsername('standard_user');
    await loginPage.setPassword(''); // explicitly leave password empty
    await loginPage.clickLogin();

    // Assert
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toBe('Epic sadface: Password is required');

    const stillOnLogin = await loginPage.isOnLoginPage();
    expect(stillOnLogin).toBeTruthy();
  });
});
