import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES, whitespaceCredentialsUser } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_15_Credentials_with_leading_and_trailing_whitespace.spec.ts
 */
test('@critical @regression MP-15 credentials with leading and trailing whitespace', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(whitespaceCredentialsUser.username, whitespaceCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
