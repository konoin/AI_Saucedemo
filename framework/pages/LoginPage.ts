import { Page } from '@playwright/test';
import { loginSelectors } from '../constants/selectors';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(username: string, password: string) {
    await this.page.goto('/');
    await this.page.getByTestId(loginSelectors.username).fill(username);
    await this.page.getByTestId(loginSelectors.password).fill(password);
    await this.page.getByTestId(loginSelectors.loginButton).click();
  }
}
