## Name

MP-08 - Checkout with very long and special-character inputs

## Priority

Medium

## Type

Edge

## Steps

1. Log in to SauceDemo.
2. Add a product to the cart and proceed to Checkout -> Your Information.
3. Enter First name with 200+ characters (letters and special characters), Last name with 200+ characters, and Postal Code with an extended string (special characters and numbers).
4. Click 'Continue' and proceed to 'Finish' if allowed.

## Expected Result

Application handles long and special-character inputs gracefully: it either accepts them and completes the checkout or provides clear, user-facing validation messages explaining field length/format constraints. The app must not crash or behave unpredictably.
