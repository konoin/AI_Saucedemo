## Name MP-04 - Checkout with all checkout fields empty (validate error)

## Priority
High

## Type
Negative

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add any product to the cart and open the cart
3. Click 'Checkout'
4. On Checkout: Your Information page, leave First Name, Last Name and Postal Code fields empty
5. Click 'Continue'

## Expected Result

System blocks progression and displays a clear validation error message. Expected message: 'Error: First Name is required.' (or equivalent). User remains on the Checkout: Your Information page.
