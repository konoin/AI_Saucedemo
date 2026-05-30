## Name MP-06 - Checkout attempt with missing postal code

## Priority
High

## Type
Negative

## Steps

1. Log in to SauceDemo as 'standard_user'.
2. Add at least one product to the cart and open the cart.
3. Click 'Checkout' to go to the 'Your Information' page.
4. Enter First name: 'Liam' and Last name: 'Johnson' but leave Postal Code blank. Click 'Continue'.

## Expected Result

Checkout is blocked and a validation error message is displayed indicating the postal code is required (e.g., 'Error: Postal Code is required'). The user must enter a postal code to continue.
