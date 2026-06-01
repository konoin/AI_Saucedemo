import { test, expect } from '@fixtures/base.fixture';
import { whitespaceCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_15
 */
test('@critical @regression MP-15 credentials with leading and trailing whitespace', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(whitespaceCredentialsUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
});
