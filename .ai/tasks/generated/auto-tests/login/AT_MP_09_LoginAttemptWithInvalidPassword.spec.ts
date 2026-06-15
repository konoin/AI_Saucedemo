import { test, expect } from '@fixtures/base.fixture';
import { invalidPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT-MP-09
 */
test('@critical @regression MP-09 login attempt with invalid password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(invalidPasswordUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(CREDENTIALS_MISMATCH_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
