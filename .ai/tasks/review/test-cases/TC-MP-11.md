## Name MP-11 - Locked user cannot login (locked_out_user)

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter username 'locked_out_user'.
3. Step 2: Enter password 'secret_sauce'.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. An explicit error message indicating the account is locked is displayed (e.g., 'Sorry, this user has been locked out.'). No session is created and user remains on login page.
