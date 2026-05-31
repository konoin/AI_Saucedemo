import { test, expect } from '@fixtures/base.fixture';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { PRODUCTS } from '@data/products';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-03
 */
test('@critical @smoke @regression MP-03 remove an item before checkout and purchase remaining item', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
  checkoutCompletePage,
}) => {
  const loginFlow = new LoginFlow(loginPage);
  const keptProduct = PRODUCTS.backpack;
  const removedProduct = PRODUCTS.bikeLight;

  await loginPage.goto();
  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await inventoryPage.addProductToCart(keptProduct.name);
  await inventoryPage.addProductToCart(removedProduct.name);
  await inventoryPage.openCart();

  await cartPage.removeProduct(removedProduct.name);

  await expect.poll(() => cartPage.getProductNames()).toEqual([keptProduct.name]);

  await cartPage.proceedToCheckout();
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect.poll(() => checkoutPage.getOverviewProductNames()).toEqual([keptProduct.name]);
  await expect.poll(() => checkoutPage.getOverviewItemPrice(keptProduct.name)).toBe(keptProduct.price);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
