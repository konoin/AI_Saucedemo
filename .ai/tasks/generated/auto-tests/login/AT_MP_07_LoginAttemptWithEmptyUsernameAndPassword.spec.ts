import { test, expect } from '@fixtures/base.fixture';
import { emptyCredentialsUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_07_Login_attempt_with_empty_username_and_password.spec.ts
 */
test('@critical @regression MP-07 login attempt with empty username and password', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(emptyCredentialsUser.username, emptyCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.usernameRequired);
});
