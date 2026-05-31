import { test, expect } from '@fixtures/base.fixture';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

/**
 * Source Test Case: TC-AT-MP-08
 *
 * TODO: Sauce Demo currently allows checkout to proceed with an empty cart. If
 * the product requirement is to block checkout, promote a defect and update
 * this assertion after the application behavior changes.
 */
test('@critical @regression MP-08 attempt checkout with an empty cart documents current behavior', async ({
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

  await inventoryPage.openCart();

  await expect.poll(() => cartPage.isEmpty()).toBe(true);

  await cartPage.proceedToCheckout();
  await checkoutPage.fillShippingInfo(defaultCheckoutCustomer);
  await checkoutPage.continueCheckout();

  await expect(page).toHaveURL(/checkout-step-two/);
  await expect.poll(() => checkoutPage.getOverviewItemCount()).toBe(0);

  await checkoutPage.finishOrder();

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
