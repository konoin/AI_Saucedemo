import { Page } from '@playwright/test';
import { checkoutSelectors } from '@constants/selectors';

export class CheckoutOverviewPage {
  constructor(private readonly page: Page) {}

  async getProductName(): Promise<string> {
    return (await this.page.locator('.inventory_item_name').first().textContent())?.trim() ?? '';
  }

  async getProductQuantity(): Promise<string> {
    return (await this.page.locator('.cart_quantity').first().textContent())?.trim() ?? '';
  }

  async getSubtotal(): Promise<string> {
    const text = (await this.page.locator('.summary_subtotal_label').textContent()) ?? '';
    return text.replace('Item total: ', '').trim();
  }

  async getTax(): Promise<string> {
    const text = (await this.page.locator('.summary_tax_label').textContent()) ?? '';
    return text.replace('Tax: ', '').trim();
  }

  async getTotal(): Promise<string> {
    const text = (await this.page.locator('.summary_total_label').textContent()) ?? '';
    return text.replace('Total: ', '').trim();
  }

  async finish() {
    await this.page.getByTestId(checkoutSelectors.finish).click();
  }
}
