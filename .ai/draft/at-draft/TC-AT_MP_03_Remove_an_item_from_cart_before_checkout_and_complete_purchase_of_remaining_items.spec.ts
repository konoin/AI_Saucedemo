import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@framework/pages/login.page';
import { InventoryPage } from '@framework/pages/inventory.page';
import { CartPage } from '@framework/pages/cart.page';
import { CheckoutInformationPage } from '@framework/pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@framework/pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@framework/pages/checkoutComplete.page';

// Test tags: @regression @critical @smoke

test('MP-03 - Remove an item from cart before checkout and complete purchase of remaining items @regression @critical @smoke', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  const FIRST_NAME = 'Bob';
  const LAST_NAME = 'Lee';
  const POSTAL_CODE = '10001';
  const PRODUCT_1 = 'Sauce Labs Backpack';
  const PRODUCT_2 = 'Sauce Labs Bike Light';

  // Act
  // 1. Open application and login
  await loginPage.goto();
  await loginPage.loginAs('standard_user', 'secret_sauce');

  // 2. Add two products to the cart
  await inventoryPage.addProductToCartByName(PRODUCT_1);
  await inventoryPage.addProductToCartByName(PRODUCT_2);

  // 3. Open the cart
  await inventoryPage.openCart();

  // 4. Remove one product from the cart
  await cartPage.removeItemByName(PRODUCT_2);

  // Assert - only the remaining product is listed in the cart
  const cartItemsAfterRemoval = await cartPage.getCartItemNames();
  expect(cartItemsAfterRemoval).toContain(PRODUCT_1);
  expect(cartItemsAfterRemoval).not.toContain(PRODUCT_2);
  expect(cartItemsAfterRemoval.length).toBe(1);

  // 6. Click 'Checkout' and enter valid checkout information
  await cartPage.clickCheckout();
  await checkoutInfoPage.fillFirstName(FIRST_NAME);
  await checkoutInfoPage.fillLastName(LAST_NAME);
  await checkoutInfoPage.fillPostalCode(POSTAL_CODE);
  await checkoutInfoPage.clickContinue();

  // Assert - Overview does not contain removed item and contains remaining item
  const overviewItems = await checkoutOverviewPage.getOverviewItemNames();
  expect(overviewItems).toContain(PRODUCT_1);
  expect(overviewItems).not.toContain(PRODUCT_2);

  // 7. Click 'Finish'
  await checkoutOverviewPage.clickFinish();

  // Assert - Checkout completes successfully and removed item is not present in the completed order
  await expect(checkoutCompletePage.getCompleteHeader()).resolves.toContain('THANK YOU');
  const completedOrderItems = await checkoutCompletePage.getCompletedItemNames();
  // Some implementations may not list items on the complete page; handle both cases
  if (completedOrderItems.length > 0) {
    expect(completedOrderItems).toContain(PRODUCT_1);
    expect(completedOrderItems).not.toContain(PRODUCT_2);
  }
});