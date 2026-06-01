import { test, expect } from '@fixtures/base.fixture';

/**
 * Source Test Case: TC-AT_MP_17
 */
test('@critical @regression MP-17 attempt to access inventory page without authentication unauthorized access', async ({
  page,
  loginPage,
}) => {
  await page.goto('/inventory.html');

  await expect(page).not.toHaveURL(/\/inventory\.html$/);
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.errorMessage).toContainText(
    "You can only access '/inventory.html' when you are logged in.",
  );
});
