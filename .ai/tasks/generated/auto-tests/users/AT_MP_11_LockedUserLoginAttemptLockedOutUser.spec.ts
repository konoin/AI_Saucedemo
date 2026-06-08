import { test, expect } from '@fixtures/base.fixture';
import { lockedOutUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_11_Locked_user_login_attempt_locked_out_user.spec.ts
 */
test('@critical @regression MP-11 locked user login attempt locked out user', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(lockedOutUser.username, lockedOutUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.lockedOut);
});
