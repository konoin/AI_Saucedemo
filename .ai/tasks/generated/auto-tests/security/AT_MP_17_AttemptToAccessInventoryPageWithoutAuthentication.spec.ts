import { test, expect } from '@fixtures/base.fixture';

const UNAUTHORIZED_INVENTORY_ERROR =
  "Epic sadface: You can only access '/inventory.html' when you are logged in.";

/**
 * Source Test Case: TC-AT-MP-17
 */
test('@critical @regression MP-17 attempt to access inventory page without authentication', async ({
  page,
  loginPage,
}) => {
  await page.goto('/inventory.html');

  await expect(page).not.toHaveURL(/inventory\.html/);
  await expect(loginPage.usernameInput).toBeVisible();
  await expect.poll(() => loginPage.getErrorMessage()).toBe(UNAUTHORIZED_INVENTORY_ERROR);
});
