import { Page } from '@playwright/test';
import { cartSelectors } from '@constants/selectors';

export class CartPage {
  constructor(private readonly page: Page) {}

  async proceedToCheckout() {
    await this.page.getByTestId(cartSelectors.checkout).click();
  }
}
