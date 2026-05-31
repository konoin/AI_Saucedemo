## Name MP-17 - Direct inventory page access without authentication

## Priority
High

## Type
Negative

## Steps

1. Open the browser and ensure no authenticated session exists (logout or use incognito)
2. Navigate directly to /inventory.html
3. Observe application behavior

## Expected Result

Access to /inventory.html is blocked for unauthenticated users and redirects to the login page. No inventory content should be visible without valid authentication.
