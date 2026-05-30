# MP-07 - Checkout with whitespace-only fields (fields filled with spaces)

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser is open.
2. 1. Log in to SauceDemo with username = 'standard_user' and password = 'secret_sauce'.
3. 2. Add a product to the cart and go to the cart page.
4. 3. Click 'Checkout'.
5. 4. Enter First Name = '   ' (spaces), Last Name = '   ', Postal Code = '   '.
6. 5. Click 'Continue'.

## Expected Result

Application treats whitespace-only inputs as empty and prevents progression. An appropriate validation error is displayed (expected: 'Error: First Name is required' or equivalent). Fields should not accept only whitespace as valid input.
