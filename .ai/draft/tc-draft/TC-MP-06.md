## Name MP-06 - Checkout with missing last name (validate error)

## Priority
High

## Type
Negative

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add a product to cart and open the cart
3. Click 'Checkout'
4. On Checkout: Your Information page, enter First Name = 'Emma', leave Last Name empty, enter Postal Code = '30303'
5. Click 'Continue'

## Expected Result

System blocks progression and displays a clear validation error message: 'Error: Last Name is required.' User remains on the Checkout: Your Information page.
