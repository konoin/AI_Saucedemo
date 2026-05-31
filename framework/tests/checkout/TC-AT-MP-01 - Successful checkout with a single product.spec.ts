import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/LoginPage';
import { ProductsPage } from '@pages/ProductsPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutInformationPage } from '@pages/CheckoutInformationPage';
import { CheckoutOverviewPage } from '@pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '@pages/CheckoutCompletePage';

test("MP-01 - Successful checkout with a single product @regression @critical @smoke", async ({
  page,
}) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInformationPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);
  const checkoutCompletePage = new CheckoutCompletePage(page);

  const USERNAME = "standard_user";
  const PASSWORD = "secret_sauce";
  const PRODUCT_NAME = "Sauce Labs Backpack";
  const FIRST_NAME = "John";
  const LAST_NAME = "Doe";
  const POSTAL_CODE = "12345";

  // Act: Open app and login
  await loginPage.goto();
  await loginPage.login(USERNAME, PASSWORD);

  // Assert: Products page is displayed
  expect(await productsPage.isDisplayed()).toBeTruthy();

  // Act: Add product to cart
  await productsPage.addProductToCart(PRODUCT_NAME);

  // Assert: Cart badge shows 1
  expect(await productsPage.getCartBadgeCount()).toBe("1");

  // Act: Open cart
  await productsPage.openCart();

  // Assert: Product is listed in cart with correct name and price
  expect(await cartPage.hasProduct(PRODUCT_NAME)).toBeTruthy();
  const itemPrice = await cartPage.getItemPrice(PRODUCT_NAME);
  expect(itemPrice).toBe("$29.99");

  // Act: Proceed to checkout
  await cartPage.clickCheckout();

  // Act: Fill checkout information and continue
  await checkoutInfoPage.fillInformation({
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    postalCode: POSTAL_CODE,
  });
  await checkoutInfoPage.continue();

  // Assert: Overview page shows correct product, quantity, subtotal, tax and total
  expect(await checkoutOverviewPage.getProductName()).toBe(PRODUCT_NAME);
  expect(await checkoutOverviewPage.getProductQuantity()).toBe("1");

  const expectedSubtotal = "$29.99";
  const expectedTax = "$2.40";
  const expectedTotal = "$32.39";

  expect(await checkoutOverviewPage.getSubtotal()).toBe(expectedSubtotal);
  expect(await checkoutOverviewPage.getTax()).toBe(expectedTax);
  expect(await checkoutOverviewPage.getTotal()).toBe(expectedTotal);

  // Act: Finish checkout
  await checkoutOverviewPage.finish();

  // Assert: Order completed successfully and confirmation message is displayed
  expect(await checkoutCompletePage.isConfirmationVisible()).toBeTruthy();
  const confirmationText = await checkoutCompletePage.getConfirmationText();
  expect(confirmationText).toContain("THANK YOU FOR YOUR ORDER");
});
