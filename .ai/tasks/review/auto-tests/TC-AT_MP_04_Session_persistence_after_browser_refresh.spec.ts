import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@framework/flows/login.flow';
import { InventoryPage } from '@framework/pages/inventory.page';

test.describe('MP - Session management', () => {
  test('MP-04 - Session persistence after browser refresh @regression @critical @smoke', async ({ page }) => {
    // Arrange
    const inventoryPage = new InventoryPage(page);

    // Act: Login using existing flow
    await LoginFlow.loginWithStandardUser(page); // uses standard_user / secret_sauce internally
    await inventoryPage.waitForPageLoad();

    // Act: Refresh the browser
    await page.reload();
    await inventoryPage.waitForPageLoad();

    // Assert: User remains on inventory page and content is visible / interactive
    await expect(page).toHaveURL(/inventory/);

    const isInventoryVisible = await inventoryPage.isInventoryListVisible();
    expect(isInventoryVisible).toBeTruthy();

    const canInteract = await inventoryPage.canInteractWithFirstItem();
    expect(canInteract).toBeTruthy();
  });
});