import { expect, Page } from '@playwright/test';
import { checkoutSelectors } from '@constants/selectors';

export class CheckoutCompletePage {
  constructor(private readonly page: Page) {}

  async expectThankYouMessage(message: string) {
    await expect(this.page.getByTestId(checkoutSelectors.completeHeader)).toContainText(
      message,
    );
  }
}
