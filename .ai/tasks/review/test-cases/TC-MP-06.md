## Name MP-06 - Checkout attempt with missing postal code

## Priority
High

## Type
Negative

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Enter valid First Name and Last Name, leave Postal Code empty, then click Continue

## Expected Result

Checkout is blocked and a validation error is shown specifying the missing postal code (e.g., 'Error: Postal Code is required'). User remains on Checkout: Your Information page.
