import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP-06 - Login attempt with empty username', () => {
  test('@regression @critical MP-06 - Login attempt with empty username', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Act
    // Leave username empty
    await loginPage.fillUsername('');
    await loginPage.fillPassword('secret_sauce');
    await loginPage.submit();

    // Assert
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Username is required');
    // Ensure user remains on the login page (not authenticated)
    expect(await loginPage.isAtLoginPage()).toBeTruthy();
  });
});
