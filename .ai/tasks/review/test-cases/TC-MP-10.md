## Name MP-10 - Login fail with invalid username and invalid password

## Priority
High

## Type
Negative

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter invalid username 'no_user'.
3. Step 2: Enter invalid password 'no_pass'.
4. Step 3: Click 'Login'.

## Expected Result

Login is rejected. User receives a generic authentication failure message. No session is created and user remains on login page.
