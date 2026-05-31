## Name MP-11 - Cart persistence after logout and login (cart data loss risk)

## Priority
Medium

## Type
Edge

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add one or more products to the cart
3. Confirm items are shown in the cart
4. Logout from the application
5. Login again with the same user (standard_user)
6. Open the cart

## Expected Result

Cart contents are preserved for the user across logout/login in the same browser session (or as per application spec). If cart persistence is not intended by design, the system should clearly indicate the cart is empty. There must be no silent data loss without proper indication to the user.
