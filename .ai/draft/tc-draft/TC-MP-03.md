## Name MP-03 - Remove an item from cart before checkout and complete purchase of remaining items

## Priority
Medium

## Type
Positive

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add two products to the cart (e.g., Backpack and Bike Light)
3. Open the cart
4. Remove one product from the cart (click 'Remove' on one item)
5. Verify only the remaining product is listed in the cart
6. Click 'Checkout' and enter valid checkout information: First Name = 'Bob', Last Name = 'Lee', Postal Code = '10001'
7. Click 'Continue' and then 'Finish'

## Expected Result

Checkout completes successfully for the remaining product. Removed item is not present on Overview or in the completed order.
