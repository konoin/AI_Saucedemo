import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/LoginPage';

test('@regression @critical MP-12 - Login with very long credentials (excessive length input)', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const veryLong = 'a'.repeat(5000);

  const serverErrors: string[] = [];
  page.on('response', (response) => {
    try {
      const status = response.status();
      if (status >= 500) serverErrors.push(`${status} - ${response.url()}`);
    } catch {
      // ignore any response inspection errors
    }
  });

  // Act
  await loginPage.fillUsername(veryLong);
  await loginPage.fillPassword(veryLong);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    loginPage.clickLogin()
  ]);

  // Assert
  // 1) No server (5xx) errors occurred
  expect(serverErrors, `Unexpected server errors: ${serverErrors.join(', ')}`).toHaveLength(0);

  // 2) User remains on the login page
  const stillOnLogin = await loginPage.isVisible();
  expect(stillOnLogin).toBeTruthy();

  // 3) Application provides meaningful feedback OR at least does not crash
  // It's valid if an error message is shown; if not shown, remaining on login page without crash is acceptable.
  const errorText = await loginPage.getErrorMessage();
  if (errorText) {
    expect(errorText.trim().length).toBeGreaterThan(0);
  } else {
    // No explicit error shown; ensure no unexpected navigation occurred
    const url = page.url();
    expect(url).toMatch(/saucedemo\.com\/(?:|index.html|)$|login/);
  }
});