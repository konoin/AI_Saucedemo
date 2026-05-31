import test, { expect } from '@fixtures/base.fixture';
import { LoginPage } from 'framework/pages/login.page';

test('MP-07 - Login attempt with empty username and password @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.open();

  // Act
  // Ensure both fields are empty (defensive - in case fixtures prefill)
  await loginPage.clearUsername();
  await loginPage.clearPassword();
  await loginPage.clickLogin();

  // Assert
  await expect(loginPage.errorMessage).toHaveText('Epic sadface: Username is required');
  // User should remain on the login page
  await expect(page).toHaveURL(/saucedemo\.com\/?$/);
});