# MP-06 - Checkout with missing postal code

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser is open.
2. 1. Open SauceDemo and log in with username = 'standard_user' and password = 'secret_sauce'.
3. 2. Add a product to cart and open the cart page.
4. 3. Click 'Checkout'.
5. 4. On 'Checkout: Your Information' enter First Name = 'Tom' and Last Name = 'Jones' but leave Postal Code blank.
6. 5. Click 'Continue'.

## Expected Result

Form validation prevents progression. An error message is shown for the missing postal code (expected message: 'Error: Postal Code is required'). User stays on the information entry page.
