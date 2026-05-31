import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@framework/flows/login.flow';
import { ProductFlow } from '@framework/flows/product.flow';
import { CartFlow } from '@framework/flows/cart.flow';
import { CheckoutFlow } from '@framework/flows/checkout.flow';
import { CheckoutOverviewPage } from '@framework/pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@framework/pages/checkoutComplete.page';

test.describe('MP-12 - Order completion interrupted by network failure (retry behavior)', () => {
  test('@regression @critical', async ({ page, context }) => {
    // Arrange
    await LoginFlow.loginAsStandardUser(page); // uses standard_user / secret_sauce

    // Add a product to cart and navigate to Checkout -> Overview
    await ProductFlow.addFirstAvailableProductToCart(page);
    await CartFlow.goToCart(page);
    await CartFlow.proceedToCheckout(page);
    await CheckoutFlow.fillCheckoutInformation(page, {
      firstName: 'Automation',
      lastName: 'Tester',
      postalCode: '12345',
    });

    const overviewPage = new CheckoutOverviewPage(page);
    const completePage = new CheckoutCompletePage(page);

    // Sanity: we should be on the overview page before attempting finish
    await expect(overviewPage.pageIsVisible()).resolves.toBeTruthy();

    // Act: simulate network failure just before clicking 'Finish'
    await context.setOffline(true);

    // Attempt to finish while offline
    await overviewPage.clickFinish();

    // Assert: an error is shown and no order confirmation is displayed
    await expect(overviewPage.getNetworkErrorBanner()).resolves.toBeVisible();
    await expect(completePage.pageIsVisible()).resolves.toBeFalsy();

    // Act: restore network connectivity
    await context.setOffline(false);

    // If a retry UI exists, use it; otherwise repeat finish
    if (await overviewPage.retryButtonIsVisible()) {
      await overviewPage.clickRetry();
    } else {
      // attempt finish again
      await overviewPage.clickFinish();
    }

    // Assert: After restoring network, user can complete the order successfully
    await expect(completePage.pageIsVisible()).resolves.toBeTruthy();
    await expect(completePage.getCompletionMessage()).resolves.toContain('THANK YOU');

    // Final assertion: ensure that the earlier failure did not produce a confirmation (no duplicate)
    // We assert that there is exactly one visible confirmation on the completion page
    await expect(completePage.countConfirmationEntries()).resolves.toBe(1);
  });
});
