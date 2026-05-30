import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';
import { loginFlow } from '@flows/login.flow';
import { standardUser } from '@data/users';
import { products } from '@data/products';

// Test: Successful checkout with single product
// Tags: @regression @critical @smoke

test('@regression @critical @smoke Successful checkout with single product', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  const productName = products.sauceLabsBackpack.name ?? 'Sauce Labs Backpack';
  const expectedPrice = products.sauceLabsBackpack.price; // e.g., 29.99
  const user = standardUser.standard_user; // { username, password }
  const firstName = 'John';
  const lastName = 'Doe';
  const postalCode = '90210';

  // Act
  // Navigate & Login (use existing flow)
  await page.goto('/');
  await loginFlow.login(page, user.username, user.password);

  // Add product to cart from inventory
  await inventoryPage.addProductToCartByName(productName);

  // Open cart
  await inventoryPage.openCart();

  // Assert - product is listed in cart
  const cartItems = await cartPage.getCartItemNames();
  expect(cartItems).toContain(productName);

  // Proceed to checkout information
  await cartPage.clickCheckout();

  // Fill checkout information
  await checkoutInfoPage.fillFirstName(firstName);
  await checkoutInfoPage.fillLastName(lastName);
  await checkoutInfoPage.fillPostalCode(postalCode);
  await checkoutInfoPage.clickContinue();

  // Assert - overview shows product and correct pricing
  const overviewProductNames = await checkoutOverviewPage.getProductNames();
  expect(overviewProductNames).toContain(productName);

  const itemSubtotal = await checkoutOverviewPage.getItemSubtotal();
  // itemSubtotal is expected to equal the product price (string or number depending on implementation)
  // Normalize to number for assertion
  const subtotalValue = typeof itemSubtotal === 'string' ? parseFloat(itemSubtotal.replace(/[^0-9.-]+/g, '')) : itemSubtotal;
  expect(subtotalValue).toBeCloseTo(Number(expectedPrice), 2);

  const taxValue = await checkoutOverviewPage.getTax();
  const taxNumber = typeof taxValue === 'string' ? parseFloat(taxValue.replace(/[^0-9.-]+/g, '')) : taxValue;
  expect(taxNumber).toBeGreaterThanOrEqual(0);

  const totalValue = await checkoutOverviewPage.getTotal();
  const totalNumber = typeof totalValue === 'string' ? parseFloat(totalValue.replace(/[^0-9.-]+/g, '')) : totalValue;
  expect(totalNumber).toBeCloseTo(subtotalValue + taxNumber, 2);

  // Finish checkout
  await checkoutOverviewPage.clickFinish();

  // Assert - order confirmation page is shown
  const confirmationText = await checkoutCompletePage.getConfirmationMessage();
  expect(confirmationText.toUpperCase()).toContain('THANK YOU FOR YOUR ORDER');

  // Act - return to inventory/home and verify cart is cleared
  await checkoutCompletePage.clickBackToProducts();

  const cartCount = await inventoryPage.getCartBadgeCount();
  // Treat empty or '0' as zero
  const cartCountNumber = typeof cartCount === 'string' ? parseInt(cartCount || '0', 10) : cartCount;
  expect(cartCountNumber).toBe(0);
});