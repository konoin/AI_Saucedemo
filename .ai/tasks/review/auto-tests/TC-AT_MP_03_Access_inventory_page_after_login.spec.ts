import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@flows/login.flow';
import { InventoryPage } from '@pages/inventory.page';

test('MP-03 - Access inventory page after login @regression @critical @smoke', async ({ page, baseURL }) => {
  // Arrange
  const inventoryPage = new InventoryPage(page);

  // Act - log in using existing flow
  await LoginFlow.login(page, {
    username: 'standard_user',
    password: 'secret_sauce',
    baseURL,
  });

  // Assert - Inventory page displays product listings after login
  await expect(inventoryPage.productsContainer).toBeVisible();

  const productNames = await inventoryPage.getProductNames();
  expect(productNames.length).toBeGreaterThan(0);
  productNames.forEach((name) => expect(name.trim().length).toBeGreaterThan(0));

  const productPrices = await inventoryPage.getProductPrices();
  expect(productPrices.length).toBeGreaterThan(0);
  // basic price format assertion, e.g. $29.99
  productPrices.forEach((price) => expect(price).toMatch(/^\$\d+(?:\.\d{2})?$/));

  // Act - manually navigate (or refresh) to /inventory.html
  await page.goto(`${baseURL}/inventory.html`);

  // Assert - page remains accessible and products still visible
  await expect(inventoryPage.productsContainer).toBeVisible();
  const productNamesAfterNav = await inventoryPage.getProductNames();
  expect(productNamesAfterNav.length).toBeGreaterThan(0);
});