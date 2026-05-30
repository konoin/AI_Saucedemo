import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Canonical test spec template.
 * Copy to framework/tests/<feature>.spec.ts
 *
 * Structure: Arrange → Act → Assert
 * Tags: @smoke @regression @critical (pick what applies)
 */
test('@smoke @regression example scenario', async ({ page, loginPage }) => {
  const loginFlow = new LoginFlow(loginPage);

  // Arrange & Act
  await loginFlow.loginAs(standardUser);

  // Assert
  await expect(page).toHaveURL(/inventory/);
});
