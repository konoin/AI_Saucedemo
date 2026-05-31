## Name

MP-09 - Remove item from cart before checkout and complete order with remaining items

## Priority

Medium

## Type

Edge

## Steps

1. Log in to SauceDemo.
2. Add two products to the cart (e.g., 'Sauce Labs Backpack' and 'Sauce Labs Bike Light').
3. Open the cart page and remove one product (use the 'Remove' button for that item).
4. Verify the removed product no longer appears and the cart badge updates accordingly.
5. Click 'Checkout', provide valid information, continue to Overview, and click 'Finish'.

## Expected Result

Only the remaining item(s) are included in the final order. Order completes successfully, totals reflect only the items left in the cart, and removal does not cause errors or unintended side effects.
