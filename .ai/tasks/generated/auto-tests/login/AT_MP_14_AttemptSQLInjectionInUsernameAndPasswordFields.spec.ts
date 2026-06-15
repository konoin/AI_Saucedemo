import { test, expect } from '@fixtures/base.fixture';
import { sqlInjectionUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';
const UNSAFE_ERROR_TERMS = ['exception', 'stack', 'sql', 'database'];

/**
 * Source Test Case: TC-AT-MP-14
 */
test('@critical @regression MP-14 attempt SQL injection in username and password fields', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(sqlInjectionUser);

  const errorText = await loginPage.getErrorMessage();
  const normalizedErrorText = errorText.toLowerCase();

  expect(errorText).toBe(CREDENTIALS_MISMATCH_ERROR);
  for (const unsafeTerm of UNSAFE_ERROR_TERMS) {
    expect(normalizedErrorText).not.toContain(unsafeTerm);
  }
  await expect(page).not.toHaveURL(/inventory/);
  await expect(loginPage.usernameInput).toBeVisible();
});
