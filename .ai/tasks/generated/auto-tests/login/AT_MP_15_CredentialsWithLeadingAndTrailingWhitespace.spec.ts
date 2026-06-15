import { test, expect } from '@fixtures/base.fixture';
import { whitespaceCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT-MP-15
 */
test('@critical @regression MP-15 credentials with leading and trailing whitespace', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(whitespaceCredentialsUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(CREDENTIALS_MISMATCH_ERROR);
  await expect(page).not.toHaveURL(/inventory/);
  await expect(loginPage.usernameInput).toBeVisible();
});
