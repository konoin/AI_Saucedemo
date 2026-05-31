import { expect, Page } from '@playwright/test';
import { checkoutSelectors } from '@constants/selectors';

export class CheckoutCompletePage {
  constructor(private readonly page: Page) {}

  async isConfirmationVisible(): Promise<boolean> {
    return this.page.getByTestId(checkoutSelectors.completeHeader).isVisible();
  }

  async getConfirmationText(): Promise<string> {
    return (await this.page.getByTestId(checkoutSelectors.completeHeader).textContent()) ?? '';
  }

  async expectThankYouMessage(message: string) {
    await expect(this.page.getByTestId(checkoutSelectors.completeHeader)).toContainText(message);
  }
}
