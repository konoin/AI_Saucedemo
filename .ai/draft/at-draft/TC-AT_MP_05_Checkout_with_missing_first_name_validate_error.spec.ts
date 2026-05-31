import { test, expect } from '@fixtures/base.fixture';
import { loginFlow } from '@flows/login.flow';
import { cartFlow } from '@flows/cart.flow';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';

test('MP-05 - Checkout with missing first name (validate error) @regression @critical', async ({ page }) => {
  // Arrange
  await loginFlow.loginAsStandardUser(page);

  // Act
  await cartFlow.addFirstAvailableProductToCart(page);
  await cartFlow.openCart(page);

  const cartPage = new CartPage(page);
  await cartPage.clickCheckout();

  const checkoutPage = new CheckoutInformationPage(page);
  // Leave First Name empty on purpose
  await checkoutPage.fillLastName('Miller');
  await checkoutPage.fillPostalCode('30303');
  await checkoutPage.clickContinue();

  // Assert
  const errorText = await checkoutPage.getErrorMessage();
  expect(errorText).toBe('Error: First Name is required.');

  const header = await checkoutPage.getHeaderTitle();
  expect(header).toBe('Checkout: Your Information');
});