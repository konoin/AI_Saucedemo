import { test, expect } from '@fixtures/base.fixture';
import { emptyPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const PASSWORD_REQUIRED_ERROR = 'Epic sadface: Password is required';

/**
 * Source Test Case: TC-AT-MP-06
 */
test('@critical @regression MP-06 login attempt with empty password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(emptyPasswordUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(PASSWORD_REQUIRED_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
