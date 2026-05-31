## Name MP-10 - Cart data persistence across navigation and page refresh

## Priority
Medium

## Type
Edge

## Steps

1. Open SauceDemo and login with valid credentials
2. On products page add a product to the cart
3. Navigate to a product details page and then back to the products list
4. Verify the cart badge still shows the added item count
5. Open the cart and verify the product is present
6. Refresh the browser on the cart page and verify the product remains in the cart

## Expected Result

Cart maintains added items across navigation and page refreshes in the same session. No unexpected loss of cart data occurs.
