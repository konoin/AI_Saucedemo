## Name MP-06 - Login fail with empty password

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter valid username 'standard_user' in the username field.
3. Step 2: Leave the password field blank.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. An error message indicating missing password is displayed (e.g., 'Password is required' or the application's equivalent). No session is created and user remains on login page.
