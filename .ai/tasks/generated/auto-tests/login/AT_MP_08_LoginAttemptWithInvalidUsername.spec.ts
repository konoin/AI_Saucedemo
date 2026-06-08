import { test, expect } from '@fixtures/base.fixture';
import { invalidUsernameUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_08_Login_attempt_with_invalid_username.spec.ts
 */
test('@critical @regression MP-08 login attempt with invalid username', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(invalidUsernameUser.username, invalidUsernameUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
