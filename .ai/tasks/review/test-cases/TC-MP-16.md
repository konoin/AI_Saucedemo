## Name MP-16 - Case sensitivity check for username and password

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open the login page.
2. 2. Enter username with different case than stored (e.g., "Standard_User").
3. 3. Enter password with different case (e.g., "Secret_Sauce").
4. 4. Click Login.

## Expected Result

Login fails if credentials are case-sensitive (most systems are). Display a clear invalid-credentials message. Confirm and document whether the system treats credentials as case-sensitive.
