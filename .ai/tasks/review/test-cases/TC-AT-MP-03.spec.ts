/*
 * @regression
 * @critical
 */

import { test, expect } from '@fixtures/base.fixture';
import { login } from '@framework/flows/login.flow';
import { ProductsPage } from '@framework/pages/products.page';
import { CartPage } from '@framework/pages/cart.page';
import { AboutPage } from '@framework/pages/about.page';

test.describe('Cart persistence after refresh and navigation', () => {
  test('AT-MP-03 | Cart items remain after page refresh and navigating away/back', async ({ page }) => {
    // Arrange
    // Use login flow from framework flows
    await login(page); // uses valid credentials from fixtures/flow

    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const aboutPage = new AboutPage(page);

    // Ensure we're on products page
    await productsPage.open();

    // Select products to add
    const productsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bolt T-Shirt'];

    // Capture expected product prices from products page before adding
    const expectedProducts = [] as { name: string; price: string }[];
    for (const name of productsToAdd) {
      const price = await productsPage.getProductPriceByName(name);
      expectedProducts.push({ name, price });
      await productsPage.addProductToCartByName(name);
    }

    // Act
    // Refresh the page
    await page.reload();

    // Navigate away (to About/help) and then back to products
    await productsPage.openAbout();
    await aboutPage.waitForLoaded();
    await aboutPage.navigateBackToProducts();

    // Open cart page
    await productsPage.openCart();

    // Assert
    const cartItems = await cartPage.getCartItems();

    // All previously added products should be present with correct qty and price
    for (const expected of expectedProducts) {
      const item = cartItems.find(i => i.name === expected.name);
      expect(item, `Expected cart to contain product: ${expected.name}`).toBeDefined();
      expect(item!.quantity, `Expected quantity 1 for ${expected.name}`).toBe(1);
      expect(item!.price, `Expected price to match for ${expected.name}`).toBe(expected.price);
    }

    // No unexpected cart data loss (count matches)
    expect(cartItems.length, 'Cart item count should match number of added products').toBe(expectedProducts.length);
  });
});
