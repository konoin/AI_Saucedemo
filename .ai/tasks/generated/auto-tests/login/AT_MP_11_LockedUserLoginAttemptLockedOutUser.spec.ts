import { test, expect } from '@fixtures/base.fixture';
import { lockedOutUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const LOCKED_OUT_ERROR = 'Epic sadface: Sorry, this user has been locked out.';

/**
 * Source Test Case: TC-AT-MP-11
 */
test('@critical @regression MP-11 locked user login attempt locked out user', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(lockedOutUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(LOCKED_OUT_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/inventory/);
});
