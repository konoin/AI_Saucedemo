import { test, expect } from '@fixtures/base.fixture';
import { caseVariantUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-MP_16
 */
test('@critical @regression MP-16 username and password matching is case-sensitive', async ({
  page,
  loginPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange
  await loginPage.goto();

  // Act
  await loginFlow.loginAs(caseVariantUser);

  // Assert
  await expect(loginPage.errorMessage).toContainText(
    'Epic sadface: Username and password do not match any user in this service',
  );
  await expect(loginPage.loginButton).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
