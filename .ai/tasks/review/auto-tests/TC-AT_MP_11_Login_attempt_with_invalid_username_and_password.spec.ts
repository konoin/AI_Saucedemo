import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { LoginFlows } from '@flows/login.flow';

test.describe('MP-11 - Login attempt with invalid username and password', () => {
  test('MP-11 - Login attempt with invalid username and password @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const loginFlows = new LoginFlows(loginPage);

    await loginPage.goto();

    // Act
    await loginFlows.loginAs('userX', 'passY');

    // Assert
    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Username and password do not match any user in this service'
    );

    // Ensure no session was created - user remains on login page
    await expect(page).toHaveURL(/.*login.*/);
  });
});
