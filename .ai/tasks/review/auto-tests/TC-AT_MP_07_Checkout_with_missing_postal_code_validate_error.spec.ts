import test, { expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@flows/login.flow';
import { CartFlow } from '@flows/cart.flow';
import { CheckoutFlow } from '@flows/checkout.flow';
import { CheckoutInformationPage } from '@pages/checkout-information.page';

test('MP-07 - Checkout with missing postal code (validate error) @regression @critical', async ({ page }) => {
  // Arrange
  const loginFlow = new LoginFlow(page);
  const cartFlow = new CartFlow(page);
  const checkoutFlow = new CheckoutFlow(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);

  // Act
  await loginFlow.loginAsStandard(); // uses standard_user / secret_sauce
  await cartFlow.addFirstAvailableProductToCart();
  await cartFlow.openCart();
  await cartFlow.clickCheckout();

  // On Checkout: Your Information page, enter first and last name but leave postal code empty
  await checkoutFlow.fillYourInformation({ firstName: 'Liam', lastName: 'Brown', postalCode: '' });
  await checkoutFlow.clickContinue();

  // Assert
  await expect(checkoutInfoPage.errorMessage).toBeVisible();
  await expect(checkoutInfoPage.errorMessage).toHaveText('Error: Postal Code is required.');
  await expect(checkoutInfoPage.pageIdentifier).toBeVisible(); // user remains on Checkout: Your Information page
});