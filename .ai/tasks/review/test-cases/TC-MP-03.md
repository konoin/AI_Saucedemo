## Name MP-03 - Session persistence after page refresh

## Priority
High

## Type
Positive

## Steps

1. Precondition: Login as standard_user and land on inventory page.
2. Step 1: With inventory page open, click browser refresh/reload.
3. Step 2: Observe UI and session state after reload.

## Expected Result

User remains authenticated after refresh and stays on the inventory page. Inventory content is still visible and no re-login prompt is shown. Session token remains valid.
