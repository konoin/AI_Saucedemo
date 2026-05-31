import test, { expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';

test('@regression @critical MP-14 - Attempt SQL injection in username and password fields', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const sqlPayload = "' OR '1'='1'; --";

  await loginPage.navigate();

  // Act
  await loginPage.enterUsername(sqlPayload);
  await loginPage.enterPassword(sqlPayload);
  await loginPage.clickLogin();

  // Assert
  // 1) An authentication failure message is shown
  await expect(loginPage.errorMessage).toBeVisible();

  // 2) No successful navigation occurs (stay on login page)
  const currentUrl = page.url();
  expect(currentUrl).not.toContain('inventory.html');

  // 3) No stack trace or DB error is exposed in the UI (basic check: error message text does not contain typical stack/db keywords)
  const errorText = await loginPage.errorMessage.textContent();
  const lowerError = (errorText || '').toLowerCase();
  expect(lowerError).not.toContain('exception');
  expect(lowerError).not.toContain('stack');
  expect(lowerError).not.toContain('sql');
  expect(lowerError).not.toContain('database');
});