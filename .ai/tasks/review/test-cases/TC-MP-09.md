## Name MP-09 - Checkout with non-numeric / alphanumeric postal codes

## Priority
Medium

## Type
Edge

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Enter valid First Name and Last Name, enter alphanumeric postal code (e.g., 'A1B 2C3' or '123-ABC'), then click Continue
5. Complete checkout if allowed

## Expected Result

If the application only requires presence, alphanumeric postal codes should be accepted and checkout proceeds; if format validation exists, a clear error message is shown. Application must handle input without errors.
