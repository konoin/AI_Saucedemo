import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

/**
 * @regression
 * @critical
 */
test.describe('MP - Login', () => {
  test('MP-08 - Login attempt with empty username and password', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.open();

    // Act
    // Leave username and password empty and attempt to login
    await loginPage.clickLogin();

    // Assert
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
    expect(error).toMatch(/Epic sadface: Username is required|Username is required|username and password/i);

    // User remains on the login page
    expect(await loginPage.isAt()).toBeTruthy();
  });
});
