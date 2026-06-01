import { test, expect } from '@fixtures/base.fixture';
import { invalidUsernameUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_08
 */
test('@critical @regression MP-08 login attempt with invalid username', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(invalidUsernameUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
