import { test, expect } from '@fixtures/base.fixture';
import { invalidCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_10
 */
test('@regression MP-10 login attempt with invalid username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(invalidCredentialsUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(page).toHaveURL(/\/$/);
});
