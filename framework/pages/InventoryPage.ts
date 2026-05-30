import { Page } from '@playwright/test';
import { inventorySelectors } from '@constants/selectors';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async addBackpackToCart() {
    await this.page
      .getByTestId(inventorySelectors.addToCartBackpack)
      .click();
  }

  async openCart() {
    await this.page.getByTestId(inventorySelectors.shoppingCartLink).click();
  }
}
