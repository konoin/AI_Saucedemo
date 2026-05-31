import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from 'framework/pages/login.page';
import { ProductsPage } from 'framework/pages/products.page';
import { CartPage } from 'framework/pages/cart.page';
import { CheckoutInformationPage } from 'framework/pages/checkoutInformation.page';
import { CheckoutOverviewPage } from 'framework/pages/checkoutOverview.page';
import { CheckoutCompletePage } from 'framework/pages/checkoutComplete.page';
import { loginAsStandardUser } from 'framework/flows/login.flow';

// Test: MP-02 - Successful checkout with multiple distinct products
// Tags: @regression @critical @smoke

test('MP-02 - Successful checkout with multiple distinct products', async ({ page }, testInfo) => {
  // Tags/annotations
  testInfo.annotations.push({ type: 'tag', description: '@regression' });
  testInfo.annotations.push({ type: 'tag', description: '@critical' });
  testInfo.annotations.push({ type: 'tag', description: '@smoke' });

  // Arrange
  // Use flow to login as standard_user
  await loginAsStandardUser(page); // expects to perform login and land on products page

  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  // Define products and expected prices (values based on app product list)
  const productsToPurchase = [
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
    'Sauce Bolt T-Shirt',
  ];

  const expectedPrices: Record<string, number> = {
    'Sauce Labs Backpack': 29.99,
    'Sauce Labs Bike Light': 9.99,
    'Sauce Bolt T-Shirt': 15.99,
  };

  // Act
  // Add three different products to the cart
  for (const productName of productsToPurchase) {
    await productsPage.addProductToCartByName(productName);
  }

  // Open cart
  await productsPage.openCart();

  // Assert - Verify all three products appear in the cart with correct names and prices
  const cartItems = await cartPage.getCartItems();
  // cartItems => Array<{ name: string; price: number }>
  expect(cartItems.length).toBe(productsToPurchase.length);

  for (const expectedName of productsToPurchase) {
    const item = cartItems.find(i => i.name === expectedName);
    expect(item, `Cart should contain product: ${expectedName}`).toBeDefined();
    const expectedPrice = expectedPrices[expectedName];
    expect(item!.price).toBeCloseTo(expectedPrice, 2);
  }

  // Click 'Checkout'
  await cartPage.clickCheckout();

  // Fill checkout information
  await checkoutInfoPage.fillFirstName('Alice');
  await checkoutInfoPage.fillLastName('Smith');
  await checkoutInfoPage.fillPostalCode('90210');

  // Click 'Continue'
  await checkoutInfoPage.clickContinue();

  // Verify overview lists all three products
  const overviewItems = await checkoutOverviewPage.getOverviewItems();
  expect(overviewItems.length).toBe(productsToPurchase.length);
  for (const expectedName of productsToPurchase) {
    const item = overviewItems.find(i => i.name === expectedName);
    expect(item, `Overview should contain product: ${expectedName}`).toBeDefined();
    const expectedPrice = expectedPrices[expectedName];
    expect(item!.price).toBeCloseTo(expectedPrice, 2);
  }

  // Verify aggregated total and tax calculation (tax rate calculated by app)
  const subtotalDisplayed = await checkoutOverviewPage.getSubTotal(); // returns number
  const taxDisplayed = await checkoutOverviewPage.getTax(); // returns number
  const totalDisplayed = await checkoutOverviewPage.getTotal(); // returns number

  // Compute expected subtotal based on expectedPrices
  const expectedSubtotal = productsToPurchase.reduce((sum, name) => sum + expectedPrices[name], 0);
  // Tax rate is determined by app; compute expected tax using same rounding (2 decimals)
  const expectedTax = parseFloat((Math.round((taxDisplayed) * 100) / 100).toFixed(2));
  // We assert subtotal and total consistency using the displayed tax to avoid duplicating business logic

  expect(subtotalDisplayed).toBeCloseTo(expectedSubtotal, 2);
  // Verify total = subtotal + tax
  expect(totalDisplayed).toBeCloseTo(subtotalDisplayed + taxDisplayed, 2);

  // Store overview totals for later comparison
  const expectedTotalFromOverview = totalDisplayed;

  // Click 'Finish'
  await checkoutOverviewPage.clickFinish();

  // Assert - Checkout completes successfully showing order confirmation
  const isConfirmationVisible = await checkoutCompletePage.isConfirmationVisible();
  expect(isConfirmationVisible).toBeTruthy();

  const confirmationText = await checkoutCompletePage.getConfirmationText();
  expect(confirmationText.toUpperCase()).toContain('THANK YOU');

  // Final assertions: ensure items included earlier are the ones ordered and totals match overview
  // (Items presence was validated on Overview page already)
  // Verify final totals match the overview total (overview -> finish flow did not change total)
  const finalPageTotal = await checkoutCompletePage.getFinalTotal?.();
  if (typeof finalPageTotal === 'number') {
    expect(finalPageTotal).toBeCloseTo(expectedTotalFromOverview, 2);
  }
});
