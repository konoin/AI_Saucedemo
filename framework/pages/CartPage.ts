import { Page } from '@playwright/test';
import { cartSelectors, inventorySelectors } from '@constants/selectors';

const PRODUCT_REMOVE_SELECTORS: Record<string, string> = {
  'Sauce Labs Backpack': inventorySelectors.removeBackpack,
  'Sauce Labs Bike Light': inventorySelectors.removeBikeLight,
  'Sauce Bolt T-Shirt': inventorySelectors.removeBoltTShirt,
};

export class CartPage {
  constructor(private readonly page: Page) {}

  async proceedToCheckout() {
    await this.clickCheckout();
  }

  async clickCheckout() {
    await this.page.getByTestId(cartSelectors.checkout).click();
  }

  async hasProduct(productName: string): Promise<boolean> {
    const item = this.page
      .getByTestId(inventorySelectors.item)
      .filter({ hasText: productName });
    return item.isVisible();
  }

  async getItemPrice(productName: string): Promise<string> {
    const item = this.page
      .getByTestId(inventorySelectors.item)
      .filter({ hasText: productName });

    return (await item.getByTestId(inventorySelectors.itemPrice).textContent())?.trim() ?? '';
  }

  async getProductNames(): Promise<string[]> {
    return this.page
      .getByTestId(inventorySelectors.itemName)
      .allTextContents()
      .then((names) => names.map((name) => name.trim()));
  }

  async getItemCount(): Promise<number> {
    return this.page.getByTestId(inventorySelectors.item).count();
  }

  async removeProduct(productName: string) {
    const selector = PRODUCT_REMOVE_SELECTORS[productName];

    if (!selector) {
      throw new Error(`No remove selector mapped for product: ${productName}`);
    }

    await this.page.getByTestId(selector).click();
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getItemCount()) === 0;
  }
}
