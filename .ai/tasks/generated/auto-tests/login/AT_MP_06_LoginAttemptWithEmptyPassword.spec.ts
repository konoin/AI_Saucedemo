import { test, expect } from '@fixtures/base.fixture';
import { emptyPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_06
 */
test('@critical @regression MP-06 login attempt with empty password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(emptyPasswordUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText('Epic sadface: Password is required');
  await expect(page).toHaveURL(/\/$/);
});
