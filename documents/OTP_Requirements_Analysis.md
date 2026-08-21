# OTP Login Plugin — Requirements Analysis Document

**Project:** nopCommerce OTP Login Plugin (`Nop.Plugin.Misc.OtpLogin`)  
**Audience:** QA Testers  
**Version:** 1.0  
**Date:** May 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Functional Requirements](#2-functional-requirements)
   - 2.1 OTP Request
   - 2.2 OTP Verification
   - 2.3 OTP Resend
   - 2.4 New User Registration
   - 2.5 Admin Login
   - 2.6 Session Management
3. [Test Cases by Feature Area](#3-test-cases-by-feature-area)
4. [System Limits & Constraints](#4-system-limits--constraints)
5. [Test Environment Setup](#5-test-environment-setup)
6. [How to Test Each Scenario Step-by-Step](#6-how-to-test-each-scenario-step-by-step)

---

## 1. Overview

The OTP Login plugin replaces the standard nopCommerce username/password login for regular customers with a one-time password flow. It supports:

- **Email OTP login** — user enters email, receives 6-digit OTP via email
- **Mobile OTP login** — user enters mobile number, receives OTP via SMS (Twilio)
- **New user auto-registration** — if no account exists for that email/phone, user is prompted to fill in name and create an account
- **Admin login** — separate tab for administrators using email + password
- **Session management** — authenticated sessions expire after 30 minutes of inactivity

---

## 2. Functional Requirements

---

### 2.1 OTP Request

| ID | Requirement | Status |
|---|---|---|
| REQ-001 | User can request OTP via email address | ✅ Implemented |
| REQ-002 | User can request OTP via mobile number with country code | ✅ Implemented |
| REQ-003 | OTP is 6 digits, zero-padded, cryptographically random | ✅ Implemented |
| REQ-004 | OTP is stored as SHA-256 hash (never plain text) | ✅ Implemented |
| REQ-005 | OTP expires in 5 minutes | ✅ Implemented |
| REQ-006 | Email OTP is sent via SMTP (Gmail, port 465 SSL) | ✅ Implemented |
| REQ-007 | Mobile OTP is sent via Twilio SMS | ✅ Implemented |
| REQ-008 | Destination shown in masked form (e.g., `k***p@gmail.com`, `+91 ******3210`) | ✅ Implemented |
| REQ-009 | Session ID returned to client for subsequent calls | ✅ Implemented |

---

### 2.2 OTP Verification

| ID | Requirement | Status |
|---|---|---|
| REQ-010 | User can enter OTP in 6 individual input boxes | ✅ Implemented |
| REQ-011 | System validates OTP against stored SHA-256 hash | ✅ Implemented |
| REQ-012 | Login succeeds if OTP is correct and within expiry | ✅ Implemented |
| REQ-013 | Error message shown for incorrect OTP (with remaining attempts count) | ✅ Implemented |
| REQ-014 | Input boxes clear and refocus after incorrect OTP | ✅ Implemented |
| REQ-015 | Error message shown for expired OTP | ✅ Implemented |
| REQ-016 | Input boxes disabled when OTP expires | ✅ Implemented |
| REQ-017 | Maximum 5 incorrect attempts allowed per session | ✅ Implemented |
| REQ-018 | All input boxes disabled after 5 wrong attempts (locked state) | ✅ Implemented |
| REQ-019 | Existing user is signed in after successful verification | ✅ Implemented |
| REQ-020 | New user is redirected to registration page after successful verification | ✅ Implemented |
| REQ-021 | Countdown timer displayed in real-time (updates every second) | ✅ Implemented |

---

### 2.3 OTP Resend

| ID | Requirement | Status |
|---|---|---|
| REQ-022 | Resend OTP button is disabled on initial page load | ✅ Implemented |
| REQ-023 | Resend becomes available after 60-second cooldown | ✅ Implemented |
| REQ-024 | Countdown timer shown to user for resend availability | ✅ Implemented |
| REQ-025 | Maximum 3 resend attempts allowed per session | ✅ Implemented |
| REQ-026 | 15-minute cooldown applied after 3 resends are exhausted | ✅ Implemented |
| REQ-027 | New OTP issued on resend invalidates the previous OTP | ✅ Implemented |
| REQ-028 | Verify attempt counter resets to 0 after each resend | ✅ Implemented |
| REQ-029 | Remaining resend count shown to user | ✅ Implemented |

---

### 2.4 New User Registration

| ID | Requirement | Status |
|---|---|---|
| REQ-030 | New users redirected to registration page after OTP verification | ✅ Implemented |
| REQ-031 | Registration token valid for 15 minutes | ✅ Implemented |
| REQ-032 | First name required | ✅ Implemented |
| REQ-033 | Last name required | ✅ Implemented |
| REQ-034 | Email OTP users must provide mobile number (required) | ✅ Implemented |
| REQ-035 | Mobile OTP users must provide email address (required) | ✅ Implemented |
| REQ-036 | Country code selector shown for mobile number input (48 countries) | ✅ Implemented |
| REQ-037 | Mobile number validated: digits only, 5–15 digits | ✅ Implemented |
| REQ-038 | Duplicate email accounts prevented | ✅ Implemented |
| REQ-039 | Duplicate phone number accounts prevented | ✅ Implemented |
| REQ-040 | If duplicate found, existing account is signed in (not rejected) | ✅ Implemented |
| REQ-041 | Account created with random secure password (OTP-based, no password login) | ✅ Implemented |

---

### 2.5 Admin Login

| ID | Requirement | Status |
|---|---|---|
| REQ-042 | Separate "Admin" tab on the login page | ✅ Implemented |
| REQ-043 | Admin logs in with email + password | ✅ Implemented |
| REQ-044 | Credentials validated via nopCommerce built-in auth | ✅ Implemented |
| REQ-045 | Only Administrator role users can log in via this tab | ✅ Implemented |
| REQ-046 | Non-admin accounts receive "Access denied" error | ✅ Implemented |
| REQ-047 | Successful admin login redirects to `/Admin/` | ✅ Implemented |
| REQ-048 | Specific error messages for: wrong password, account not found, locked, not active | ✅ Implemented |

---

### 2.6 Session Management

| ID | Requirement | Status |
|---|---|---|
| REQ-049 | Session/token generated after successful login (HTTP-only cookie) | ✅ Implemented |
| REQ-050 | Session stored as secure HTTP-only cookie | ✅ Implemented |
| REQ-051 | Session validity tracked on backend (ASP.NET Core auth middleware) | ✅ Implemented |
| REQ-052 | Session expires after 30 minutes of inactivity (sliding expiration) | ✅ Implemented |
| REQ-053 | Expired sessions rejected on protected routes | ✅ Implemented |
| REQ-054 | AJAX requests to protected endpoints receive `{ sessionExpired: true }` + HTTP 401 | ✅ Implemented |
| REQ-055 | Browser navigation to protected pages after session expiry redirects to `/otp/login` | ✅ Implemented |
| REQ-056 | Error message shown to user before redirect on session expiry | ✅ Implemented |

---

## 3. Test Cases by Feature Area

---

### TC-001 to TC-010: Email OTP Flow

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-001** Email OTP — Happy Path | 1. Go to `/otp/login` → Email tab<br>2. Enter valid email → Send OTP<br>3. Enter correct OTP | User signed in and redirected to `/` |
| **TC-002** Invalid Email | Enter `notanemail` → click Send OTP | Error: "Invalid email." |
| **TC-003** Empty Email | Click Send OTP with empty field | Button disabled / validation error |
| **TC-004** Wrong OTP (1st attempt) | Enter incorrect 6-digit code | Error: "Incorrect OTP. 4 attempt(s) remaining." Input boxes clear and refocus. |
| **TC-005** Wrong OTP (5th attempt) | Enter wrong code 5 times | Error: "Too many incorrect attempts. Please request a new OTP." All boxes disabled. |
| **TC-006** Expired OTP | Wait 5 minutes after requesting OTP, then enter code | Error: "OTP has expired. Please request a new one." Boxes disabled. |
| **TC-007** Correct OTP after 2 wrong | Enter wrong code twice, then correct | Sign in successful |
| **TC-008** OTP verified — new user | Enter email with no account → verify OTP | Redirected to `/otp/register-page` |
| **TC-009** OTP verified — existing user | Enter registered email → verify OTP | Signed in directly, no registration page |
| **TC-010** OTP in masked form | Request OTP to `kashish@gmail.com` | Destination shown as `k*****h@gmail.com` |

---

### TC-011 to TC-020: Mobile OTP Flow

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-011** Mobile OTP — Happy Path | Mobile tab → select `IN (+91)` → enter number → verify OTP | User signed in |
| **TC-012** Missing country code | Remove country code field → submit | Error: "Invalid mobile." |
| **TC-013** Missing mobile number | Submit with empty phone | Validation error shown |
| **TC-014** SMS delivery | Enter valid Twilio-registered number | SMS received on phone within 30 seconds |
| **TC-015** Demo mode | No Twilio config → request SMS OTP | OTP shown in `demoCode` field in response, no SMS sent |
| **TC-016** Masked mobile display | Request OTP to `+91 9876543210` | Verify page shows `+91 ******3210` |
| **TC-017** Wrong OTP — mobile | Enter wrong code | Same error behavior as email (TC-004/TC-005) |
| **TC-018** Phone OTP new user | Enter unregistered number → verify OTP | Redirected to registration page |
| **TC-019** Phone OTP existing user | Enter registered number → verify OTP | Signed in directly |
| **TC-020** Invalid phone digits | Enter letters in mobile field | Client-side validation blocks submit |

---

### TC-021 to TC-030: OTP Resend

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-021** Resend button disabled initially | Open verify page | Resend button disabled, countdown showing "60s" |
| **TC-022** Resend available after 60s | Wait 60 seconds | Resend button becomes active |
| **TC-023** Resend too soon | Click Resend before 60s | Error: "Please wait X seconds before requesting again." |
| **TC-024** Resend 1st time | After 60s, click Resend | New OTP sent, countdown resets to 60s, "1/3 resends used" |
| **TC-025** Old OTP invalid after resend | Request resend → use old code | Error: "Incorrect OTP" |
| **TC-026** Resend 3rd time (limit) | Use all 3 resends | Success with 3rd resend |
| **TC-027** Resend after limit (cooldown) | Click Resend after 3rd resend | Error: "Resend limit reached. Try again in 15 minutes." |
| **TC-028** Cooldown timer shown | After limit hit | Cooldown displayed to user |
| **TC-029** Verify attempt resets on resend | Enter 3 wrong → resend → enter wrong again | Attempt counter back at 4 remaining |
| **TC-030** Resend after cooldown expires | Wait 15 minutes after cooldown | Resend available again |

---

### TC-031 to TC-040: Registration Flow

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-031** New user — email OTP → registration | Verify OTP (new email) → fill name + phone → submit | Account created, signed in, redirect to `/` |
| **TC-032** Phone required for email OTP | Leave phone blank → submit | Error: "Mobile number is required." Submit blocked. |
| **TC-033** Invalid phone format | Enter `abc123` in phone | Error: "Enter a valid mobile number (digits only, 5–15 digits)." |
| **TC-034** Country code selector | Click dropdown | Shows `IN (+91)`, `US (+1)`, `GB (+44)` etc. format |
| **TC-035** Default country code | Open registration page (email OTP) | `IN (+91)` selected by default |
| **TC-036** New user — mobile OTP → registration | Verify OTP (new mobile) → fill name + email → submit | Account created, signed in |
| **TC-037** Email required for mobile OTP | Leave email blank → submit | Error: "Email address is required." |
| **TC-038** Duplicate email during registration | Register with email that already exists | Account found → signed in (not rejected). Message: "An account with this email already exists. Signed in." |
| **TC-039** Expired registration token | Wait 15+ minutes after OTP verify → submit form | Error: "Registration session expired. Please start over." |
| **TC-040** Invalid registration token | Manually tamper token in URL → submit | Error: "Registration session expired or invalid. Please start again." |

---

### TC-041 to TC-048: Admin Login

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-041** Admin login — happy path | Admin tab → correct admin email + password → submit | Redirected to `/Admin/` |
| **TC-042** Wrong password | Admin tab → correct email + wrong password | Error: "Incorrect password." |
| **TC-043** Non-existent email | Admin tab → unknown email → submit | Error: "No account found with this email." |
| **TC-044** Non-admin account | Enter email + password of regular customer | Error: "Access denied. This login is for administrators only." |
| **TC-045** Locked account | Admin account locked in nopCommerce | Error: "This account is locked. Please try later." |
| **TC-046** Inactive account | Admin account set to inactive | Error: "This account is not active." |
| **TC-047** Empty fields | Submit empty admin form | Error: "Email and password are required." |
| **TC-048** Admin session | After admin login, navigate to `/Admin/Home` | Admin panel loads, admin is authenticated |

---

### TC-049 to TC-056: Session Management

| Test Case | Steps | Expected Result |
|---|---|---|
| **TC-049** Session created on login | Login via OTP → check browser cookies | `.AspNetCore.Cookies` cookie present, `HttpOnly`, `Secure` flags set |
| **TC-050** Session active | Login → navigate around site | Session maintained, no redirect |
| **TC-051** Session slides on activity | Login → wait 25 min → make request → wait 25 min | Session still active (sliding reset) |
| **TC-052** Session expires on inactivity | Login → wait 30+ minutes with no activity | Next page load redirects to `/otp/login` |
| **TC-053** AJAX after session expiry | Login → wait 30+ min → trigger AJAX call to protected route | Response: HTTP 401 `{ "sessionExpired": true }` |
| **TC-054** UI message on expiry | Trigger session expiry on OTP verify/register page | Error message: "Your session has expired. Redirecting to login..." then redirect |
| **TC-055** Protected page after expiry | Visit `/` or any page after logout/expiry | Redirected to `/otp/login` |
| **TC-056** Cookie not readable by JS | Inspect cookies in browser DevTools | `.AspNetCore.Cookies` marked `HttpOnly` — not visible to `document.cookie` |

---

## 4. System Limits & Constraints

| Constraint | Value | What happens when exceeded |
|---|---|---|
| OTP expiry | 5 minutes | `{ expired: true }`, boxes disabled |
| Max wrong OTP entries | 5 per session | Session locked, must request new OTP |
| Resend gap | 60 seconds | Error with seconds remaining |
| Max resends | 3 per session | 15-minute cooldown applied |
| Resend cooldown | 15 minutes | Error with wait time shown |
| Registration token expiry | 15 minutes | Error, user must start over |
| Session inactivity | 30 minutes | Redirect to `/otp/login` |

---

## 5. Test Environment Setup

**Application URL:** `https://localhost:5001`  
**Database:** SQL Server Express — `nopCommerce_test1`  
**Email:** Gmail SMTP (port 465, App Password configured)  
**SMS:** Twilio (Account SID + Auth Token + From Number configured in `appsettings.json`)

**Starting the server:**
```
cd src\Presentation\Nop.Web
dotnet run --no-build --no-launch-profile --urls "http://localhost:5000;https://localhost:5001"
```

**Tools needed:**
- Browser (Chrome/Edge recommended)
- Browser DevTools (F12) for cookie/network inspection
- A real email inbox to test email delivery
- A real mobile number (Twilio-registered for trial accounts) to test SMS

**Test accounts:**
- Admin: `admin@yourstore.com` / `Admin@123` (or as configured in nopCommerce admin)
- Regular customer: create fresh via OTP registration flow

---

## 6. How to Test Each Scenario Step-by-Step

### How to test Email OTP (TC-001)
1. Open `https://localhost:5001/otp/login`
2. Click **Email OTP** tab
3. Enter a registered email → click **Send OTP**
4. Check your inbox — you should receive a 6-digit code within 30 seconds
5. Enter the code in the 6 boxes
6. Verify you are redirected to `/` and signed in

### How to test Resend limit + 15-min cooldown (TC-027)
1. Request OTP → go to verify page
2. Wait 60s → click **Resend** (1st)
3. Wait 60s → click **Resend** (2nd)
4. Wait 60s → click **Resend** (3rd)
5. Immediately click **Resend** again
6. Expected: Error "Resend limit reached. Try again in 15 minutes." Cooldown timer displayed.

### How to test max verify attempts (TC-005)
1. Request OTP → go to verify page
2. Enter `000000` (wrong) 5 times
3. After 5th attempt, all boxes disable
4. Expected: Error "Too many incorrect attempts. Please request a new OTP."

### How to test new user registration (TC-031)
1. Delete test account from DB (or use a fresh email never registered)
2. Go to `/otp/login` → Email tab → enter fresh email → Send OTP
3. Verify OTP → should be redirected to `/otp/register-page`
4. Fill in first name, last name, select country code, enter phone number
5. Click **Create account & continue**
6. Expected: Signed in, redirected to `/`

### How to test session expiry (TC-052)
1. Login via OTP
2. Do NOT interact with the site for 30+ minutes
3. After 30 minutes, click any link or navigate
4. Expected: Redirected to `/otp/login`

### How to test admin login (TC-041)
1. Go to `/otp/login` → **Admin** tab
2. Enter admin email + password
3. Click **Login as Admin**
4. Expected: Redirected to `/Admin/`

### How to test country code dropdown (TC-034)
1. Go to `/otp/login` → Mobile tab
2. Click the country code dropdown
3. Expected: Dropdown shows `IN (+91)`, `US (+1)`, `GB (+44)` etc.
4. Select a different country → verify code updates in the field
