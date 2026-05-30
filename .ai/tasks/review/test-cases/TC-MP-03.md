## Name MP-03 - Checkout attempt with all checkout fields empty

## Priority
High

## Type
Negative

## Steps

1. Open SauceDemo and log in with valid credentials ('standard_user' / 'secret_sauce').
2. Add a product to the cart and open the cart page.
3. Click 'Checkout' to navigate to the 'Checkout: Your Information' page.
4. Leave First name, Last name, and Postal Code fields empty and click 'Continue'.

## Expected Result

Checkout is blocked. A clear validation error message is displayed indicating required fields must be filled (e.g., 'Error: First Name is required'). The user remains on the checkout information page until mandatory fields are provided.
