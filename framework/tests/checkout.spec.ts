import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { defaultCheckoutCustomer } from '@data/checkout-customer';
import { LoginFlow } from '@flows/login.flow';
import { CheckoutFlow } from '@flows/checkout.flow';

const ORDER_COMPLETE_MESSAGE = 'Thank you for your order!';

test(
  '@critical @smoke @regression successful checkout flow',
  async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
    checkoutCompletePage,
  }) => {
    const loginFlow = new LoginFlow(loginPage);
    const checkoutFlow = new CheckoutFlow(
      inventoryPage,
      cartPage,
      checkoutPage,
    );

    await loginFlow.loginAs(standardUser);
    await expect(page).toHaveURL(/inventory/);

    await checkoutFlow.completeOrder(defaultCheckoutCustomer);

    await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
  },
);
