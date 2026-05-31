## Name MP-15 - Credentials with leading and trailing whitespace

## Priority
Low

## Type
Edge

## Steps

1. 1. Open https://www.saucedemo.com/
2. 2. Enter Username: ' standard_user ' (with leading and trailing spaces)
3. 3. Enter Password: ' secret_sauce ' (with leading and trailing spaces)
4. 4. Click the Login button

## Expected Result

Verify behavior for whitespace: either the app trims whitespace and authenticates successfully, or it treats whitespace as part of credential and rejects login. In either case behavior should be consistent and documented. No error page or crash.
