import { test, expect } from '@fixtures/base.fixture';
import { emptyUsernameUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_05
 */
test('@critical @regression MP-05 login attempt with empty username', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(emptyUsernameUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText('Epic sadface: Username is required');
  await expect(page).toHaveURL(/\/$/);
});
