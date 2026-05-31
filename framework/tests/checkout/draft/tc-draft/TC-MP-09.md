## Name MP-09 - Checkout with very long input values (edge case)

## Priority
Low

## Type
Edge

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add a product to the cart and open the cart
3. Click 'Checkout'
4. On Checkout: Your Information page, enter First Name and Last Name each with a 500-character long string and Postal Code = '99999'
5. Click 'Continue' and, if allowed, 'Finish'

## Expected Result

Application handles long inputs gracefully. Either the system accepts the values and completes checkout (showing order confirmation), or it rejects with a clear validation message specifying maximum input length. The application must not crash or expose stack traces.
