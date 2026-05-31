import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { ProductsPage } from '@pages/products.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutInformationPage } from '@pages/checkoutInformation.page';
import { CheckoutOverviewPage } from '@pages/checkoutOverview.page';
import { CheckoutCompletePage } from '@pages/checkoutComplete.page';
import { Users } from '@data/users.data';
import { Products } from '@data/products.data';

test.describe('MP - Checkout Flow', () => {
  test('@regression @critical @smoke MP-01 - Successful checkout with single product', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInformationPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);

    const user = Users.standard_user;
    const product = Products.sauce_labs_backpack; // { name: 'Sauce Labs Backpack', price: '$29.99' }

    // Act
    // 1-2. Open app and login
    await loginPage.goto();
    await loginPage.login(user.username, user.password);

    // 3. Add product to cart
    await productsPage.addToCartByName(product.name);

    // 4. Open cart
    await productsPage.openCart();

    // 5. Verify product is listed in the cart (Assert here)
    const isInCart = await cartPage.isProductInCart(product.name);
    expect(isInCart).toBeTruthy();

    // 6. Click Checkout
    await cartPage.checkout();

    // 7-8. Fill checkout information and continue
    await checkoutInfoPage.fillInformation({ firstName: 'John', lastName: 'Doe', postalCode: '12345' });
    await checkoutInfoPage.continue();

    // 9. On Overview, verify product, price and total are displayed (Assert)
    const overviewHasProduct = await checkoutOverviewPage.isProductVisible(product.name);
    expect(overviewHasProduct).toBeTruthy();

    const overviewPrice = await checkoutOverviewPage.getProductPrice(product.name);
    expect(overviewPrice).toBe(product.price);

    const itemTotal = await checkoutOverviewPage.getItemTotal();
    expect(itemTotal).toContain('$');

    const total = await checkoutOverviewPage.getTotal();
    expect(total).toContain('$');

    // 10. Finish
    await checkoutOverviewPage.finish();

    // Assert: user is taken to checkout complete page and sees confirmation message
    const confirmation = await checkoutCompletePage.getConfirmationHeader();
    expect(confirmation.toUpperCase()).toContain('THANK YOU FOR YOUR ORDER');

    // Final assertion: order complete flow finishes without validation errors (represented by presence of confirmation)
    expect(await checkoutCompletePage.isCompletePageVisible()).toBeTruthy();
  });
});
