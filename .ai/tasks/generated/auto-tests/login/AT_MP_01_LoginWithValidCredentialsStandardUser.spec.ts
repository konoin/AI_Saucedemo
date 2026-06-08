import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Artifact: TC-AT_MP_01_Login_with_valid_credentials_standard_user.spec.ts
 */
test('@critical @smoke @regression MP-01 login with valid credentials standard user', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect.poll(() => inventoryPage.getProductsCount()).toBeGreaterThan(0);
  await expect(loginPage.errorMessage).toBeHidden();
});
