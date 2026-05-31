## Name MP-17 - Attempt to access inventory page without authentication (unauthorized access)

## Priority
High

## Type
Negative

## Steps

1. 1. Open browser and navigate directly to https://www.saucedemo.com/inventory.html without logging in
2. 2. Observe the behavior of the application

## Expected Result

Access is denied and user is redirected to the login page (or shown an authentication required message). No inventory content is visible to unauthenticated users. Session-protected routes must not expose data.
