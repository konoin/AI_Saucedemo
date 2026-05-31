## Name MP-02 - Logout after successful login

## Priority
High

## Type
Positive

## Steps

1. Precondition: User is logged in (use valid credentials from MP-01).
2. 1. From the Inventory page, open the application menu (click the menu / hamburger icon).
3. 2. Click 'Logout'.

## Expected Result

User is redirected to the Login page (https://www.saucedemo.com/). Session is terminated: attempting to access /inventory.html redirects back to the login page or shows an unauthenticated state.
