import { test, expect } from '@fixtures/base.fixture';
import { emptyCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const USERNAME_REQUIRED_ERROR = 'Epic sadface: Username is required';

/**
 * Source Test Case: TC-AT-MP-07
 */
test('@critical @regression MP-07 login attempt with empty username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(emptyCredentialsUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(USERNAME_REQUIRED_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
