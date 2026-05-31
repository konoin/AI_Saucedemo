## Name MP-14 - Login with special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. Open the SauceDemo login page.
2. Enter a username containing a range of special characters (e.g., !@#$%^&*()_+{}|:"<>?).
3. Enter a password containing special characters (e.g., `~[];',./<>?).
4. Click Login.

## Expected Result

Application safely handles special characters without errors or injection. Login fails if credentials are not valid (shows invalid credentials message). No unescaped output or script injection occurs in error messages.
