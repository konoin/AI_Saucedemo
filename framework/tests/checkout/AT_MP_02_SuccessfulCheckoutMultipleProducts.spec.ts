import { test, expect } from '@fixtures/base.fixture';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';
const PRODUCTS_TO_PURCHASE = [
  PRODUCTS.backpack,
  PRODUCTS.bikeLight,
  PRODUCTS.boltTShirt,
] as const;

/**
 * Source Test Case: TC-AT-MP-02
 */
test('@critical @smoke @regression MP-02 successful checkout with multiple distinct products', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
  checkoutCompletePage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  for (const product of PRODUCTS_TO_PURCHASE) {
    await inventoryPage.addProductToCart(product.name);
  }

  await expect.poll(() => inventoryPage.getCartBadgeCount()).toBe(PRODUCTS_TO_PURCHASE.length);

  await inventoryPage.openCart();

  const expectedNames = PRODUCTS_TO_PURCHASE.map((product) => product.name);
  await expect.poll(() => cartPage.getProductNames()).toEqual(expectedNames);

  for (const product of PRODUCTS_TO_PURCHASE) {
    await expect.poll(() => cartPage.getItemPrice(product.name)).toBe(product.price);
  }

  await cartPage.proceedToCheckout();
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect.poll(() => checkoutPage.getOverviewProductNames()).toEqual(expectedNames);
  await expect.poll(() => checkoutPage.getSubtotal()).toBe('$55.97');
  await expect.poll(() => checkoutPage.getTotal()).toMatch(/^\$\d+\.\d{2}$/);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
