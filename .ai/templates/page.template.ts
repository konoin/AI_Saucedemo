import { Locator, Page } from '@playwright/test';
import { Selectors } from '@constants/selectors';

/**
 * Template: framework/pages/<Screen>Page.ts
 * Rules: atomic methods, readonly locators, no assertions, no flows.
 */
export class ExamplePage {
  readonly exampleField: Locator;

  constructor(private readonly page: Page) {
    this.exampleField = page.getByTestId(Selectors.login.username);
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillExampleField(value: string) {
    await this.exampleField.fill(value);
  }

  async clickSubmit() {
    await this.page.getByTestId(Selectors.login.loginButton).click();
  }
}
