## Name MP-05 - Login fail with empty username

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Leave the username field blank.
3. Step 2: Enter valid password 'secret_sauce' in the password field.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. An error message indicating missing username is displayed (e.g., 'Username is required' or the application's equivalent). No session is created and user remains on login page.
