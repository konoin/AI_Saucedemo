import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test('MP-08 - Login attempt with invalid username @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const invalidUsername = 'invalid_user';
  const validPassword = 'secret_sauce';
  const expectedError = 'Epic sadface: Username and password do not match any user in this service';

  // Act
  await loginPage.goto();
  await loginPage.enterUsername(invalidUsername);
  await loginPage.enterPassword(validPassword);
  await loginPage.clickLogin();

  // Assert
  const errorText = await loginPage.getErrorMessage();
  expect(errorText).toContain(expectedError);
  await expect(page).toHaveURL(/saucedemo\.com\/?$/);
});