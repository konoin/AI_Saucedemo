import test from '@fixtures/base.fixture';
import { expect } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { ProductsPage } from '@pages/products.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';
import { loginAsStandardUser } from '@flows/auth.flow';

test('@regression @critical @smoke - Successful checkout with single product', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  const productName = 'Sauce Labs Backpack';
  const username = 'standard_user';
  const password = 'secret_sauce';
  const firstName = 'John';
  const lastName = 'Doe';
  const postalCode = '12345';

  const parsePrice = (priceText: string) => Number(priceText.replace(/[^0-9.]/g, ''));

  // Act
  // Use existing flow for authentication
  await loginAsStandardUser(page, { username, password });

  // Add single product to cart
  await productsPage.addProductToCartByName(productName);

  // Open cart page
  await productsPage.openCart();

  // Assert - product present in cart with correct name and price
  const cartItemNames = await cartPage.getCartItemNames();
  expect(cartItemNames).toContain(productName);

  const cartItemPriceText = await cartPage.getCartItemPriceByName(productName);
  expect(cartItemPriceText).toBeTruthy();

  // Proceed to checkout
  await cartPage.clickCheckout();

  // Fill checkout information
  await checkoutInfoPage.fillFirstName(firstName);
  await checkoutInfoPage.fillLastName(lastName);
  await checkoutInfoPage.fillPostalCode(postalCode);
  await checkoutInfoPage.clickContinue();

  // Verify overview pricing (item total, tax if displayed, total)
  const itemPriceValue = parsePrice(cartItemPriceText);

  const itemTotalText = await checkoutOverviewPage.getItemTotalText();
  const itemTotalValue = parsePrice(itemTotalText);
  expect(itemTotalValue).toBeCloseTo(itemPriceValue, 2);

  const taxText = await checkoutOverviewPage.getTaxText();
  if (taxText) {
    const taxValue = parsePrice(taxText);
    const totalText = await checkoutOverviewPage.getTotalText();
    const totalValue = parsePrice(totalText);
    expect(totalValue).toBeCloseTo(itemTotalValue + taxValue, 2);
  } else {
    // If tax not displayed, ensure total equals item total
    const totalText = await checkoutOverviewPage.getTotalText();
    const totalValue = parsePrice(totalText);
    expect(totalValue).toBeCloseTo(itemTotalValue, 2);
  }

  // Finish checkout
  await checkoutOverviewPage.clickFinish();

  // Assert - order confirmation and cart cleared
  const successMessage = await checkoutCompletePage.getSuccessMessage();
  expect(successMessage).toContain('THANK YOU FOR YOUR ORDER');

  // Navigate back to products and ensure cart is cleared for current session
  await checkoutCompletePage.clickBackToProducts();
  const cartBadgeCount = await productsPage.getCartBadgeCount();
  // If badge is not shown, getCartBadgeCount should return null/undefined or 0
  expect(cartBadgeCount === undefined || cartBadgeCount === null || cartBadgeCount === 0).toBeTruthy();
});