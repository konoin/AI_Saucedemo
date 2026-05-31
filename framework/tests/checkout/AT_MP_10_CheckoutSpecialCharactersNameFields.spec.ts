import { test, expect } from '@fixtures/base.fixture';
import { specialCharacterCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-10
 */
test('@critical @regression MP-10 checkout accepts special characters in name fields', async ({
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

  await checkoutPage.fillShippingInfo(specialCharacterCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect(page).toHaveURL(/checkout-step-two/);
  await expect.poll(() => checkoutPage.getOverviewProductNames()).toContain(product.name);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
