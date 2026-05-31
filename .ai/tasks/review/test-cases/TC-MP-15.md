## Name MP-15 - Access inventory page without login

## Priority
High

## Type
Negative

## Steps

1. Precondition: Start with a fresh browser session with no authentication.
2. Step 1: Navigate directly to /inventory.html or click a bookmarked link to /inventory.html.
3. Step 2: Observe whether the page renders or redirects to login.

## Expected Result

Anonymous access to /inventory.html is prevented. The application redirects to the login page or shows an authentication required message. No inventory content is exposed to unauthenticated users.
