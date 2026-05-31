import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';

/**
 * Source Test Case: TC-AT-MP-07
 */
test('@critical @regression MP-07 login attempt with empty password', async ({
  page,
  loginPage,
}) => {
  // Arrange
  await loginPage.goto();

  // Act
  await loginPage.fillUsername(standardUser.username);
  await loginPage.clickLogin();

  // Assert
  await expect(page).toHaveURL(/\/(?:index\.html)?$/);
  await expect.poll(() => loginPage.getErrorMessage()).toContain('Password is required');
});
