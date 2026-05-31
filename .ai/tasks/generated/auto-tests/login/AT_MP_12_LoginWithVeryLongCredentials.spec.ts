import { test, expect } from '@fixtures/base.fixture';
import { veryLongCredentialsUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-MP_12
 */
test('@critical @regression MP-12 login with very long credentials is rejected without server errors', async ({
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

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(veryLongCredentialsUser);

  // Assert
  expect(serverErrors, `Unexpected server errors: ${serverErrors.join(', ')}`).toHaveLength(0);
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(page).toHaveURL(/\/$/);
});
