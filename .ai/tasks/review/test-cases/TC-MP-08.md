# MP-08 - Checkout with very long input values (stress input length)

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser is open.
2. 1. Log in to SauceDemo (standard_user / secret_sauce).
3. 2. Add a product to cart and open the cart page.
4. 3. Click 'Checkout'.
5. 4. Enter First Name and Last Name with very long strings (e.g., 300+ characters) and Postal Code with a long numeric string (e.g., 50+ digits).
6. 5. Click 'Continue' and proceed to 'Overview' and attempt to 'Finish'.

## Expected Result

Application should not crash. Either the input is accepted and checkout completes successfully, or client-side validation prevents progression with a clear error message indicating input length constraints. No unexpected errors or server failures should occur.
