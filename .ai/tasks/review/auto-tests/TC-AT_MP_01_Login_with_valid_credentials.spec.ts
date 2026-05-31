import { test } from '@fixtures/base.fixture';
import { expect } from '@playwright/test';
import { LoginPage } from '@framework/pages/login.page';
import { InventoryPage } from '@framework/pages/inventory.page';
import { authFlow } from '@framework/flows/auth.flow';

test('@regression @critical @smoke MP-01 - Login with valid credentials', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  // Act
  await loginPage.goto();
  await expect(loginPage.usernameInput).toBeVisible();
  await authFlow.login(page, 'standard_user', 'secret_sauce');

  // Assert
  await expect(page).toHaveURL(/.*inventory.html/);
  await expect(inventoryPage.productList).toBeVisible();
  await expect(inventoryPage.header).toBeVisible();
  await expect(inventoryPage.cartIcon).toBeVisible();
  // Ensure no error message is displayed after successful login
  await expect(loginPage.errorMessage).toHaveCount(0);
});