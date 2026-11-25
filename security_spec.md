# Security Specification & Payload TDD — Apex Tech Authentication

## 1. Data Invariants
1. **Identity Binding**: A document at `/users/{userId}` can only be read, created, or updated by `request.auth.uid == userId` (or a verified admin).
2. **No Self-Assigned Privileges**: A user creating their own profile at `/users/{userId}` MUST set `role == 'EXECUTIVE'` (least privilege) unless they are the verified bootstrapped admin (`sagargirdher22@gmail.com` with `email_verified == true`), and users MUST NOT be able to elevate their own `role` during updates.
3. **Email Verification Gate**: Updating profile details or `emailVerified` to `true` requires `request.auth.token.email_verified == true` (except initial registration profile creation before verification link is clicked, where `emailVerified` MUST be `false` and `role` MUST be `'EXECUTIVE'`).
4. **PII Isolation**: `/users/{userId}` contains `email` and `fullName`; blanket reads or collection-wide `list` queries by non-admins are strictly forbidden.
5. **Strict Schema & Immutability**: `uid`, `email`, and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must match `request.time`. No unapproved/shadow fields are allowed (`hasOnly`).

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: `{}` sent to `/users/u1` with `auth == null`.
2. **Identity Spoofing Create**: `{ uid: "victim", fullName: "Attacker", email: "a@b.com", role: "EXECUTIVE", emailVerified: false, createdAt: NOW, updatedAt: NOW }` sent by `auth.uid == "attacker"` to `/users/attacker`.
3. **Cross-User Write**: Valid payload for `victim` sent by `auth.uid == "attacker"` to `/users/victim`.
4. **Self-Assigned Admin Role on Create**: `{ uid: "u1", fullName: "Bob", email: "bob@co.in", role: "ADMIN", emailVerified: false, createdAt: NOW, updatedAt: NOW }` sent by non-admin `u1`.
5. **Privilege Escalation on Update**: `{ role: "ADMIN", updatedAt: NOW }` sent by `u1` to `/users/u1`.
6. **Shadow / Ghost Field Injection**: Valid payload plus `isSuperAdmin: true` sent to `/users/u1`.
7. **Forged emailVerified Flag on Create**: `{ uid: "u1", ..., emailVerified: true }` when `request.auth.token.email_verified == false`.
8. **Client-Spoofed Timestamp**: `{ ..., createdAt: "2020-01-01T00:00:00Z" }` instead of `request.time`.
9. **Oversized String / Resource Poisoning**: `fullName` with 5,000 characters (`> 100`) or invalid document ID `../bad`.
10. **PII Leak via Blanket Get**: `get(/users/victim)` executed by `auth.uid == "attacker"`.
11. **PII Scrape via List Query**: `list(/users)` executed by non-admin `auth.uid == "attacker"`.
12. **Email Spoofing Admin Bypass**: `auth.token.email == "sagargirdher22@gmail.com"` with `auth.token.email_verified == false` attempting admin read/write.
