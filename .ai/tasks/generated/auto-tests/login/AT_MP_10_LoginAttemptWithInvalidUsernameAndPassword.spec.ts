import { test, expect } from '@fixtures/base.fixture';
import { invalidCredentialsUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_10_Login_attempt_with_invalid_username_and_password.spec.ts
 */
test('@regression MP-10 login attempt with invalid username and password', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(invalidCredentialsUser.username, invalidCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
