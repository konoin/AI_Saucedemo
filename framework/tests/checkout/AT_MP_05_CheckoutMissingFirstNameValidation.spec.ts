import { test, expect } from '@fixtures/base.fixture';
import { missingFirstNameCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

/**
 * Source Test Case: TC-AT-MP-05
 */
test('@critical @regression MP-05 checkout with missing first name validates required field', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await inventoryPage.addProductToCart(PRODUCTS.backpack.name);
  await inventoryPage.openCart();
  await cartPage.proceedToCheckout();

  await checkoutPage.fillShippingInfo(missingFirstNameCustomer);
  await checkoutPage.continueCheckout();

  await expect(page).toHaveURL(/checkout-step-one/);
  await expect.poll(() => checkoutPage.getPageTitle()).toBe('Checkout: Your Information');
  await expect.poll(() => checkoutPage.getErrorMessage()).toBe('Error: First Name is required');
});
