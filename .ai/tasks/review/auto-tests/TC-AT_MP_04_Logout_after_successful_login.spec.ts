import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from 'framework/flows/login.flow';
import { AppMenuPage } from 'framework/pages/appMenu.page';
import { LoginPage } from 'framework/pages/login.page';
import { InventoryPage } from 'framework/pages/inventory.page';

test('MP-04 - Logout after successful login @regression @critical @smoke', async ({ page }) => {
  // Arrange
  const loginFlow = new LoginFlow(page);
  const appMenu = new AppMenuPage(page);
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  // Ensure user is logged in using existing flow
  await loginFlow.loginWithValidCredentials();

  // Verify we arrived at the inventory page after login (assertion belongs to test)
  await expect(page).toHaveURL(/inventory.html/);
  await expect(inventoryPage.isVisible()).resolves.toBeTruthy();

  // Act
  // Open application menu and perform logout using Page Object
  await appMenu.open();
  await appMenu.logout();

  // Assert
  // User should be redirected to Login page after logout
  await expect(loginPage.waitForLoad()).resolves.toBeTruthy();
  await expect(page).toHaveURL(/login/);

  // Act (attempt direct access to a protected route after logout)
  await page.goto('/inventory.html');

  // Assert
  // Accessing inventory after logout should redirect back to login (or show unauthorized)
  await expect(page).toHaveURL(/login/);
  await expect(loginPage.isVisible()).resolves.toBeTruthy();
});