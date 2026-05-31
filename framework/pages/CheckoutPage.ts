import { Page } from '@playwright/test';
import { checkoutSelectors, inventorySelectors } from '@constants/selectors';
import type { CheckoutCustomer } from '@types';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillShippingInfo(customer: CheckoutCustomer) {
    await this.fillFirstName(customer.firstName);
    await this.fillLastName(customer.lastName);
    await this.fillPostalCode(customer.postalCode);
  }

  async fillFirstName(firstName: string) {
    await this.page.getByTestId(checkoutSelectors.firstName).fill(firstName);
  }

  async fillLastName(lastName: string) {
    await this.page.getByTestId(checkoutSelectors.lastName).fill(lastName);
  }

  async fillPostalCode(postalCode: string) {
    await this.page.getByTestId(checkoutSelectors.postalCode).fill(postalCode);
  }

  async continueCheckout() {
    await this.page.getByTestId(checkoutSelectors.continueButton).click();
  }

  async finishOrder() {
    await this.page.getByTestId(checkoutSelectors.finish).click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.page.getByTestId(checkoutSelectors.error).textContent())?.trim() ?? '';
  }

  async getPageTitle(): Promise<string> {
    return (await this.page.getByTestId(checkoutSelectors.title).textContent())?.trim() ?? '';
  }

  async getOverviewProductNames(): Promise<string[]> {
    return this.page
      .getByTestId(inventorySelectors.itemName)
      .allTextContents()
      .then((names) => names.map((name) => name.trim()));
  }

  async getOverviewItemCount(): Promise<number> {
    return this.page.getByTestId(inventorySelectors.item).count();
  }

  async getOverviewItemPrice(productName: string): Promise<string> {
    const item = this.page
      .getByTestId(inventorySelectors.item)
      .filter({ hasText: productName });

    return (await item.getByTestId(inventorySelectors.itemPrice).textContent())?.trim() ?? '';
  }

  async getSubtotal(): Promise<string> {
    return this.getCheckoutAmount(checkoutSelectors.subtotal);
  }

  async getTax(): Promise<string> {
    return this.getCheckoutAmount(checkoutSelectors.tax);
  }

  async getTotal(): Promise<string> {
    return this.getCheckoutAmount(checkoutSelectors.total);
  }

  private async getCheckoutAmount(testId: string): Promise<string> {
    const label = (await this.page.getByTestId(testId).textContent()) ?? '';
    return label.replace(/^[^$]*/, '').trim();
  }
}
