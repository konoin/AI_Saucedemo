import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

// Test: MP-13 - Login with special characters in credentials
// Tags: @regression @critical

test('@regression @critical MP-13 - Login with special characters in credentials', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const specialCredentials = `special!#$%^&*()_+[];'/{}|:"<>?`;

  await loginPage.goto();

  // Act
  await loginPage.login(specialCredentials, specialCredentials);

  // Assert
  // 1) Generic authentication failure message is shown
  const errorText = await loginPage.getErrorText();
  expect(errorText).toBeTruthy();
  expect(errorText).toMatch(/(username and password do not match|authentication|Epic sadface)/i);

  // 2) Special characters are not leaked back in the UI error message
  expect(errorText).not.toContain(specialCredentials);

  // 3) Application did not crash and remains on login page (login form still visible)
  expect(await loginPage.isLoginFormVisible()).toBeTruthy();
});