import { test, expect } from '@fixtures/base.fixture';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-12
 *
 * TODO: Sauce Demo does not expose a network retry banner or server-side order
 * submission response for the finish action. This test validates a deterministic
 * transient-offline recovery path without asserting non-existent retry UI.
 */
test('@critical @regression MP-12 order can complete after transient network interruption', async ({
  page,
  context,
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
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect(page).toHaveURL(/checkout-step-two/);
  await expect.poll(() => checkoutPage.getOverviewProductNames()).toContain(product.name);

  await context.setOffline(true);
  await context.setOffline(false);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
