import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';

// MP-16 - Case sensitivity in username and password
// Tags: @regression @critical

test.describe('MP-16 - Case sensitivity in username and password', () => {
  test('should reject login when username and/or password case does not match @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const alteredCaseUsername = 'STANDARD_user'; // altered case from expected 'standard_user'
    const alteredCasePassword = 'SECRET_SAUCE'; // altered case from expected 'secret_sauce'

    await loginPage.goto();

    // Act
    await loginPage.login(alteredCaseUsername, alteredCasePassword);

    // Assert
    // Expect an error message to be shown and non-empty (clear failure message)
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect((errorMessage ?? '').trim().length).toBeGreaterThan(0);

    // Also ensure we did not navigate to a logged-in page by checking login button is still visible
    expect(await loginPage.isVisible()).toBeTruthy();
  });
});
