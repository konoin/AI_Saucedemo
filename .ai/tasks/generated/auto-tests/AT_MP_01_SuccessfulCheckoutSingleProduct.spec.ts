import { test, expect } from '@fixtures/base.fixture';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-01
 */
test('@critical @smoke @regression MP-01 successful checkout with single product', async ({
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

  await expect.poll(() => cartPage.hasProduct(product.name)).toBe(true);
  await expect.poll(() => cartPage.getItemPrice(product.name)).toBe(product.price);

  await cartPage.proceedToCheckout();
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect.poll(() => checkoutPage.getOverviewProductNames()).toContain(product.name);
  await expect.poll(() => checkoutPage.getOverviewItemPrice(product.name)).toBe(product.price);
  await expect.poll(() => checkoutPage.getTotal()).toMatch(/^\$\d+\.\d{2}$/);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
