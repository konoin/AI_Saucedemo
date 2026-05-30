import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';
import * as loginFlow from '@flows/login.flow';

test.describe('Checkout Flow - Single Product', () => {
  test('Successful checkout with single product @regression @critical @smoke', async ({ page }) => {
    // Arrange
    const username = 'standard_user';
    const password = 'secret_sauce';
    const productName = 'Sauce Labs Backpack';
    const firstName = 'John';
    const lastName = 'Doe';
    const postalCode = '90210';

    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInformationPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);

    // Act
    // Use existing login flow
    await loginFlow.login(page, { username, password });

    // Add product to cart from inventory
    await inventoryPage.addProductToCart(productName);

    // Open cart
    await inventoryPage.openCart();

    // Assert: product is listed in cart
    await expect(await cartPage.hasProduct(productName)).toBeTruthy();

    // Proceed to checkout information
    await cartPage.clickCheckout();

    // Fill checkout information
    await checkoutInfoPage.fillFirstName(firstName);
    await checkoutInfoPage.fillLastName(lastName);
    await checkoutInfoPage.fillPostalCode(postalCode);
    await checkoutInfoPage.clickContinue();

    // Verify overview details (product, subtotal, tax, total)
    await expect(await checkoutOverviewPage.hasProduct(productName)).toBeTruthy();

    const expectedItemTotal = '$29.99';
    const expectedTax = '$2.40';
    const expectedTotal = '$32.39';

    await expect(await checkoutOverviewPage.getItemTotal()).toBe(expectedItemTotal);
    await expect(await checkoutOverviewPage.getTax()).toBe(expectedTax);
    await expect(await checkoutOverviewPage.getTotal()).toBe(expectedTotal);

    // Finish checkout
    await checkoutOverviewPage.clickFinish();

    // Assert: final confirmation page shown
    await expect(await checkoutCompletePage.getThankYouMessage()).toContain('THANK YOU FOR YOUR ORDER');

    // Go back to products / inventory and verify cart is empty
    await checkoutCompletePage.clickBackHome();
    await expect(await inventoryPage.getCartCount()).toBe('0');
  });
});
