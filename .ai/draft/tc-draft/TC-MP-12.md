## Name MP-12 - Order completion interrupted by network failure (retry behavior)

## Priority
Medium

## Type
Edge

## Steps

1. Open application and login with standard_user / secret_sauce
2. Add a product to the cart and proceed to Checkout -> Overview
3. Simulate a network failure (e.g., disable network or throttle to 0 KB/s) just before clicking 'Finish'
4. Click 'Finish' while network is offline
5. Restore network connectivity and attempt to retry finish/complete order (if retry UI exists) or repeat 'Finish' operation

## Expected Result

When network fails during order completion, the application shows a clear error message indicating the failure and does not show an order confirmation. After network restoration, user can retry the finish action and successfully complete the order. The system should not create duplicate orders or leave the UI in an inconsistent state.
