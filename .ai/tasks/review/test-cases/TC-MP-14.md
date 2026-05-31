## Name MP-14 - Special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open the login page.
2. 2. Enter a username containing special characters (e.g., "!@#$%^&*()_+<>?").
3. 3. Enter a password containing special characters (e.g., "<>?/\|'\";:[]{}").
4. 4. Click Login.

## Expected Result

Application safely handles the input without crashing or executing characters. Login fails with invalid-credentials error if credentials are not valid. No script execution or unexpected behavior occurs.
