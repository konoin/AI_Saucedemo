## Name MP-15 - Case sensitivity of username and password

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. For username enter: Standard_User (change case from correct 'standard_user').
3. 3. For password enter: Secret_Sauce (change case from 'secret_sauce').
4. 4. Click Login.

## Expected Result

Authentication is case-sensitive for username and password. Login should fail if case differs from stored credentials (display invalid credentials message). If application spec allows case-insensitive username, adjust expected accordingly; password should remain case-sensitive.
