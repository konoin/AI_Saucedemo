# MP-03 - Checkout with empty checkout form (all fields empty)

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser is open.
2. 1. Navigate to SauceDemo and log in with username = 'standard_user' and password = 'secret_sauce'.
3. 2. Add at least one product to the cart and open the cart page.
4. 3. Click 'Checkout' to reach 'Checkout: Your Information' page.
5. 4. Leave First Name, Last Name and Postal Code fields empty.
6. 5. Click 'Continue'.

## Expected Result

Form validation prevents progression. An inline error message is displayed indicating the missing required field (expected message: 'Error: First Name is required' or equivalent). User remains on 'Checkout: Your Information' page.
