## Name MP-12 - Locked user login attempt

## Priority
High

## Type
Negative

## Steps

1. Open the SauceDemo login page.
2. Enter username: locked_out_user.
3. Enter password: secret_sauce.
4. Click Login.

## Expected Result

Login is prevented. The application shows a locked account message (e.g., 'Epic sadface: Sorry, this user has been locked out.'). User cannot access Inventory and no session is created.
