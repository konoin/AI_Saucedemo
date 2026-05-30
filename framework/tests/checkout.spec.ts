import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { defaultCheckoutCustomer } from '@data/checkout-customer';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

test('successful checkout flow', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
  checkoutCompletePage,
}) => {
  await loginPage.login(standardUser.username, standardUser.password);

  await expect(page).toHaveURL(/inventory/);

  await inventoryPage.addBackpackToCart();
  await inventoryPage.openCart();
  await cartPage.proceedToCheckout();
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();
  await checkoutPage.finishOrder();
  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
