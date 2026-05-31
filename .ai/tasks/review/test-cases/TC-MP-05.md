## Name MP-05 - Session persistence after page refresh

## Priority
High

## Type
Positive

## Steps

1. 1. Log in with valid credentials and confirm you are on the inventory page.
2. 2. Refresh the browser (F5 or reload).
3. 3. Close the tab, reopen the application in a new tab (optional), and check whether the session persists depending on expected session lifetime.
4. 4. Verify that inventory content remains accessible without re-entering credentials (if session is supposed to persist).

## Expected Result

After refresh, the user remains authenticated and stays on the inventory page. Session storage/cookies persist across refresh as per application design and user does not get redirected to login immediately.
