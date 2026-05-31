## Name MP-14 - Login attempt with special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to the login page.
2. 2. Enter a username containing special characters (e.g., ;'"<>/\ or SQL meta-characters).
3. 3. Enter a password containing special characters.
4. 4. Click the Login button.

## Expected Result

Login is rejected if credentials are invalid. The application correctly sanitizes or safely handles special characters without executing them (no SQL injection or XSS). An appropriate error message is displayed and the UI remains stable.
