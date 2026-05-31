import test, { expect } from '@fixtures/base.fixture';
import { AuthFlow } from '@flows/auth.flow';
import { InventoryPage } from '@pages/inventory.page';
import { CartPage } from '@pages/cart.page';

// MP-11 - Cart persistence after logout and login (cart data loss risk)
// Tags: @regression @critical

test('@regression @critical MP-11 - Cart persistence after logout and login (cart data loss risk)', async ({ page }) => {
  // Arrange
  const authFlow = new AuthFlow(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  const username = 'standard_user';
  const password = 'secret_sauce';
  const productsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

  await authFlow.login(username, password);

  // Add one or more products to the cart using existing page object
  for (const productName of productsToAdd) {
    await inventory.addProductToCartByName(productName);
  }

  // Confirm items are shown in the cart
  await cart.open();
  const cartItemsBeforeLogout = await cart.getProductNames();
  expect(cartItemsBeforeLogout).toEqual(expect.arrayContaining(productsToAdd));

  // Act - Logout from the application
  await authFlow.logout();

  // Login again with the same user
  await authFlow.login(username, password);

  // Open the cart
  await cart.open();

  // Assert - Cart contents are preserved for the user across logout/login
  const cartItemsAfterRelogin = await cart.getProductNames();
  expect(cartItemsAfterRelogin).toEqual(expect.arrayContaining(productsToAdd));
});