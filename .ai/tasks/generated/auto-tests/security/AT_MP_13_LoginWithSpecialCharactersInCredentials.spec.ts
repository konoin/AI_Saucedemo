import { test, expect } from '@fixtures/base.fixture';
import { specialCharactersUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_13
 */
test('@critical @regression MP-13 login with special characters in credentials is rejected safely', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(specialCharactersUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(loginPage.errorMessage).not.toContainText(specialCharactersUser.username);
  await expect(page).toHaveURL(/\/$/);
});
