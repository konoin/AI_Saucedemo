import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';

test('MP-05 - Login attempt with empty username @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Act
  await loginPage.enterUsername(''); // leave username empty
  await loginPage.enterPassword('secret_sauce');
  await loginPage.clickLogin();

  // Assert
  const errorText = await loginPage.getErrorMessageText();
  expect(errorText).toContain('Username is required');

  // User remains on the login page
  expect(page.url()).toContain('saucedemo.com');
});