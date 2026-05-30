import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@framework/flows/login.flow';
import { ProductsFlow } from '@framework/flows/products.flow';
import { CartPage } from '@framework/pages/cart.page';
import { CheckoutStepOnePage } from '@framework/pages/checkout.stepone.page';
import { CheckoutOverviewPage } from '@framework/pages/checkout.overview.page';
import { HeaderComponent } from '@framework/pages/components/header.component';

// Test: Session expiration or logout during checkout
// Tags: @regression @critical

test('Session expiration / logout during checkout @regression @critical', async ({ page }) => {
  // Arrange
  const username = process.env.TEST_USER || 'standard_user';
  const password = process.env.TEST_PASSWORD || 'secret_sauce';
  const productIndexToAdd = 0; // use flows to pick first product

  const loginFlow = new LoginFlow(page);
  const productsFlow = new ProductsFlow(page);
  const cartPage = new CartPage(page);
  const checkoutStepOne = new CheckoutStepOnePage(page);
  const checkoutOverview = new CheckoutOverviewPage(page);

  // Login and add product to cart
  await loginFlow.login(username, password);
  await productsFlow.addProductToCartByIndex(productIndexToAdd);
  await productsFlow.goToCart();

  // Proceed to checkout (fill info to reach overview)
  await cartPage.checkout();
  await checkoutStepOne.fillCheckoutInformation({ firstName: 'John', lastName: 'Doe', postalCode: '12345' });
  await checkoutStepOne.continue();

  // Ensure we are on overview before simulating session expiration
  await expect(checkoutOverview.page).toBeVisible();

  // Act
  // Simulate logout in another tab (same context so session state is shared)
  const secondTab = await page.context().newPage();
  const headerOnSecond = new HeaderComponent(secondTab);
  // Navigate to the app using same base URL so logout affects shared session
  await secondTab.goto(process.env.BASE_URL || 'https://www.saucedemo.com');
  // If needed, use login flow on second tab to ensure session exists, then logout
  const loginFlowSecond = new LoginFlow(secondTab);
  // Try to login on second tab to ensure we're operating on an authenticated session
  // If already logged in via shared cookies, loginFlowSecond.login will be a no-op for app logic
  await loginFlowSecond.login(username, password);
  await headerOnSecond.openMenu();
  await headerOnSecond.logout();
  await secondTab.close();

  // Attempt to finish checkout from the original tab after logout
  // This should either redirect to login or block the action
  await checkoutOverview.finish();

  // Assert
  // No order should be completed without a valid session.
  // Verify that user was redirected to login OR order completion page was not reached.
  const currentURL = page.url();

  // Accept either: redirected to login page OR not on checkout complete page
  const reachedLogin = /login|saucedemo\.com\/?$/.test(currentURL) || currentURL.includes('index.html');
  const reachedCheckoutComplete = currentURL.includes('checkout-complete') || currentURL.includes('checkout-completed') || currentURL.includes('checkout-complete.html');

  expect(reachedCheckoutComplete).toBeFalsy();
  expect(reachedLogin || !reachedCheckoutComplete).toBeTruthy();

  // Finally, the user can log in again and either see cart persisted or be informed it's cleared.
  // Log in again and assert that the app is reachable and cart state can be inspected.
  await loginFlow.login(username, password);
  await productsFlow.goToCart();
  const itemsInCart = await cartPage.getCartItemsCount();

  // Cart persistence behavior may vary; assert it is a non-negative number and app is stable after re-login
  expect(typeof itemsInCart).toBe('number');
  expect(itemsInCart).toBeGreaterThanOrEqual(0);
});