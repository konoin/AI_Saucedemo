import { Page } from '@playwright/test';
import { cartSelectors } from '@constants/selectors';

export class CartPage {
  constructor(private readonly page: Page) {}

  async proceedToCheckout() {
    await this.clickCheckout();
  }

  async clickCheckout() {
    await this.page.getByTestId(cartSelectors.checkout).click();
  }

  async hasProduct(productName: string): Promise<boolean> {
    const item = this.page.locator('.cart_item').filter({ hasText: productName });
    return item.isVisible();
  }

  async getItemPrice(productName: string): Promise<string> {
    const item = this.page.locator('.cart_item').filter({ hasText: productName });
    return (await item.locator('.inventory_item_price').textContent())?.trim() ?? '';
  }
}
