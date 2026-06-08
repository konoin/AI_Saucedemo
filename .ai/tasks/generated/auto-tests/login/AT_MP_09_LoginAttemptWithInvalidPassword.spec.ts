import { test, expect } from '@fixtures/base.fixture';
import { invalidPasswordUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_09_Login_attempt_with_invalid_password.spec.ts
 */
test('@critical @regression MP-09 login attempt with invalid password', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(invalidPasswordUser.username, invalidPasswordUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
