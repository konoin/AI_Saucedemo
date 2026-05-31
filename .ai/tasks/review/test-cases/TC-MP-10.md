## Name MP-10 - Checkout with special characters and unicode in name fields (edge case)

## Priority
Low

## Type
Edge

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add a product to cart and open the cart
3. Click 'Checkout'
4. On Checkout: Your Information page, enter First Name = 'Álëx!@#$', Last Name = 'O’Connor-测试', Postal Code = 'ABC-123'
5. Click 'Continue' and proceed to 'Finish' if allowed

## Expected Result

Application should accept or validly sanitize unicode and special characters and proceed to complete checkout, or present a clear validation message if such characters are not allowed. Application must not crash or behave unpredictably.
