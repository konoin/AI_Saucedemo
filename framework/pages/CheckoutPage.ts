import { Page } from '@playwright/test';
import { checkoutSelectors } from '@constants/selectors';
import type { CheckoutCustomer } from '@types';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillShippingInfo(customer: CheckoutCustomer) {
    await this.page.getByTestId(checkoutSelectors.firstName).fill(customer.firstName);
    await this.page.getByTestId(checkoutSelectors.lastName).fill(customer.lastName);
    await this.page.getByTestId(checkoutSelectors.postalCode).fill(customer.postalCode);
  }

  async continueCheckout() {
    await this.page.getByTestId(checkoutSelectors.continueButton).click();
  }

  async finishOrder() {
    await this.page.getByTestId(checkoutSelectors.finish).click();
  }
}
