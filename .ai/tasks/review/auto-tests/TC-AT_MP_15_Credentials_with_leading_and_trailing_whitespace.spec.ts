import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';

// @regression @critical
test('MP-15 - Credentials with leading and trailing whitespace @regression @critical', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const usernameWithWhitespace = ' standard_user ';
  const passwordWithWhitespace = ' secret_sauce ';

  await loginPage.goto();

  // Act
  await loginPage.enterUsername(usernameWithWhitespace);
  await loginPage.enterPassword(passwordWithWhitespace);
  await loginPage.clickLogin();

  // Assert
  // Two acceptable outcomes:
  // 1) App trims whitespace and authenticates -> should land on inventory page
  // 2) App treats whitespace as part of credentials and rejects login -> should show an inline error and NOT crash

  // Wait for potential navigation or inline error to appear
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  const isOnInventory = /\/inventory\.html$/i.test(currentUrl);

  if (isOnInventory) {
    // Successful authentication path
    await expect(page).toHaveURL(/\/inventory\.html$/);
    // Optionally assert a visible inventory element via Page Object (no business logic here)
    await expect(inventoryPage.header).toBeVisible();
  } else {
    // Rejected authentication path - expect inline error message and no crash
    const errorLocator = await loginPage.getErrorMessage();
    await expect(errorLocator).toBeVisible();

    // Ensure app did not navigate to an unexpected error page (still within saucedemo domain)
    await expect(page.url()).toMatch(/saucedemo\.com/);
  }
});