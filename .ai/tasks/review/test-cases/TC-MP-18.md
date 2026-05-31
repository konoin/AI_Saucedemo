## Name MP-18 - Session invalidation after logout and back-button behavior

## Priority
High

## Type
Edge

## Steps

1. 1. Login successfully (standard_user / secret_sauce).
2. 2. On the inventory page, click Logout from the menu.
3. 3. After logout, try to use browser Back button to return to inventory page or click browser history entry for inventory.
4. 4. Additionally, attempt direct navigation to /inventory.html.

## Expected Result

After logout, the user remains unauthenticated. Using the Back button or history does not restore an authenticated session; either the user is shown the login page or a server-side redirect to login occurs. Direct navigation to /inventory.html without logging in redirects to the login page.
