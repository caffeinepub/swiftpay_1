# SwiftPay

## Current State
Full PhonePe-style payment app with wallet, send/request money, bill payments, recharge, QR scan, transaction history, notifications, and admin panel. Login/signup with phone + password + MPIN. Payment success animations with chime and haptic vibration. QR code generation and scanning with UPI deep-link format.

## Requested Changes (Diff)

### Add
- Helper function `ensureUserRole(caller)` that checks `principalToPhone` and auto-assigns `#user` role if missing -- called at the top of every protected function before the permission check

### Modify
- `topUpWallet`: replace hard `Runtime.trap("Unauthorized: Only users can top up wallet")` with `ensureUserRole` call so logged-in users who lost their session role can still top up
- `sendMoney`: same fix -- call `ensureUserRole` before the permission check
- `requestMoney`, `acceptRequest`, `declineRequest`, `payBill`: same fix
- `getTransactionHistory`, `getRecentTransactions`, `getNotifications`, `markNotificationAsRead`, `getUnreadNotificationCount`: same fix
- `getWalletBalance`, `getWalletBalanceByUpiId`, `getWalletBalanceByPhone`: same fix
- `saveCallerUserProfile`, `createOrUpdateProfile`: same fix

### Remove
- Nothing removed

## Implementation Plan
1. Add `ensureUserRole(caller: Principal): Bool` helper that checks `principalToPhone` and conditionally adds `#user` role
2. In every function that does `AccessControl.hasPermission(accessControlState, caller, #user)` check: call `ensureUserRole(caller)` first, then re-check or use the return value
3. Keep all existing logic, data structures, and API signatures identical
4. Rebuild backend, redeploy
