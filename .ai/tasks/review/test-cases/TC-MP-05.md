# MP-05 - Checkout with missing last name

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser is open.
2. 1. Navigate to SauceDemo and log in with valid credentials.
3. 2. Add a product to the cart and open the cart page.
4. 3. Click 'Checkout'.
5. 4. On 'Checkout: Your Information' enter First Name = 'Jane' and Postal Code = '10001' but leave Last Name blank.
6. 5. Click 'Continue'.

## Expected Result

Form validation prevents progression. An error message is shown for the missing last name (expected message: 'Error: Last Name is required'). User remains on the information entry page.
