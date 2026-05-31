## Name MP-02 - Logout after successful login

## Priority
High

## Type
Positive

## Steps

1. Precondition: User is logged in (standard_user). On inventory page.
2. Step 1: Open the app menu (if applicable) and click 'Logout' or click the logout button.
3. Step 2: Observe the application state and attempt to navigate back to /inventory.html or reload the inventory page.

## Expected Result

User is redirected to the login page. Session token/cookie/localStorage authentication data is removed or invalidated. Accessing /inventory.html without re-login redirects back to login page.
