## Name MP-16 - Username case sensitivity check

## Priority
Low

## Type
Edge

## Steps

1. Open the SauceDemo login page.
2. Enter username with different case (e.g., Standard_User or STANDARD_USER) while using the correct password secret_sauce.
3. Click Login.

## Expected Result

Authentication enforces the system's case-sensitivity rules. If usernames are case-sensitive, login fails with invalid credentials message. If case-insensitive, login succeeds. The observed behavior must be consistent and documented.
