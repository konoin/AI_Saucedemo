import { test, expect } from '@fixtures/base.fixture';
import { LOGIN_ERROR_MESSAGES, sqlInjectionCredentialsUser } from '@data/users';

/**
 * Source Artifact: TC-AT_MP_14_Attempt_SQL_injection_in_username_and_password_fields.spec.ts
 */
test('@critical @regression MP-14 attempt SQL injection in username and password fields', async ({
  page,
  loginPage,
}) => {
  await loginPage.goto();
  await loginPage.login(sqlInjectionCredentialsUser.username, sqlInjectionCredentialsUser.password);

  await expect(page).toHaveURL(/saucedemo\.com\/(?:index\.html)?$/);
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR_MESSAGES.invalidCredentials);
  await expect(loginPage.errorMessage).not.toContainText(/exception|stack|sql|database/i);
});
