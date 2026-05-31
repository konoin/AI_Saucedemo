## Name MP-15 - Leading and trailing whitespace in username/password

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open the login page.
2. 2. Enter username with leading/trailing spaces (e.g., " standard_user ").
3. 3. Enter password with leading/trailing spaces (e.g., " secret_sauce ").
4. 4. Click Login.

## Expected Result

If the application trims whitespace, login succeeds (user lands on inventory). If the application does not trim, login fails with invalid-credentials error. Test should assert the actual behavior and document whether trimming occurs. In all cases, no unexpected error or crash should occur.
