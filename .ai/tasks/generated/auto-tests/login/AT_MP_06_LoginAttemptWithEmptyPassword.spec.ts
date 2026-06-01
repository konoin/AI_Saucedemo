import { test, expect } from '@fixtures/base.fixture';
import { emptyPasswordUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_06
 */
test('@critical @regression MP-06 login attempt with empty password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(emptyPasswordUser);

  await expect(loginPage.errorMessage).toHaveText('Epic sadface: Password is required');
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
