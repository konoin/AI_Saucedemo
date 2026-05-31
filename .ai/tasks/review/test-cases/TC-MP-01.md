## Name MP-01 - Login with valid credentials (standard_user)

## Priority
High

## Type
Positive

## Steps

1. Precondition: Browser cleared of session/cookies. Navigate to SauceDemo login page (https://www.saucedemo.com/).
2. Step 1: In the username field enter 'standard_user'.
3. Step 2: In the password field enter 'secret_sauce'.
4. Step 3: Click the 'Login' button.

## Expected Result

User is authenticated and redirected to the inventory page (/inventory.html). Inventory items are visible. A session identifier (cookie/localStorage token) is created indicating authenticated session.
