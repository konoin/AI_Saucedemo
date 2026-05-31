## Name MP-15 - Login attempt with SQL-injection-like input

## Priority
High

## Type
Edge

## Steps

1. 1. Navigate to the login page.
2. 2. Enter username with an SQL-like payload (e.g., "' OR '1'='1") into the Username field.
3. 3. Enter password with similar payload into the Password field.
4. 4. Click the Login button.

## Expected Result

Login is rejected. The application is not vulnerable to SQL injection — payload is treated as data, not code. No authentication is bypassed and no sensitive information is disclosed. Appropriate error message appears.
