import { LoginPage } from '@pages/LoginPage';
import type { User } from '@types';

/**
 * Template: framework/flows/<feature>.flow.ts
 * Rules: orchestrate pages only — no locators, no assertions.
 */
export class ExampleFlow {
  constructor(private readonly loginPage: LoginPage) {}

  async signInAs(user: User) {
    await this.loginPage.login(user.username, user.password);
  }
}
