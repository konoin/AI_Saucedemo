import { test, expect } from '@fixtures/base.fixture';
import { invalidUsernameUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_08
 */
test('@critical @regression MP-08 login attempt with invalid username', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(invalidUsernameUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(page).toHaveURL(/\/$/);
});
