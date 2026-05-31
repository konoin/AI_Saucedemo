import test from '@fixtures/base.fixture';
import { expect } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { LoginFlow } from '@flows/login.flow';
import { SELECTORS } from '@constants/selectors';
import { USERS } from '@data/users';

test('MP-09 - Login attempt with invalid password @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const loginFlow = new LoginFlow(loginPage);
  const username = USERS.STANDARD.username || 'standard_user';
  const invalidPassword = 'wrong_password';

  // Act
  await loginPage.goto();
  await loginFlow.login(username, invalidPassword);

  // Assert
  const errorLocator = loginPage.getLocator(SELECTORS.LOGIN.ERROR_MESSAGE);
  await expect(errorLocator).toBeVisible();
  await expect(errorLocator).toHaveText('Epic sadface: Username and password do not match any user in this service');
  await expect(page).toHaveURL('https://www.saucedemo.com/');
});