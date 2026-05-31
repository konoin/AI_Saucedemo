## Name MP-13 - Login attempt with special characters in credentials

## Priority
Medium

## Type
Edge Case

## Steps

1. Open the SauceDemo login page
2. Enter a username containing special characters (e.g., "user!@#$%^&*()")
3. Enter a password containing special characters (e.g., "p@$$w0rd!<>?")
4. Click the Login button

## Expected Result

Application validates input safely and either authenticates if the credentials are valid or shows an appropriate authentication error. Special characters must not cause injection, encoding, or UI rendering issues.
