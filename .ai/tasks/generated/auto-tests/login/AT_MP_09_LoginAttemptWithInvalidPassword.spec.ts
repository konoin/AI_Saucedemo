import { test, expect } from '@fixtures/base.fixture';
import { invalidPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_09
 */
test('@critical @regression MP-09 login attempt with invalid password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(invalidPasswordUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(page).toHaveURL(/\/$/);
});
