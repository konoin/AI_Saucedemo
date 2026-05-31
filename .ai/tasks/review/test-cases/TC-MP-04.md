## Name MP-04 - Logout after successful login

## Priority
High

## Type
Positive

## Steps

1. 1. Log in with valid credentials and land on the inventory page.
2. 2. Open the application menu (hamburger/menu button).
3. 3. Click the Logout option.
4. 4. Attempt to navigate back to /inventory.html after logout (use address bar or browser back button).

## Expected Result

After clicking Logout, the user is returned to the login page. Accessing /inventory.html redirects to the login page or shows an authentication error. No authenticated session tokens should remain accessible.
