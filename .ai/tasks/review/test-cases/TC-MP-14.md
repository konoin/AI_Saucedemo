## Name MP-14 - Attempt SQL injection in username and password fields

## Priority
High

## Type
Edge

## Steps

1. 1. Open https://www.saucedemo.com/
2. 2. Enter Username: ' OR '1'='1'; --
3. 3. Enter Password: ' OR '1'='1'; --
4. 4. Click the Login button

## Expected Result

Application does not authenticate the user. Input is treated as data (not executable SQL). No bypass occurs. An authentication failure message is shown and no stack trace or DB error is exposed to the user.
