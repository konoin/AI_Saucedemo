import { test, expect } from '@fixtures/base.fixture';
import { lockedOutUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_11
 */
test('@critical @regression MP-11 locked user login attempt is rejected', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(lockedOutUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Sorry, this user has been locked out.',
  );
  await expect(page).toHaveURL(/\/$/);
});
