## Name MP-09 - Login fail with valid username and invalid password

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter valid username 'standard_user'.
3. Step 2: Enter invalid password 'wrong_password'.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. User receives an error message indicating credentials are incorrect. No session is created and user remains on login page.
