import { test, expect } from '@fixtures/base.fixture';
import { sqlInjectionUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const SENSITIVE_ERROR_TERMS = ['exception', 'stack', 'sql', 'database'] as const;

/**
 * Source Test Case: TC-AT_MP_14
 */
test('@critical @regression MP-14 SQL injection attempt in credentials is rejected safely', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(sqlInjectionUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  const errorText = (await loginPage.getErrorMessage()).toLowerCase();

  for (const term of SENSITIVE_ERROR_TERMS) {
    expect(errorText).not.toContain(term);
  }

  await expect(page).toHaveURL(/\/$/);
});
