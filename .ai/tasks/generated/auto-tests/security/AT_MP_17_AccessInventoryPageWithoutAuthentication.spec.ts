import { test, expect } from '@fixtures/base.fixture';

/**
 * Source Test Case: TC-AT_MP_17
 */
test('@critical @regression MP-17 unauthenticated inventory access redirects to login', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  // Act
  await page.goto('/inventory.html');

  // Assert
  await expect(page).not.toHaveURL(/\/inventory\.html$/);
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.errorMessage).toContainText(
    "Epic sadface: You can only access '/inventory.html' when you are logged in.",
  );
  await expect.poll(() => inventoryPage.getProductsCount()).toBe(0);
});
