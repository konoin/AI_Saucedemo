import { test, expect } from "@playwright/test";

test("successful checkout flow", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(page).toHaveURL(/inventory/);

  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();

  await page.locator('[data-test="shopping-cart-link"]').click();

  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill("John");
  await page.locator('[data-test="lastName"]').fill("Doe");
  await page.locator('[data-test="postalCode"]').fill("12345");

  await page.locator('[data-test="continue"]').click();

  await page.locator('[data-test="finish"]').click();

  await expect(page.locator(".complete-header-test")).toContainText(
    "Thank you for your order!",
  );
});
