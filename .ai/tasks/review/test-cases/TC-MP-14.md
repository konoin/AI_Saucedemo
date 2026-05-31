## Name MP-14 - Login with leading/trailing whitespace in username/password

## Priority
Low

## Type
Edge Case

## Steps

1. Open the SauceDemo login page
2. Enter username with leading/trailing spaces (e.g., ' standard_user ')
3. Enter password with leading/trailing spaces (e.g., ' secret_sauce ')
4. Click the Login button

## Expected Result

Application either trims whitespace before authentication and logs in successfully (if credentials match after trim) or rejects with a clear error. No unexpected authentication success due to whitespace or server errors.
