import { Locator, Page } from '@playwright/test';
import { inventorySelectors } from '@constants/selectors';

const PRODUCT_ADD_TO_CART_SELECTORS: Record<string, string> = {
  'Sauce Labs Backpack': inventorySelectors.addToCartBackpack,
  'Sauce Labs Bike Light': inventorySelectors.addToCartBikeLight,
  'Sauce Labs Bolt T-Shirt': inventorySelectors.addToCartBoltTShirt,
};

export class InventoryPage {
  readonly inventoryItems: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;

  constructor(private readonly page: Page) {
    this.inventoryItems = page.getByTestId(inventorySelectors.item);
    this.productNames = page.getByTestId(inventorySelectors.itemName);
    this.productPrices = page.getByTestId(inventorySelectors.itemPrice);
  }

  async addBackpackToCart() {
    await this.page
      .getByTestId(inventorySelectors.addToCartBackpack)
      .click();
  }

  async addProductToCart(productName: string) {
    const selector = PRODUCT_ADD_TO_CART_SELECTORS[productName];

    if (!selector) {
      throw new Error(`No add-to-cart selector mapped for product: ${productName}`);
    }

    await this.page.getByTestId(selector).click();
  }

  async openCart() {
    await this.page.getByTestId(inventorySelectors.shoppingCartLink).click();
  }

  async getCartBadgeCount(): Promise<number> {
    const badge = this.page.getByTestId(inventorySelectors.shoppingCartBadge);

    if (!(await badge.isVisible())) {
      return 0;
    }

    return Number((await badge.textContent())?.trim() ?? 0);
  }

  async getProductsCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async getProductNames(): Promise<string[]> {
    return this.productNames
      .allTextContents()
      .then((names) => names.map((name) => name.trim()));
  }

  async getProductPrices(): Promise<string[]> {
    return this.productPrices
      .allTextContents()
      .then((prices) => prices.map((price) => price.trim()));
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await this.page.getByRole('link', { name: 'Logout' }).click();
  }
}
