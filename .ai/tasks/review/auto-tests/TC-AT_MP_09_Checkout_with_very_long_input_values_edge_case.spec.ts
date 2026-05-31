import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { ProductsPage } from '@pages/products.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutYourInfoPage } from '@pages/checkoutYourInformation.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';

test('AT-MP-09 - Checkout with very long input values (edge case) @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutYourInfoPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  // Use existing login flow via LoginPage
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  // Act
  // Add a product to the cart and open the cart
  await productsPage.addFirstProductToCart();
  await productsPage.openCart();

  // Click 'Checkout'
  await cartPage.clickCheckout();

  // Edge case inputs: 500-char first and last name, postal code '99999'
  const longString = 'a'.repeat(500);
  await checkoutInfoPage.fillYourInformation(longString, longString, '99999');
  await checkoutInfoPage.clickContinue();

  // Assert
  // The app should either accept the values and complete checkout, or show a clear validation message.
  // Check for two possible outcomes: proceed to overview -> finish -> confirmation, OR validation message on the info page.

  // 1) Try to detect Checkout Overview page within a short timeout
  const overviewVisible = await checkoutOverviewPage.isVisible({ timeout: 2000 }).catch(() => false);

  if (overviewVisible) {
    // Continue happy path and finish
    await checkoutOverviewPage.clickFinish();

    // Expect order confirmation to be visible
    const completed = await checkoutCompletePage.isOrderComplete({ timeout: 5000 });
    expect(completed).toBe(true);
  } else {
    // 2) Expect a clear validation message specifying maximum input length
    const validationVisible = await checkoutInfoPage.hasValidationError({ timeout: 2000 }).catch(() => false);
    expect(validationVisible).toBe(true);

    const validationText = await checkoutInfoPage.getValidationErrorText();
    // Validation message should mention length constraints or max characters
    expect(validationText).toMatch(/max|min|length|characters|maximum|maximum length/i);
  }

  // Ensure the application did not crash or expose stack traces
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/(Exception|Stack trace|stacktrace|Error:\s|Unhandled exception)/i);
});