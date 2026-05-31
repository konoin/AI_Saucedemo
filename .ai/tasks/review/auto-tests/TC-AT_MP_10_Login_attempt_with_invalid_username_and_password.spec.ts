import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

test.describe('MP-10 - Login attempt with invalid username and password', () => {
  test('MP-10 - Login attempt with invalid username and password @regression', async ({ page }) => {
    // Tag the test for reporting
    test.info().annotations.push({ type: 'tag', description: '@regression' });

    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login('bogus', 'bogus_pw');

    // Assert
    // Verify error message indicates username/password do not match any user
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('do not match any user');

    // Verify user remains on the login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
