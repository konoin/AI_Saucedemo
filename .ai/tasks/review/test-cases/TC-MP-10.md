# MP-10 - Cart persistence across page reload and logout/login during checkout

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser is open.
2. 1. Log in to SauceDemo (standard_user / secret_sauce).
3. 2. Add two products to the cart.
4. 3. Open the cart page and verify items are present.
5. 4. Reload the cart page (refresh the browser). Verify items remain in the cart.
6. 5. Log out from the application while on the cart page (if possible).
7. 6. Log back in with the same credentials and navigate to the cart page.
8. 7. Verify the previously added items are still in the cart.

## Expected Result

Items added to cart persist across page reloads and across a logout/login cycle for the same user/session (or at minimum persist during the active session). No unexpected cart data loss occurs. If the application design intentionally clears cart on logout, document that behavior and ensure it matches the product specification.
