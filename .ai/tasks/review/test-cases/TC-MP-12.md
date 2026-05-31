## Name MP-12 - Very long credentials (username and password)

## Priority
Medium

## Type
Edge

## Steps

1. Precondition: Browser on SauceDemo login page.
2. Step 1: Enter a very long username string (e.g., 5000 characters of 'a').
3. Step 2: Enter a very long password string (e.g., 5000 characters of 'b').
4. Step 3: Click 'Login'.
5. Step 4: Observe application behavior, any error messages, UI stability, and server response time.

## Expected Result

Application handles the long input gracefully without crashing or revealing internal errors. Login is rejected with an appropriate authentication/failure message. Inputs are safely truncated/validated on client or server. No session is created.
