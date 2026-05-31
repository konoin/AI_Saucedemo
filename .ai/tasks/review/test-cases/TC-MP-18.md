## Name MP-18 - Ensure inventory is not accessible after logout (back button / direct URL)

## Priority
High

## Type
Negative

## Steps

1. 1. Login using valid credentials (standard_user / secret_sauce) and navigate to the Inventory page.
2. 2. Logout using application menu (see MP-02).
3. 3. After logout, press the browser Back button to return to the Inventory page OR directly paste /inventory.html in the address bar and press Enter.
4. 4. Observe the resulting page and any redirect behavior.

## Expected Result

After logout, the Inventory page must not be accessible. Using Back button or direct URL must redirect to the Login page or show an unauthenticated view. No inventory item details or user-specific data should be visible.
