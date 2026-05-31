import { test, expect } from '@fixtures/base.fixture';
import { emptyCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_07
 */
test('@critical @regression MP-07 login attempt with empty username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(emptyCredentialsUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText('Epic sadface: Username is required');
  await expect(page).toHaveURL(/\/$/);
});
