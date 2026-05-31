import test, { expect } from '@fixtures/base.fixture';
import { LoginPage } from '@/framework/pages/login.page';
import { ProductsPage } from '@/framework/pages/products.page';
import { CartPage } from '@/framework/pages/cart.page';
import { CheckoutInformationPage } from '@/framework/pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@/framework/pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@/framework/pages/checkoutComplete.page';

test('AT-MP-01 - Successful checkout with single product @regression @critical @smoke', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  const PRODUCT_NAME = 'Sauce Labs Backpack';
  const FIRST_NAME = 'John';
  const LAST_NAME = 'Doe';
  const POSTAL_CODE = '12345';

  // Act - Open application and login
  await page.goto('/');
  await loginPage.login('standard_user', 'secret_sauce');

  // Act - Add product to cart
  await productsPage.addProductToCartByName(PRODUCT_NAME);

  // Act - Open cart
  await productsPage.openCart();

  // Assert - Product is listed in the cart
  const cartItems = await cartPage.getCartItemNames();
  expect(cartItems).toContain(PRODUCT_NAME);

  // Act - Begin checkout
  await cartPage.clickCheckout();

  // Act - Fill checkout information and continue
  await checkoutInfoPage.fillFirstName(FIRST_NAME);
  await checkoutInfoPage.fillLastName(LAST_NAME);
  await checkoutInfoPage.fillPostalCode(POSTAL_CODE);
  await checkoutInfoPage.clickContinue();

  // Assert - On overview page verify product, price and total
  const overviewProductNames = await checkoutOverviewPage.getItemNames();
  expect(overviewProductNames).toContain(PRODUCT_NAME);

  const itemPrice = await checkoutOverviewPage.getItemPriceByName(PRODUCT_NAME);
  expect(itemPrice).toBeTruthy();

  const itemTotal = await checkoutOverviewPage.getTotal();
  expect(itemTotal).toBeTruthy();

  // Act - Finish checkout
  await checkoutOverviewPage.clickFinish();

  // Assert - Completion message is displayed
  const completionHeader = await checkoutCompletePage.getCompletionHeader();
  expect(completionHeader.toUpperCase()).toContain('THANK YOU FOR YOUR ORDER');
});