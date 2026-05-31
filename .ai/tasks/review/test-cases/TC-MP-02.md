## Name MP-02 - Logout after successful login

## Priority
High

## Type
Positive

## Steps

1. Log in using valid credentials (standard_user / secret_sauce)
2. Open the application menu (if applicable)
3. Click the Logout option
4. Attempt to navigate directly to /inventory.html after logout

## Expected Result

User is returned to the login page after logout. Attempting to access /inventory.html redirects to the login page (no access to inventory without login).
