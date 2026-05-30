# MP-09 - Checkout with special characters in name and postal code

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser is open.
2. 1. Log in to SauceDemo using valid credentials.
3. 2. Add an item to the cart and go to the cart page.
4. 3. Click 'Checkout'.
5. 4. Enter First Name = "O'Connor-Smith", Last Name = "Anne-Marie", Postal Code = "A1B-2C3" (include apostrophes, hyphens, alphanumeric and special characters).
6. 5. Click 'Continue' and then 'Finish' on the overview page.

## Expected Result

Application accepts common special characters in name and postal code and completes checkout successfully unless explicit validation rules prohibit specific characters. No crashes or malformed display of entered data.
