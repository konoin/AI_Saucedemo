# MP-04 - Checkout with missing first name

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser is open.
2. 1. Go to SauceDemo and log in with username = 'standard_user' and password = 'secret_sauce'.
3. 2. Add a product to the cart and open the cart page.
4. 3. Click 'Checkout'.
5. 4. On 'Checkout: Your Information' enter Last Name = 'Doe' and Postal Code = '94103' but leave First Name blank.
6. 5. Click 'Continue'.

## Expected Result

Form validation prevents progression. An error message is shown for the missing first name (expected message: 'Error: First Name is required'). User stays on the information entry page until First Name is provided.
