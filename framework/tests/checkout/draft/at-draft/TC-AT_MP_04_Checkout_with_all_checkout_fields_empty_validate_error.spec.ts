import { test, expect } from '@fixtures/base.fixture';
import { loginAsStandardUser } from '@framework/flows/auth.flow';
import { addAnyProductToCart } from '@framework/flows/products.flow';
import { CartPage } from '@framework/pages/cart.page';
import { CheckoutYourInformationPage } from '@framework/pages/checkoutYourInformation.page';

/**
 * @regression
 * @critical
 */
test('MP-04 - Checkout with all checkout fields empty (validate error)', async ({ page }) => {
  // Arrange
  await loginAsStandardUser(page);
  await addAnyProductToCart(page);
  const cartPage = new CartPage(page);
  await cartPage.open();

  // Act
  await cartPage.clickCheckout();
  const checkoutPage = new CheckoutYourInformationPage(page);

  // Ensure fields are empty (use page object methods, do not inline locators)
  await checkoutPage.clearFirstName();
  await checkoutPage.clearLastName();
  await checkoutPage.clearPostalCode();

  await checkoutPage.clickContinue();

  // Assert
  // Error message should be shown and user should remain on Checkout: Your Information page
  await expect(checkoutPage.errorMessageLocator()).toHaveText(/First Name is required/i);
  await expect(checkoutPage.pageTitleLocator()).toHaveText(/Checkout: Your Information/i);
});