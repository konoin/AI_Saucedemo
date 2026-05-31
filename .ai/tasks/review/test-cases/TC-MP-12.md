## Name MP-12 - Very long credentials (excessively long username and password)

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. In Username field enter a very long string (e.g., 10,000 'a' characters).
3. 3. In Password field enter a very long string (e.g., 10,000 'b' characters).
4. 4. Click Login.

## Expected Result

Application handles the input gracefully (no crash, no server error). Login fails and an appropriate invalid credential error is shown (e.g., "Username and password do not match any user"). Input should be safely handled at client or server side.
