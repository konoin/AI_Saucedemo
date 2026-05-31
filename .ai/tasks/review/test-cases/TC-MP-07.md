## Name MP-07 - Checkout with whitespace-only inputs treated as empty

## Priority
Medium

## Type
Edge

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Enter whitespace characters (e.g., spaces or tabs) into First Name and Last Name fields, and whitespace into Postal Code, then click Continue

## Expected Result

Application trims input or treats whitespace-only values as empty and displays appropriate validation errors (e.g., 'Error: First Name is required' or equivalent). No navigation to Overview occurs.
