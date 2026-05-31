import { Locator, Page } from '@playwright/test';
import { loginSelectors } from '@constants/selectors';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByTestId(loginSelectors.username);
    this.passwordInput = page.getByTestId(loginSelectors.password);
    this.loginButton = page.getByTestId(loginSelectors.loginButton);
    this.errorMessage = page.getByTestId(loginSelectors.error);
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }
}
