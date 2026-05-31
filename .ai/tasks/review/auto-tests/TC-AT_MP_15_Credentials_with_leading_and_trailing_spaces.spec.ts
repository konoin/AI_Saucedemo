import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { ProductsPage } from '@pages/products.page';
import { LoginFlow } from '@flows/login.flow';

test.describe('MP-15 - Credentials with leading and trailing spaces', () => {
  test('@regression @critical - should handle credentials with leading/trailing spaces', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const loginFlow = new LoginFlow(loginPage);

    const usernameWithSpaces = ' standard_user ';
    const passwordWithSpaces = ' secret_sauce ';

    await loginPage.goto();

    // Act
    await loginFlow.login(usernameWithSpaces, passwordWithSpaces);

    // Assert
    // Accept either: successful login (products page shown) OR a consistent invalid credentials message.
    // This validates that the app either trims whitespace (preferred) or returns the expected error, and does not throw unexpected errors.
    const isProductsVisible = await productsPage.isLoaded().catch(() => false);

    if (isProductsVisible) {
      // Successful login path
      await expect(productsPage.isLoaded()).resolves.toBeTruthy();
    } else {
      // Error path: ensure a visible, expected error message is shown
      const errorText = await loginPage.getLoginErrorMessage();
      expect(errorText).toBeTruthy();
      // Known Sauce Demo invalid credentials message; allow substring to account for minor phrasing differences
      expect(errorText!.toLowerCase()).toContain('username');
      expect(errorText!.toLowerCase()).toContain('password');
    }
  });
});
