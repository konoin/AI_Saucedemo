## Name MP-03 - Checkout attempt with all checkout fields empty

## Priority
High

## Type
Negative

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout to go to Checkout: Your Information page
4. Leave First Name, Last Name and Postal Code empty and click Continue

## Expected Result

Checkout is blocked and the application shows a validation error indicating the first required field missing (e.g., 'Error: First Name is required'). No navigation to the Overview page occurs.
