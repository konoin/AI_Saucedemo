## Name MP-16 - SQL injection attempt in username and password fields

## Priority
High

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. In Username field enter: ' OR '1'='1'; --
3. 3. In Password field enter: ' OR '1'='1'; --
4. 4. Click Login.

## Expected Result

Application treats input as plain text and does not execute injection. Login fails with invalid credentials message. No elevated access is granted and no database errors are returned to the client. Inputs are sanitized or parameterized on server side.
