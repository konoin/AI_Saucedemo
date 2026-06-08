import { test, expect } from '@fixtures/base.fixture';
import { emptyUsernameUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_05_Login_attempt_with_empty_username.spec.ts
 */
test('@critical @regression MP-05 login attempt with empty username', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(emptyUsernameUser.username, emptyUsernameUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.usernameRequired);
});
