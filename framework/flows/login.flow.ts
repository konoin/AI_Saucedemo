import { LoginPage } from '@pages/LoginPage';
import type { User } from '@types';

export class LoginFlow {
  constructor(private readonly loginPage: LoginPage) {}

  async loginAs(user: User) {
    await this.loginPage.login(user.username, user.password);
  }
}
