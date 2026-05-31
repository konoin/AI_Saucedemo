import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP - Login', () => {
  test('MP-06 - Login attempt with empty username @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.enterPassword('secret_sauce');
    await loginPage.clickLogin();

    // Assert
    const errorMessage = await loginPage.getErrorMessageText();
    expect(errorMessage).toContain('Username is required');

    // Ensure user remains on the login page (no session created)
    await expect(page).toHaveURL(/.*(login|index)\.html/);
  });
});