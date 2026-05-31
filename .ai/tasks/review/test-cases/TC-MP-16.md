## Name MP-16 - Session invalidation after logout and back-navigation

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Login as standard_user and land on inventory page.
2. Step 1: Logout using the application's logout action.
3. Step 2: After logout, click the browser back button or attempt to access /inventory.html again.
4. Step 3: Observe whether the application allows access or forces re-authentication.

## Expected Result

After logout, the session is invalidated. Using browser back or direct URL should not allow access to authenticated pages; the app should redirect back to login page or present an authentication challenge. No stale authenticated content should be accessible.
