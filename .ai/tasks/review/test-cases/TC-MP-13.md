## Name MP-13 - Special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter a username with special characters (e.g., '!@#$%^&*()<>?/\"').
3. Step 2: Enter a password with special characters (e.g., '`~[]{};:|,.-_=+').
4. Step 3: Click 'Login'.

## Expected Result

Application properly accepts or rejects such input without introducing XSS/encoding issues or crashes. If credentials are invalid, login is rejected with a generic authentication failure message. No sensitive errors are displayed.
