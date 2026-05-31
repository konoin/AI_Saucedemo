import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test('@regression MP-14 - Login with special characters in credentials', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const specialUsername = '!@#$%^&*()_+{}|:"<>?';
  const specialPassword = '`~[];',./<>?';

  await loginPage.goto();

  // Act
  await loginPage.login(specialUsername, specialPassword);

  // Assert
  const errorText = await loginPage.getErrorMessage();

  // Login must fail for invalid credentials
  expect(errorText).toBeTruthy();
  expect(errorText?.toLowerCase()).toContain('do not match');

  // Ensure no raw/unescaped script injection or credential leakage in the error message
  expect(errorText).not.toContain('<script');
  expect(errorText).not.toContain(specialUsername);
  expect(errorText).not.toContain(specialPassword);
});