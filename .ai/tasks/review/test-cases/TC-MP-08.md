## Name MP-08 - Login fail with invalid username and valid password

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter an invalid username, e.g., 'invalid_user'.
3. Step 2: Enter valid password 'secret_sauce'.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. User receives an error message indicating credentials are incorrect (e.g., 'Username and password do not match any user in this service'). No session is created and user remains on login page.
