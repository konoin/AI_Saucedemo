import { test, expect } from '@fixtures/base.fixture';
import { emptyPasswordUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_06_Login_attempt_with_empty_password.spec.ts
 */
test('@critical @regression MP-06 login attempt with empty password', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(emptyPasswordUser.username, emptyPasswordUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.passwordRequired);
});
