import { test, expect } from '@fixtures/base.fixture';
import { longInputCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-09
 */
test('@critical @regression MP-09 checkout accepts very long input values without app failure', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
  checkoutCompletePage,
}) => {
  const loginFlow = new LoginFlow(loginPage);
  const product = PRODUCTS.backpack;

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await inventoryPage.addProductToCart(product.name);
  await inventoryPage.openCart();
  await cartPage.proceedToCheckout();

  await checkoutPage.fillShippingInfo(longInputCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect(page).toHaveURL(/checkout-step-two/);
  await expect.poll(() => checkoutPage.getOverviewProductNames()).toContain(product.name);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
