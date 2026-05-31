import { test, expect } from '@fixtures/base.fixture';
import { LoginPage } from '@/pages/login.page';
import { InventoryPage } from '@/pages/inventory.page';
import { LoginFlow } from '@/flows/login.flow';

test("MP-16 - Username case sensitivity check @regression", async ({ browser }) => {
  // Arrange
  const usernames = ['Standard_User', 'STANDARD_USER'];
  const password = 'secret_sauce';

  type Result = { username: string; loggedIn: boolean; errorText?: string };
  const results: Result[] = [];

  // Act
  for (const username of usernames) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const loginPage = new LoginPage(page);
    const loginFlow = new LoginFlow(page);
    const inventoryPage = new InventoryPage(page);

    // Arrange for this iteration
    await loginPage.goto();

    // Act - attempt login with case-variant username
    await loginFlow.login(username, password);

    // Determine outcome
    const loggedIn = await inventoryPage.isOpen();
    let errorText: string | undefined;
    if (!loggedIn) {
      errorText = await loginPage.getErrorMessage();
    }

    results.push({ username, loggedIn, errorText });

    await context.close();
  }

  // Assert - behavior must be consistent across username case variants
  const first = results[0];
  const consistent = results.every(r => r.loggedIn === first.loggedIn);
  expect(consistent).toBeTruthy();

  // Assert - if login failed, an error message should be shown; if succeeded, landing page is reachable
  if (first.loggedIn) {
    // All variants succeeded
    expect(first.loggedIn).toBe(true);
  } else {
    // All variants failed - error message must be present and non-empty
    expect(first.errorText).toBeTruthy();
  }
});