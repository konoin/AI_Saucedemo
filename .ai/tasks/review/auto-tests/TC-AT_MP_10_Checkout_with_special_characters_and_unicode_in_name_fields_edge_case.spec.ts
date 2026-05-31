import { expect } from '@playwright/test';
import { test } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { ProductsPage } from '@pages/products.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutYourInfoPage } from '@pages/checkoutYourInfo.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';

// @regression
// @critical
test.describe('MP-10 - Checkout with special characters and unicode in name fields (edge case)', () => {
  test('MP-10 - Checkout with special characters and unicode in name fields (edge case) @regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutYourInfoPage = new CheckoutYourInfoPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);

    const username = 'standard_user';
    const password = 'secret_sauce';

    const firstName = "Álëx!@#$";
    const lastName = "O’Connor-测试";
    const postalCode = 'ABC-123';

    // Act
    await loginPage.goto();
    await loginPage.login(username, password);

    // add a product to cart using existing page object
    await productsPage.addFirstProductToCart();
    await productsPage.openCart();

    // proceed to checkout
    await cartPage.clickCheckout();

    // fill checkout information with special characters / unicode
    await checkoutYourInfoPage.fillFirstName(firstName);
    await checkoutYourInfoPage.fillLastName(lastName);
    await checkoutYourInfoPage.fillPostalCode(postalCode);
    await checkoutYourInfoPage.clickContinue();

    // Assert
    // Two valid outcomes: either the app proceeds to overview and allows finishing, or it shows a clear validation message.
    if (await checkoutOverviewPage.isOpen()) {
      // happy path: allow finish
      await checkoutOverviewPage.clickFinish();
      await expect(await checkoutCompletePage.isComplete()).toBeTruthy();
    } else {
      // validation path: expect a clear error message and no crash
      const errorVisible = await checkoutYourInfoPage.isValidationErrorVisible();
      expect(errorVisible).toBeTruthy();
      const errorText = await checkoutYourInfoPage.getValidationErrorText();
      expect(errorText).toBeTruthy();
      // ensure application didn't navigate away unexpectedly
      expect(await page.url()).toContain('checkout-step-one');
    }
  });
});
