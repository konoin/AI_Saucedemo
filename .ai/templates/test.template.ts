import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';

const EXPECTED_MESSAGE = 'Thank you for your order!';

/**
 * Template: framework/tests/<domain>/<name>.spec.ts
 * Rules: fixtures + flows + data; Arrange → Act → Assert; no page.locator().
 */
test('@smoke @regression example scenario', async ({
  page,
  loginPage,
  checkoutCompletePage,
}) => {
  const loginFlow = new LoginFlow(loginPage);

  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  // Act — use CheckoutFlow or page methods

  // Assert — expect() only here
  await checkoutCompletePage.expectThankYouMessage(EXPECTED_MESSAGE);
});
