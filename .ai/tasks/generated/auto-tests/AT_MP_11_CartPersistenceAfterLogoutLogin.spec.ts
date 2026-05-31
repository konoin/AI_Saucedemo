import { test, expect } from '@fixtures/base.fixture';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const PRODUCTS_TO_PERSIST = [PRODUCTS.backpack, PRODUCTS.bikeLight] as const;

/**
 * Source Test Case: TC-AT-MP-11
 */
test('@critical @regression MP-11 cart persists after logout and login', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);
  const expectedNames = PRODUCTS_TO_PERSIST.map((product) => product.name);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  for (const product of PRODUCTS_TO_PERSIST) {
    await inventoryPage.addProductToCart(product.name);
  }

  await inventoryPage.openCart();
  await expect.poll(() => cartPage.getProductNames()).toEqual(expectedNames);

  await page.goBack();
  await inventoryPage.logout();
  await expect(page).toHaveURL(/\/$/);

  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await inventoryPage.openCart();
  await expect.poll(() => cartPage.getProductNames()).toEqual(expectedNames);
});
