# SwiftPay

## Current State

SwiftPay is a full-stack PhonePe-style payment app with:
- Phone+password+MPIN-based login/signup (NOT Internet Identity)
- Wallet, send/receive money, QR payments, bill payments, recharge
- Admin panel, transaction history, notifications
- The backend uses `principalToPhone` to map anonymous principals to phone accounts
- `accounts` map stores phone -> Account (with passwordHash, mpinHash, principalId)
- `profiles` map stores Principal -> Profile
- `getCallerUserProfile` calls `profiles.get(caller)` which fails on revisit because the caller is a new anonymous principal

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- **Backend `login` function**: After verifying password, migrate the profile to the new caller principal. Remove old principal's profile entry. Update `accounts` to store the latest `principalId`. Ensure role is assigned to the new principal.
- **Backend `getCallerUserProfile`**: Look up profile via `principalToPhone` first, then `profiles.get(caller)`. If `principalToPhone` has a phone for this caller, use `getProfileByPhone` to find the profile.
- **Backend `getWalletBalance`**: Same fix -- look up via principalToPhone if direct profile lookup fails.
- **Backend `getTransactionHistory`**: Same fix.
- **Backend `getRecentTransactions`**: Same fix.
- **Backend `getNotifications`**: Same fix.
- **Backend `verifyMpin`**: Already works via principalToPhone -- keep as is.
- **Backend `hasAccount`**: Already works via principalToPhone -- keep as is.

### Remove
- Nothing

## Implementation Plan

1. Fix `login` to migrate profile to new principal and update `accounts.principalId`.
2. Fix `getCallerUserProfile` to resolve profile via `principalToPhone` -> phone -> profile lookup if `profiles.get(caller)` is null.
3. Fix all other caller-dependent query functions (`getWalletBalance`, `getTransactionHistory`, `getRecentTransactions`, `getNotifications`, `markNotificationAsRead`, `getPendingMoneyRequests`, `getUnreadNotificationCount`, `payBill`, `topUpWallet`, `sendMoney`, `requestMoney`, `acceptRequest`, `declineRequest`) to similarly resolve the profile via phone mapping when direct principal lookup fails.
4. The key pattern: whenever the code does `profiles.get(caller)` and traps if null, first try to find the profile via `principalToPhone.get(caller)` -> phone -> `getProfileByPhone(phone)` and migrate the entry to the caller principal if found.
