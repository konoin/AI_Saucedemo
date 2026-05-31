## Name

MP-04 - Checkout attempt with missing first name

## Priority

High

## Type

Negative

## Steps

1. Log in to SauceDemo as 'standard_user'.
2. Add any product to the cart and go to the cart page.
3. Click 'Checkout' to reach the 'Checkout: Your Information' page.
4. Enter Last name: 'Brown' and Postal Code: '10001' but leave First name blank. Click 'Continue'.

## Expected Result

Checkout is blocked and a validation error message is displayed indicating the first name is required (e.g., 'Error: First Name is required'). The user cannot proceed until the First name is provided.
