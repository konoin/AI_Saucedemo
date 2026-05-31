## Name MP-17 - Cross-site scripting (XSS) attempt in username and password fields

## Priority
High

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. In Username field enter: <script>alert('xss')</script>
3. 3. In Password field enter: <img src=x onerror=alert('xss')>
4. 4. Click Login.

## Expected Result

Application neutralizes/escapes script input and does not execute injected scripts. Login fails with invalid credentials message. No JavaScript alerts from injected payloads should appear, and the app should not render unsafe HTML from inputs.
