import { test, expect } from '@fixtures/base.fixture';
import LoginPage from '@pages/login.page';

test('MP-08 - Login attempt with empty username and password @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  // Act
  await loginPage.clickLogin();

  // Assert
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toContain('Username is required');

  // User stays on the login page and is not authenticated
  expect(await loginPage.isOnLoginPage()).toBeTruthy();
  expect(await loginPage.isAuthenticated()).toBeFalsy();
});
