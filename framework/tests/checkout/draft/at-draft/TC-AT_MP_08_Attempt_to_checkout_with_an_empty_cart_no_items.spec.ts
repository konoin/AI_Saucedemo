import { test, expect } from '@fixtures/base.fixture';
import { AuthFlows } from 'framework/flows/auth.flow';
import { InventoryPage } from 'framework/pages/inventory.page';
import { CartPage } from 'framework/pages/cart.page';
import { CheckoutInformationPage } from 'framework/pages/checkoutInformation.page';

test('@regression @critical MP-08 - Attempt to checkout with an empty cart (no items)', async ({ page }) => {
  // Arrange
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkoutInfo = new CheckoutInformationPage(page);

  // Open app and login
  await inventory.goto();
  await AuthFlows.login(page, 'standard_user', 'secret_sauce');

  // Ensure cart is empty
  await inventory.openCart();
  await cart.removeAllItems();
  await cart.open();

  // Act
  const checkoutVisible = await cart.isCheckoutButtonVisible();

  // Assert
  // If checkout button is not present, checkout cannot be started
  if (!checkoutVisible) {
    await expect(checkoutVisible).toBe(false);
    return;
  }

  // If checkout button is present, verify it's disabled OR clicking does not navigate to checkout
  const checkoutEnabled = await cart.isCheckoutButtonEnabled();
  if (!checkoutEnabled) {
    await expect(checkoutEnabled).toBe(false);
    return;
  }

  // If button is enabled (unexpected), attempt to click and assert checkout form is not presented
  await cart.clickCheckout();

  // Assert that navigation to checkout did not occur and no checkout information form is visible
  await expect(page).not.toHaveURL(/checkout/);
  const checkoutFormVisible = await checkoutInfo.isVisible();
  await expect(checkoutFormVisible).toBe(false);
});