import { Page } from '@playwright/test';
import { inventorySelectors } from '@constants/selectors';

const PRODUCT_ADD_TO_CART: Record<string, string> = {
  'Sauce Labs Backpack': inventorySelectors.addToCartBackpack,
};

export class ProductsPage {
  constructor(private readonly page: Page) {}

  async isDisplayed(): Promise<boolean> {
    return this.page.url().includes('inventory');
  }

  async addProductToCart(productName: string) {
    const testId = PRODUCT_ADD_TO_CART[productName];
    if (!testId) {
      throw new Error(`No add-to-cart selector mapped for product: ${productName}`);
    }
    await this.page.getByTestId(testId).click();
  }

  async getCartBadgeCount(): Promise<string> {
    return (await this.page.locator('.shopping_cart_badge').textContent()) ?? '';
  }

  async openCart() {
    await this.page.getByTestId(inventorySelectors.shoppingCartLink).click();
  }
}
