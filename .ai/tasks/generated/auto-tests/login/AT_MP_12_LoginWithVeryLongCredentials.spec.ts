import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES, veryLongCredentialsUser } from '@data/users';

/**
 * Source Artifact: TC-MP_12_login_with_very_long_credentials.spec.ts
 */
test('@critical @regression MP-12 login with very long credentials', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(veryLongCredentialsUser.username, veryLongCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
