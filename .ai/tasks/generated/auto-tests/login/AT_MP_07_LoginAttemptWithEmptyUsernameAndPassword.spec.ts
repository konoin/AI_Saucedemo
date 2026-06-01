import { test, expect } from '@fixtures/base.fixture';
import { emptyCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_07
 */
test('@critical @regression MP-07 login attempt with empty username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(emptyCredentialsUser);

  await expect(loginPage.errorMessage).toHaveText('Epic sadface: Username is required');
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
