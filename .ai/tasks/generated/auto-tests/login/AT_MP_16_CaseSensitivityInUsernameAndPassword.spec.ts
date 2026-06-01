import { test, expect } from '@fixtures/base.fixture';
import { caseVariantUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-MP_16
 */
test('@critical @regression MP-16 case sensitivity in username and password', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(caseVariantUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
});
