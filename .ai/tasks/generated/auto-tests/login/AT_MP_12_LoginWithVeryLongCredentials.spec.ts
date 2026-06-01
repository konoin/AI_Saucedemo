import { test, expect } from '@fixtures/base.fixture';
import { veryLongCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const AUTHENTICATION_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-MP_12
 */
test('@critical @regression MP-12 login with very long credentials', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);
  const serverErrors: string[] = [];

  page.on('response', (response) => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await loginPage.goto();
  await loginFlow.loginAs(veryLongCredentialsUser);

  await expect(loginPage.errorMessage).toHaveText(AUTHENTICATION_ERROR);
  await expect(page).toHaveURL(/saucedemo\.com\/$/);
  expect(serverErrors, `Unexpected server errors: ${serverErrors.join(', ')}`).toHaveLength(0);
});
