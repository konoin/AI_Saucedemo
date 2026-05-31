import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP - Login', () => {
  test('@regression @critical MP-13 - Login with very long credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const longUsername = 'a'.repeat(5000);
    const longPassword = 'b'.repeat(5000);

    await loginPage.goto();

    // Act
    await loginPage.fillUsername(longUsername);
    await loginPage.fillPassword(longPassword);
    await loginPage.clickLogin();

    // Assert
    const errorLocator = await loginPage.getErrorMessage();
    await expect(errorLocator).toBeVisible();

    const errorText = (await errorLocator.textContent()) || '';
    // Error message should be user friendly (non-empty) and must not expose stack traces or sensitive internals
    expect(errorText.trim().length).toBeGreaterThan(0);
    expect(errorText.toLowerCase()).not.toMatch(/exception|stack|trace|error\scode|at\s+\w+\(|<html|runtimeerror/);

    // Ensure application remained responsive and still on/at login (no client-side crash)
    await expect(loginPage.getLoginButton()).toBeEnabled();
    await expect(page).toHaveURL(/login|saucedemo/i);
  });
});
