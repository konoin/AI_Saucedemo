## Name MP-15 - Case sensitivity check for username and password

## Priority
Low

## Type
Edge Case

## Steps

1. Open the SauceDemo login page
2. Enter username with different casing (e.g., 'Standard_User')
3. Enter password with different casing (e.g., 'Secret_Sauce')
4. Click the Login button

## Expected Result

Authentication enforces correct case as per system design (commonly usernames/passwords are case-sensitive). If credentials differ by case, authentication fails with appropriate error message.
