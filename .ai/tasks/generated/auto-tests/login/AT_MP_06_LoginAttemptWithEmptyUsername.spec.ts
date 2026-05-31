import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';

/**
 * Source Test Case: TC-AT-MP-06
 */
test('@critical @regression MP-06 login attempt with empty username', async ({
  page,
  loginPage,
}) => {
  // Arrange
  await loginPage.goto();

  // Act
  await loginPage.fillPassword(standardUser.password);
  await loginPage.clickLogin();

  // Assert
  await expect(page).toHaveURL(/\/(?:index\.html)?$/);
  await expect.poll(() => loginPage.getErrorMessage()).toContain('Username is required');
});
