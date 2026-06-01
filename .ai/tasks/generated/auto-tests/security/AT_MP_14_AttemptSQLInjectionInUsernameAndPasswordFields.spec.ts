import { test, expect } from '@fixtures/base.fixture';
import { sqlInjectionUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_14
 */
test('@critical @regression MP-14 attempt SQL injection in username and password fields', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(sqlInjectionUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(loginPage.errorMessage).not.toContainText(/exception|stack|sql|database/i);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
});
