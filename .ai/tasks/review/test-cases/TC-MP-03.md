## Name MP-03 - Logout after successful login

## Priority
High

## Type
Positive

## Steps

1. 1. Login successfully (use standard_user / secret_sauce).
2. 2. From the inventory page, open the application menu (click the menu / hamburger icon).
3. 3. Click the Logout option.
4. 4. Observe the page and attempt to navigate to /inventory.html directly in the address bar.

## Expected Result

User is redirected to the login page after logout. Direct navigation to /inventory.html redirects back to the login page (no access to inventory without logging in).
