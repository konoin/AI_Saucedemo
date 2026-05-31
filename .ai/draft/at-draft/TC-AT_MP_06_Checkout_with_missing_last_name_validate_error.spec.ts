import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';

// MP-06 - Checkout with missing last name (validate error)
// Tags: @regression @critical

test.describe('MP-06 - Checkout with missing last name (validate error)', () => {
  test('@regression @critical', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInformationPage(page);

    // Act
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // add a product to cart and open cart
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.openCart();

    // proceed to checkout
    await cartPage.clickCheckout();

    // fill checkout information with missing last name
    await checkoutInfoPage.fillFirstName('Emma');
    // intentionally leave last name empty
    await checkoutInfoPage.fillLastName('');
    await checkoutInfoPage.fillPostalCode('30303');
    await checkoutInfoPage.clickContinue();

    // Assert
    // user remains on Checkout: Your Information page
    await expect(page).toHaveURL(/checkout-step-one/);

    // a clear validation error message is displayed
    await expect(checkoutInfoPage.errorMessage).toBeVisible();
    await expect(checkoutInfoPage.errorMessage).toHaveText('Error: Last Name is required.');
  });
});
