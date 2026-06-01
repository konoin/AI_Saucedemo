import { test, expect } from '@fixtures/base.fixture';
import { invalidCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_10
 */
test('@regression MP-10 login attempt with invalid username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(invalidCredentialsUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
