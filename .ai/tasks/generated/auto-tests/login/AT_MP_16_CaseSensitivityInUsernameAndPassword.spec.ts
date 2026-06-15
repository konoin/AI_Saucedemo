import { test, expect } from '@fixtures/base.fixture';
import { caseVariantUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-MP-16
 */
test('@critical @regression MP-16 case sensitivity in username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(caseVariantUser);

  await expect.poll(() => loginPage.getErrorMessage()).toBe(CREDENTIALS_MISMATCH_ERROR);
  await expect(page).not.toHaveURL(/inventory/);
  await expect(loginPage.usernameInput).toBeVisible();
});
