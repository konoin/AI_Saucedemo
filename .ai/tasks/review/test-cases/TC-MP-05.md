## Name MP-05 - Checkout attempt with missing last name

## Priority
High

## Type
Negative

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Enter valid First Name and Postal Code, leave Last Name empty, then click Continue

## Expected Result

Checkout is blocked and a validation error is shown specifying the missing last name (e.g., 'Error: Last Name is required'). User remains on Checkout: Your Information page.
