## Name MP-08 - Attempt to checkout with an empty cart (no items)

## Priority
Medium

## Type
Negative

## Steps

1. Open application and login with standard_user / secret_sauce
2. Ensure cart is empty (remove all items if necessary) and open the cart
3. Attempt to click 'Checkout' from the cart page

## Expected Result

Application prevents checkout initiation. Expected behavior: Checkout cannot be started (button disabled or not present) or the site displays a message indicating the cart is empty and navigation to the checkout information page does not occur. No checkout form is presented.
