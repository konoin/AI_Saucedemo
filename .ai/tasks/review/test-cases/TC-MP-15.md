## Name MP-15 - Credentials with leading and trailing spaces

## Priority
Low

## Type
Edge

## Steps

1. Open the SauceDemo login page.
2. Enter username with leading/trailing spaces (e.g., ' standard_user ').
3. Enter password with leading/trailing spaces (e.g., ' secret_sauce ').
4. Click Login.

## Expected Result

Behavior is defined and consistent: either the application trims whitespace and logs in successfully (preferred) or returns invalid credentials message. Document observed behavior; it must not produce unexpected errors.
