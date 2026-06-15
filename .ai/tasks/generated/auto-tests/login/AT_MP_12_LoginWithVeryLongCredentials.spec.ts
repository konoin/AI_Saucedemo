import { test, expect } from '@fixtures/base.fixture';
import { longCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const CREDENTIALS_MISMATCH_ERROR =
  'Epic sadface: Username and password do not match any user in this service';

/**
 * Source Test Case: TC-MP-12
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
  await loginFlow.loginAs(longCredentialsUser);

  expect(serverErrors, `Unexpected server errors: ${serverErrors.join(', ')}`).toEqual([]);
  await expect.poll(() => loginPage.getErrorMessage()).toBe(CREDENTIALS_MISMATCH_ERROR);
  await expect(page).toHaveURL(/\/$/);
  await expect(loginPage.usernameInput).toBeVisible();
});
