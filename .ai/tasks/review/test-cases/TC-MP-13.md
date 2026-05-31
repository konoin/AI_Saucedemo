## Name MP-13 - Special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. In Username field enter: !@#$%^&*()_+{}|:"<>?[];'`,./
3. 3. In Password field enter: ~`•±§¶•ªº–≠
4. 4. Click Login.

## Expected Result

Application handles special characters safely (no crash, no unexpected behavior). Login should fail with a normal invalid credentials message unless such credentials are legitimately registered. No script execution or error pages.
