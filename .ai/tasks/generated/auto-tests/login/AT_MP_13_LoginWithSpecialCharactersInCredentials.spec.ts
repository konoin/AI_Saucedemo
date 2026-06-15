import { test, expect } from '@fixtures/base.fixture';
import { specialCharacterUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT-MP-13
 */
test('@critical @regression MP-13 login with special characters in credentials', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(specialCharacterUser);

  const errorText = await loginPage.getErrorMessage();
  expect(errorText).toBe(CREDENTIALS_MISMATCH_ERROR);
  expect(errorText).not.toContain(specialCharacterUser.username);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
