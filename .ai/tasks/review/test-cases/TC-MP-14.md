## Name MP-14 - SQL injection attempt in username and password fields

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter a common SQL injection string in username, e.g., "' OR '1'='1".
3. Step 2: Enter a common SQL injection string in password, e.g., "' OR '1'='1".
4. Step 3: Click 'Login'.
5. Step 4: Observe application response and server behavior (no stack traces or DB errors displayed).

## Expected Result

Login is rejected and application does not authenticate attacker. No database errors, stack traces, or sensitive information are displayed. Input is handled safely (parameterized queries/sanitization).
