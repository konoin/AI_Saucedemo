import { test, expect } from '@fixtures/base.fixture';
import { invalidPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_09
 */
test('@critical @regression MP-09 login attempt with invalid password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(invalidPasswordUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
