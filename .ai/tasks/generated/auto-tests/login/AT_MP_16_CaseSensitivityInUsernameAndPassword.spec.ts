import { test, expect } from '@fixtures/base.fixture';
import { alteredCaseCredentialsUser, LOGIN_ERROR_MESSAGES } from '@data/users';

/**
 * Source Artifact: TC-MP_16_Case_sensitivity_in_username_and_password.spec.ts
 */
test('@critical @regression MP-16 case sensitivity in username and password', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(alteredCaseCredentialsUser.username, alteredCaseCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
});
