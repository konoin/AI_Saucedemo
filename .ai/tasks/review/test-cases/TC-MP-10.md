## Name

MP-10 - Session expiration during checkout and behavior after re-login

## Priority

High

## Type

Edge

## Steps

1. Log in to SauceDemo as 'standard_user'.
2. Add a product to the cart and start the checkout flow by navigating to the 'Checkout: Your Information' page.
3. Simulate session expiration (e.g., clear session cookies or wait for session timeout) and then attempt to continue the checkout by entering valid checkout data and clicking 'Continue'.
4. If redirected to login, log in again with valid credentials and return to the cart/checkout flow.

## Expected Result

If the session expires during checkout, the application redirects the user to the login page and prevents insecure continuation. After successful re-authentication the application should preserve the cart state so the user can resume and complete the checkout without data loss. If the system's defined behavior differs, a clear user-facing message should explain the state and next steps.
