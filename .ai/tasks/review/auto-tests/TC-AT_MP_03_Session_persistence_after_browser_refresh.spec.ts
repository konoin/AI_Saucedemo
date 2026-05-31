import { test, expect } from '@fixtures/base.fixture';
import { AuthFlow } from '@flows/auth.flow';
import { InventoryPage } from '@pages/inventory.page';

test('MP-03 - Session persistence after browser refresh @regression @critical', async ({ page }) => {
  // Arrange
  const authFlow = new AuthFlow(page);
  const inventoryPage = new InventoryPage(page);

  // Act - perform login using existing flow
  await authFlow.login('standard_user', 'secret_sauce');

  // Assert - verify we are on the inventory page
  await inventoryPage.waitForLoad();
  const initiallyVisible = await inventoryPage.isVisible();
  expect(initiallyVisible).toBeTruthy();

  // Act - refresh the browser
  await page.reload();

  // Assert - session persists and inventory page remains visible
  expect(page.url()).toContain('/inventory');
  const afterRefreshVisible = await inventoryPage.isVisible();
  expect(afterRefreshVisible).toBeTruthy();
});