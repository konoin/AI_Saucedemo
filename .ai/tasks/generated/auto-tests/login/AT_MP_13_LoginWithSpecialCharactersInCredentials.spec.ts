import { test, expect } from '@fixtures/base.fixture';
import { specialCharacterUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-AT_MP_13
 */
test('@critical @regression MP-13 login with special characters in credentials', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(specialCharacterUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(loginPage.errorMessage).not.toContainText(specialCharacterUser.username);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
});
