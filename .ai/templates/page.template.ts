import { Page } from '@playwright/test';
import { Selectors } from '@constants/selectors';

/**
 * Canonical Page Object template.
 * Copy to framework/pages/<Screen>Page.ts and rename.
 */
export class ExamplePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async performPrimaryAction(value: string) {
    await this.page.getByTestId(Selectors.login.username).fill(value);
  }
}
