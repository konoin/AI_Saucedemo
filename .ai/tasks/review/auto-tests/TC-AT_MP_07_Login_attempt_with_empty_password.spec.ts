import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { users } from '@data/users';

test('MP-07 - Login attempt with empty password @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Act
  await loginPage.fillUsername(users.standard_user.username);
  // leave password empty intentionally
  await loginPage.fillPassword('');
  await loginPage.clickLogin();

  // Assert
  const errorText = await loginPage.getErrorMessageText();
  expect(errorText).toContain('Password is required');

  // User should remain on the login page (not navigated to inventory)
  expect(page.url()).not.toContain('/inventory.html');

  // No session cookie should be created
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === 'session-username' || c.name === 'session_id' || c.name === 'auth_token');
  expect(sessionCookie).toBeUndefined();
});