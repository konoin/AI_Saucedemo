import { test, expect } from '@fixtures/base.fixture';
import { lockedOutUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT_MP_11
 */
test('@critical @regression MP-11 locked user login attempt locked out user', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(lockedOutUser);

  await expect(loginPage.errorMessage).toHaveText(
    'Epic sadface: Sorry, this user has been locked out.',
  );
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
});
