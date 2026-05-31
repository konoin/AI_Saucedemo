## Name MP-13 - Login attempt with very long credentials

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to the login page.
2. 2. Enter a very long string (e.g., 500+ characters) into the Username field.
3. 3. Enter a very long string (e.g., 500+ characters) into the Password field.
4. 4. Click the Login button.

## Expected Result

Application rejects login and displays an appropriate error message without crashing. Inputs are handled safely (no buffer overflow or unhandled exceptions). If there is input length validation, an informative message should be shown. No sensitive data is leaked.
