## Name MP-16 - Login attempt with Unicode and emoji in credentials

## Priority
Low

## Type
Edge

## Steps

1. 1. Navigate to the login page.
2. 2. Enter a username consisting of Unicode characters and emoji (e.g., 用户🙂) into the Username field.
3. 3. Enter a password consisting of Unicode and emoji into the Password field.
4. 4. Click the Login button.

## Expected Result

Application handles Unicode inputs gracefully. If credentials are invalid, login is rejected with an appropriate error. The UI should not break or mis-render text. No unexpected behavior or crashes occur.
