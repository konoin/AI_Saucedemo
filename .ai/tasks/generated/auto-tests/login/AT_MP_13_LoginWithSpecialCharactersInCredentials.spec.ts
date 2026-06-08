import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES, specialCharacterCredentialsUser } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_13_Login_with_special_characters_in_credentials.spec.ts
 */
test('@critical @regression MP-13 login with special characters in credentials', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(
    specialCharacterCredentialsUser.username,
    specialCharacterCredentialsUser.password,
  );

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
  await expect(loginPage.errorMessage).not.toContainText(specialCharacterCredentialsUser.username);
});
