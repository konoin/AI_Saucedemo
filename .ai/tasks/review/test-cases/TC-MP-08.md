## Name MP-08 - Checkout with very long input values

## Priority
Medium

## Type
Edge

## Steps

1. Open SauceDemo and login with valid credentials
2. Add a product to the cart and open the cart
3. Click Checkout
4. Enter extremely long strings (e.g., 300+ characters) into First Name and Last Name and a long Postal Code string, then click Continue
5. If application accepts, proceed to Overview and Finish; if rejects, observe validation message

## Expected Result

Application either accepts long inputs without layout breakage and allows checkout to proceed, or provides a clear validation error. UI must not crash or exhibit rendering issues.
