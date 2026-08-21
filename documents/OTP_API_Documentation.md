# OTP Login Plugin — API Documentation

**Base URL:** `https://localhost:5001`  
**Plugin Route Prefix:** `/otp`  
**Content-Type:** `application/json` (all POST requests)  
**Auth:** No token required for OTP endpoints. Admin session cookie used after login.

---

## Table of Contents

1. [GET /otp/login](#1-get-otplogin)
2. [GET /otp/verify-page](#2-get-otpverify-page)
3. [GET /otp/register-page](#3-get-otpregister-page)
4. [POST /otp/request](#4-post-otprequest)
5. [POST /otp/verify](#5-post-otpverify)
6. [POST /otp/resend](#6-post-otpresend)
7. [POST /otp/complete-registration](#7-post-otpcomplete-registration)
8. [POST /otp/admin-login](#8-post-otpadmin-login)
9. [GET /otp/status/{sessionId}](#9-get-otpstatussessionid)

---

## System Constants

| Parameter | Value | Description |
|---|---|---|
| OTP Length | 6 digits | Zero-padded numeric |
| OTP Expiry | 300 seconds (5 min) | After issue or resend |
| Max Verify Attempts | 5 | Per session, then locked |
| Max Resends | 3 | Per session |
| Resend Lock | 60 seconds | Minimum gap between resends |
| Resend Cooldown | 900 seconds (15 min) | Applied after 3 resends exhausted |
| Registration Token Expiry | 15 minutes | After OTP verify for new users |

---

## 1. GET /otp/login

**Description:** Serves the OTP login HTML page (3 tabs: Mobile OTP, Email OTP, Admin).

**Response:** `200 OK` — HTML page  
**Headers:** `Cache-Control: no-store, no-cache, must-revalidate`

---

## 2. GET /otp/verify-page

**Description:** Serves the OTP verification HTML page (6-digit input, countdown, resend).

**Response:** `200 OK` — HTML page  
**Headers:** `Cache-Control: no-store, no-cache, must-revalidate`

---

## 3. GET /otp/register-page

**Description:** Serves the registration HTML page for new users after OTP verification.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `token` | string | Yes | Registration token from `/otp/verify` response |
| `type` | string | Yes | `email` or `mobile` |

**Response:** `200 OK` — HTML page  
**Error:** `404 Not Found` — if HTML file missing on server

---

## 4. POST /otp/request

**Description:** Generates and sends a new 6-digit OTP. Creates a new OTP session.

**Request Body:**

```json
{
  "type": "email",
  "email": "user@example.com",
  "countryCode": null,
  "mobile": null
}
```

```json
{
  "type": "mobile",
  "countryCode": "+91",
  "mobile": "9876543210",
  "email": null
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | `"email"` or `"mobile"` |
| `email` | string | Conditional | Required when `type = "email"`. Must contain `@`. |
| `countryCode` | string | Conditional | Required when `type = "mobile"`. E.g. `"+91"` |
| `mobile` | string | Conditional | Required when `type = "mobile"`. Digits only. |

**Success Response `200 OK`:**

```json
{
  "ok": true,
  "sessionId": "a1b2c3d4e5f6...",
  "destination": "k***p@gmail.com",
  "expiresInSeconds": 300,
  "resendAvailableInSeconds": 60,
  "maxResends": 3,
  "maxVerifyAttempts": 5,
  "deliveryStatus": "sent",
  "deliveryError": null,
  "demoCode": null,
  "message": "OTP sent to k***p@gmail.com."
}
```

**`deliveryStatus` values:**

| Value | Meaning |
|---|---|
| `sent` | OTP delivered via SMTP/Twilio |
| `queued` | Direct SMTP failed, queued for retry |
| `demo` | No SMS provider configured — code shown in `demoCode` field |
| `failed` | Delivery failed — `demoCode` exposed so user is not blocked |

**Error Response `400 Bad Request`:**

```json
{ "ok": false, "error": "Invalid email." }
{ "ok": false, "error": "Invalid mobile." }
{ "ok": false, "error": "Invalid type." }
```

---

## 5. POST /otp/verify

**Description:** Validates the OTP code entered by the user. Signs in existing users or issues a registration token for new users.

**Request Body:**

```json
{
  "sessionId": "a1b2c3d4e5f6...",
  "code": "482910"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | Yes | Session ID from `/otp/request` |
| `code` | string | Yes | 6-digit OTP entered by user |

**Success — Existing User `200 OK`:**

```json
{
  "ok": true,
  "isNewUser": false,
  "redirectUrl": "/",
  "message": "OTP verified successfully. Signing you in..."
}
```

**Success — New User `200 OK`:**

```json
{
  "ok": true,
  "isNewUser": true,
  "registrationToken": "abc123...",
  "redirectUrl": "/otp/register-page?token=abc123...&type=email",
  "message": "OTP verified. Please complete your registration."
}
```

**Error — Incorrect OTP `200 OK`:**

```json
{
  "ok": false,
  "error": "Incorrect OTP. 3 attempt(s) remaining.",
  "attemptsRemaining": 3
}
```

**Error — Expired OTP `200 OK`:**

```json
{
  "ok": false,
  "expired": true,
  "error": "OTP has expired. Please request a new one."
}
```

**Error — Locked (max attempts) `200 OK`:**

```json
{
  "ok": false,
  "locked": true,
  "error": "Too many incorrect attempts. Please request a new OTP."
}
```

**Error — Session not found `404 Not Found`:**

```json
{
  "ok": false,
  "error": "No active OTP session. Please request a new OTP."
}
```

**Error — Missing fields `400 Bad Request`:**

```json
{ "ok": false, "error": "Invalid request." }
```

---

## 6. POST /otp/resend

**Description:** Resends OTP to the same destination. Issues a fresh code (invalidates previous). Subject to cooldown limits.

**Request Body:**

```json
{
  "sessionId": "a1b2c3d4e5f6..."
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | Yes | Session ID from `/otp/request` |

**Success `200 OK`:**

```json
{
  "ok": true,
  "destination": "k***p@gmail.com",
  "expiresInSeconds": 300,
  "resendAvailableInSeconds": 60,
  "resendCount": 1,
  "maxResends": 3,
  "deliveryStatus": "sent",
  "deliveryError": null,
  "demoCode": null,
  "message": "A new OTP has been sent to k***p@gmail.com."
}
```

**Error — Too soon (60s lock) `200 OK`:**

```json
{
  "ok": false,
  "waitSeconds": 45,
  "error": "Please wait 45 seconds before requesting again."
}
```

**Error — Cooldown active (after 3 resends) `200 OK`:**

```json
{
  "ok": false,
  "cooldown": true,
  "waitSeconds": 900,
  "error": "Resend limit reached. Try again in 15 minutes."
}
```

**Error — Session not found `404 Not Found`:**

```json
{ "ok": false, "error": "No active OTP session." }
```

---

## 7. POST /otp/complete-registration

**Description:** Creates a new customer account after OTP verification. Called from the registration form. Validates the registration token issued by `/otp/verify`.

**Request Body — Email OTP user (phone required):**

```json
{
  "registrationToken": "abc123...",
  "firstName": "Kashish",
  "lastName": "Pratap",
  "email": null,
  "phone": "+919876543210"
}
```

**Request Body — Mobile OTP user (email required):**

```json
{
  "registrationToken": "abc123...",
  "firstName": "Kashish",
  "lastName": "Pratap",
  "email": "user@example.com",
  "phone": null
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `registrationToken` | string | Yes | Token from `/otp/verify` response |
| `firstName` | string | Yes | Customer first name |
| `lastName` | string | Yes | Customer last name |
| `email` | string | Conditional | Required when OTP type was `mobile` |
| `phone` | string | Conditional | Required when OTP type was `email`. Format: `+CC<digits>` |

**Success — New account created `200 OK`:**

```json
{
  "ok": true,
  "isNewUser": true,
  "redirectUrl": "/",
  "message": "Account created successfully. Welcome!"
}
```

**Success — Account already existed (signed in) `200 OK`:**

```json
{
  "ok": true,
  "isNewUser": false,
  "redirectUrl": "/",
  "message": "An account with this email already exists. Signed in."
}
```

**Error — Token expired `200 OK`:**

```json
{
  "ok": false,
  "expired": true,
  "error": "Registration session expired. Please start over."
}
```

**Error — Token invalid `200 OK`:**

```json
{
  "ok": false,
  "error": "Registration session expired or invalid. Please start again."
}
```

**Error — Validation `200 OK`:**

```json
{ "ok": false, "error": "First name is required." }
{ "ok": false, "error": "Last name is required." }
{ "ok": false, "error": "Email address is required." }
{ "ok": false, "error": "Please enter a valid email address." }
```

---

## 8. POST /otp/admin-login

**Description:** Authenticates an administrator using email and password. Validates credentials via nopCommerce's built-in auth service and checks the Administrator role before signing in.

**Request Body:**

```json
{
  "email": "admin@yourstore.com",
  "password": "Admin@123"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | Admin account email |
| `password` | string | Yes | Admin account password |

**Success `200 OK`:**

```json
{
  "ok": true,
  "redirectUrl": "/Admin/"
}
```

**Error responses `200 OK`:**

```json
{ "ok": false, "error": "No account found with this email." }
{ "ok": false, "error": "Incorrect password." }
{ "ok": false, "error": "This account is locked. Please try later." }
{ "ok": false, "error": "This account is not active." }
{ "ok": false, "error": "Access denied. This login is for administrators only." }
```

---

## 9. GET /otp/status/{sessionId}

**Description:** Returns the current state of an OTP session. Useful for polling or debugging.

**Path Parameter:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sessionId` | string | Yes | Session ID from `/otp/request` |

**Success `200 OK`:**

```json
{
  "ok": true,
  "destination": "k***p@gmail.com",
  "type": "email",
  "expiresInSeconds": 210,
  "resendAvailableInSeconds": 0,
  "cooldownSeconds": 0,
  "resendCount": 1,
  "maxResends": 3,
  "verifyAttempts": 2,
  "maxVerifyAttempts": 5,
  "deliveryStatus": "sent"
}
```

**Error `404 Not Found`:**

```json
{ "ok": false, "error": "No active OTP session." }
```

---

## OTP Session Lifecycle

```
[User enters email/mobile]
        │
        ▼
POST /otp/request
  → sessionId created
  → OTP generated, hashed, sent
        │
        ▼
POST /otp/verify (up to 5 attempts)
  ├── Expired    → { expired: true }
  ├── Locked     → { locked: true }
  ├── Wrong OTP  → { attemptsRemaining: N }
  ├── Correct + Existing User → Sign In → Redirect "/"
  └── Correct + New User
          │
          ▼
      POST /otp/complete-registration
        → Account created → Sign In → Redirect "/"

(Resend allowed every 60s, max 3 times, then 15-min cooldown)
```

---

## Error Handling Notes

- All API errors return HTTP `200 OK` with `{ "ok": false, "error": "..." }` unless noted
- HTTP `400` is returned only for structurally invalid/missing request bodies
- HTTP `404` is returned only when a session or page is not found
- Session expiry on protected pages returns HTTP `401` with `{ "sessionExpired": true }` for AJAX requests, and a redirect to `/otp/login` for browser navigation
