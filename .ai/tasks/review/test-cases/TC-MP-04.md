## Name MP-04 - Checkout attempt with missing first name

## Priority
High

## Type
Negative

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Leave First Name empty, enter valid Last Name and Postal Code, then click Continue

## Expected Result

Checkout is blocked and a validation error is shown specifying the missing first name (e.g., 'Error: First Name is required'). User remains on Checkout: Your Information page.
