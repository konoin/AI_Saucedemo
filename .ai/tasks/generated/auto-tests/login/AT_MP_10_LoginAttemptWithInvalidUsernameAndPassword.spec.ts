import { test, expect } from '@fixtures/base.fixture';
import { invalidCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT-MP-10
 */
test('@regression MP-10 login attempt with invalid username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(invalidCredentialsUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(CREDENTIALS_MISMATCH_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
