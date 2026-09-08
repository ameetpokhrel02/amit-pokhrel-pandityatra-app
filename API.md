# PanditYatra API Reference (Mobile Apps)

This document covers everything a mobile app (Customer, Pandit, or Vendor) needs to integrate with the PanditYatra backend. It reflects the actual current implementation, verified against the running backend.

## Base URL
  
```
https://<your-domain>/api/v1/
```

Use the **versioned `/api/v1/` prefix** for everything. Two other prefixes exist and both still work, but are not for new clients:
- `/api/*` (no version) — legacy, kept only for backward compatibility with old clients. Every response from it includes deprecation headers (see below). Do not build new integrations against it.
- `/api/v2/*` — reserved for future breaking changes. Currently mirrors v1 exactly. Nothing to do here yet.

If you ever call the legacy `/api/*` prefix, expect these response headers:
```
Deprecation: true
Sunset: 2027-01-01
Warning: 299 - "This API endpoint is deprecated. Please use the versioned endpoint."
X-Api-Deprecated: true
X-Api-Successor: /api/v2/<same-path>
X-Api-Version: v1
```

All request/response bodies are JSON unless explicitly noted (a couple of endpoints stream plain text — called out where relevant).

---

## Authentication

JWT-based, with a security detail that matters a lot for a mobile client: **the refresh token is never returned in a JSON field.** It's set by the server as an **httpOnly, Secure, SameSite=Lax cookie**. This is deliberate (it's how the web app's XSS protection works) and it still works correctly for a native app — but your HTTP client must be configured to **persist and resend cookies** (a "cookie jar"), the same way a browser does:

- **iOS (URLSession):** works out of the box — `URLSession.shared` uses `HTTPCookieStorage.shared` automatically. If you're using a custom `URLSessionConfiguration`, make sure `httpCookieStorage` is set and `httpShouldSetCookies = true`.
- **Android (OkHttp):** you must explicitly attach a `CookieJar` (e.g. `JavaNetCookieJar` backed by a `CookieManager`) to your `OkHttpClient` — it does **not** persist cookies by default.
- **Flutter (dio / http):** use a cookie-jar-aware package (e.g. `dio_cookie_manager` + `cookie_jar`) or you'll silently lose the refresh token between requests.

If your client can't do cookies at all, sessions will still work for the lifetime of the access token (15 minutes) but silent refresh (and therefore "stay logged in") will not work.

### Login flow

1. Call one of the login endpoints below (OTP or password). On success you get back:
   ```json
   { "access": "<jwt>", "user": { ... }, "role": "user" }
   ```
   plus the refresh-token cookie is set automatically by the response — your HTTP client handles this, you never read or store it yourself.
2. Store `access` in memory (not persistent storage — it's short-lived by design, 15 minutes).
3. Send it on every authenticated request: `Authorization: Bearer <access>`.
4. When a request 401s, or on app cold-start, call `POST /api/v1/token/refresh/` with **no body** — the httpOnly cookie is sent automatically by your HTTP client, and you get back a fresh `{ "access": "<jwt>" }`. If this also 401s (`{"detail": "Refresh token cookie missing."}` or the refresh token has expired/been revoked), the user needs to log in again.
5. If a login response instead contains `{"requires_2fa": true, "pre_auth_id": "..."}`, the account has 2FA enabled — see the 2FA section for how to complete login.

### Logout

```
POST /api/v1/logout/
```
No auth header required (uses the cookie). Blacklists the refresh token server-side and clears the cookie. Always call this on explicit user logout — just discarding your in-memory access token client-side is not enough, the refresh token would still be valid.

### Registration

Self-serve registration only ever creates `role: "user"`, `"pandit"`, or `"vendor"` — `admin`/`superadmin` accounts can never be created this way, only by an existing admin.

### Rate limiting

DRF throttling is active globally: `100/minute` for anonymous requests, `10000/day` for authenticated users, plus tighter scoped limits on specific endpoints (`register`: 5/minute, `otp_request`: 10/minute, `login_attempt`: 20/minute, `ai_endpoint`: 30/hour — noted per-endpoint below where relevant). A `429 Too Many Requests` means back off and retry later; don't hammer-retry.

### Admin 2FA (only relevant if you're building an admin app)

Admin/superadmin/audit-role accounts additionally require TOTP 2FA. This is enforced for **every** request from those roles, regardless of endpoint — a valid access token from an unverified 2FA session will get `403 {"detail": "Two-factor authentication required for administrative access.", "code": "2fa_required"}` on anything. See the Admin Auth section for the login/setup/verify flow.

---

## Errors

Standard DRF error shape. Validation errors are field-keyed:
```json
{ "email": ["A user with this email already exists."] }
```
Other errors use a `detail` or `error` key:
```json
{ "detail": "Not found." }
```
Common status codes: `400` validation, `401` missing/invalid/expired token, `403` forbidden (wrong role, or 2FA required), `404` not found or not yours, `429` rate limited.

---

## WebSockets

WebSocket endpoints are **not** under `/api/` — they're mounted directly on the same host, e.g. `wss://<your-domain>/ws/chat/<room_id>/`. Browsers and mobile HTTP clients can't attach custom headers to a WebSocket handshake, so authentication works differently there: mint a short-lived, single-use ticket first via a normal authenticated REST call, then pass it as a query param when opening the socket.

```
POST /api/v1/ws-ticket/
Authorization: Bearer <access>
```
```json
{ "ticket": "<opaque-string>" }
```
The ticket is valid for ~30 seconds and can only be used once. Connect immediately:
```
wss://<your-domain>/ws/chat/<room_id>/?ticket=<ticket>
```
Mint a fresh ticket every time you (re)connect — don't cache/reuse one, and don't reconnect using the same ticket after a drop.

---

## Authentication Flow

All auth endpoints live under `/api/v1/users/` unless noted. JWT access tokens are short-lived (15 min) and returned in the JSON body as `access` — store this in memory, not persistent storage. The **refresh token is never returned in the JSON body**; the backend sets it as an `httpOnly`, `Secure`, `SameSite=Lax` cookie named `refresh_token` automatically on every successful login/OAuth/2FA response.

> **Mobile client requirement:** your HTTP client must support a cookie jar (persist `Set-Cookie` and resend it automatically) — iOS `URLSession` and Android `OkHttp` with a `CookieJar`/`CookieManager` both do this out of the box, but it must be explicitly enabled. There is no `refresh` field to store yourself. If your client discards cookies, silent refresh will never work and users will be logged out on every app restart.

### POST /api/v1/users/register/
**Auth:** None
**Rate limit:** `register` scope
**Description:** Create a new account. Always sends an email OTP for verification — the account cannot log in until verified.

**Request body:**
```json
{
  "email": "string, required",
  "phone_number": "string, optional",
  "full_name": "string, optional",
  "password": "string, optional — min 8 chars, upper+lower+digit+special; a random one is generated if omitted",
  "role": "'user' | 'pandit' | 'vendor', default 'user' — admin/superadmin can NEVER be self-assigned here",
  "expertise": "string, optional — pandit role only",
  "experience_years": "int, optional — pandit role only",
  "shop_name": "string, optional — vendor role only",
  "business_type": "string, optional — vendor role only, default 'Ritual Samagri'",
  "address": "string, optional — vendor role only",
  "city": "string, optional — vendor role only"
}
```

**Response 201:**
```json
{ "detail": "string", "requires_verification": true, "email": "string" }
```
If email sending fails: `{ "detail": "string", "user_id": int, "email": "string" }` (account still created).

**Errors:** 400 (validation — duplicate email/phone, weak password, invalid role choice)

---

### POST /api/v1/users/request-otp/
**Auth:** None
**Rate limit:** `otp_request` scope
**Description:** Request a login OTP for an existing user, by phone or email.

**Request body:**
```json
{ "phone_number": "string, one of phone_number/email required", "email": "string" }
```

**Response 200:** `{ "detail": "OTP sent to your phone number." }` (or "...email address.")
**Errors:** 400 (neither provided), 403 (OTP send blocked/rate-limited), 404 (user not found)

---

### POST /api/v1/users/login-otp/
**Auth:** None
**Rate limit:** `login_attempt` scope
**Description:** Verify a login OTP and receive JWT tokens (or a 2FA challenge if enabled).

**Request body:**
```json
{ "phone_number": "string", "email": "string", "otp_code": "string, 6 digits, required" }
```
(Provide phone_number OR email — an email typed into `phone_number` is auto-detected.)

**Response 200 (no 2FA):**
```json
{ "access": "JWT string", "user": { "...see UserSerializer below" }, "role": "string" }
```
Sets `refresh_token` cookie.

**Response 200 (2FA enabled):**
```json
{ "requires_2fa": true, "pre_auth_id": "string — pass to /users/auth/2fa/verify/", "detail": "string" }
```

**Errors:** 400 (missing/invalid OTP), 404 (user not found)

---

### POST /api/v1/users/login-password/
**Auth:** None
**Rate limit:** `login_attempt` scope
**Description:** Login with password. Accepts phone_number, email, OR username as identifier.

**Request body:**
```json
{ "phone_number": "string", "email": "string", "username": "string", "password": "string, required" }
```
(At least one of phone_number/email/username required.)

**Response 200 (no 2FA):** same shape as login-otp above, sets `refresh_token` cookie.
**Response 200 (2FA enabled):** same `requires_2fa`/`pre_auth_id` shape as above.
**Response 403 (email unverified):** `{ "detail": "string", "requires_verification": true, "email": "string" }` — a fresh OTP is auto-sent.
**Errors:** 400 (validation), 401 (wrong password), 404 (user not found)

---

### POST /api/v1/users/auth/2fa/verify/
**Auth:** None (requires valid `pre_auth_id` from a login response above)
**Description:** Step 2 of login when 2FA is enabled — verify the 6-digit TOTP code and receive tokens. Works for any role.

**Request body:**
```json
{ "token": "string, 6-digit TOTP code", "pre_auth_id": "string, from the login response" }
```

**Response 200:**
```json
{ "access": "JWT string", "user_id": int, "full_name": "string", "role": "string" }
```
Sets `refresh_token` cookie (fixed to match the rest of the auth system — this endpoint used to return `refresh` directly in the body, that's no longer the case).
**Errors:** 400 (missing fields), 401 (session expired / invalid code), 404 (user not found)

---

### GET /api/v1/users/auth/2fa/status/
**Auth:** Bearer token required
**Description:** Check whether the current user has 2FA enabled.
**Response 200:** `{ "has_2fa": true|false }`

### GET /api/v1/users/auth/2fa/setup/
**Auth:** Bearer token required
**Description:** Generate a new TOTP secret + branded QR code for enabling 2FA.
**Response 200:** `{ "qr_code": "data:image/png;base64,...", "secret": "string", "otp_uri": "string" }`

### POST /api/v1/users/auth/2fa/setup/
**Auth:** Bearer token required
**Description:** Confirm 2FA setup with the first generated code.
**Request body:** `{ "token": "string, 6 digits" }`
**Response 200:** `{ "detail": "2FA successfully enabled." }`
**Errors:** 400 (invalid code)

### DELETE /api/v1/users/auth/2fa/setup/
**Auth:** Bearer token required
**Description:** Disable 2FA (requires a currently-valid code, for safety).
**Request body:** `{ "token": "string, 6 digits" }`
**Response 200:** `{ "detail": "2FA has been disabled." }`
**Errors:** 400 (not enabled, or invalid code)

---

## Password Reset

### POST /api/v1/users/forgot-password/
**Auth:** None
**Description:** Request a password-reset OTP.
**Request body:** `{ "phone_number": "string", "email": "string" }` (one required)
**Response 200:** `{ "detail": "OTP sent to your ... " }`
**Errors:** 400, 403, 404

### POST /api/v1/users/forgot-password/verify-otp/
**Auth:** None
**Description:** Verify the reset OTP (does not consume it — needed again by the reset step).
**Request body:** `{ "phone_number": "string", "email": "string", "otp_code": "string, 6 digits" }`
**Response 200:** `{ "detail": "OTP verified successfully. You can now reset your password." }`
**Errors:** 400, 404

### POST /api/v1/users/forgot-password/reset/
**Auth:** None
**Description:** Set a new password after OTP verification.
**Request body:** `{ "phone_number": "string", "email": "string", "otp_code": "string, 6 digits", "new_password": "string — same strength rules as registration" }`
**Response 200:** `{ "detail": "Password reset successfully." }`
**Errors:** 400 (bad OTP or weak password), 404

---

## OAuth (Google / Facebook)

> Two separate Google login implementations exist — prefer the first.

### POST /api/v1/users/google-login/  (recommended)
**Auth:** None
**Description:** Google Sign-In. Validates the token's `aud` claim against the server's configured client ID. Supports role selection on first signup.
**Request body:** `{ "id_token": "string, required — Google ID token", "role": "'user'|'vendor'|'pandit', optional, default 'user'" }`
**Response 200:** `{ "access": "JWT", "token": "JWT (duplicate of access)", "role": "string", "user": { "...UserSerializer" } }`, sets `refresh_token` cookie.
**Errors:** 400 (missing/invalid token, wrong audience, no email), 500

### POST /api/v1/auth/google/  (alternate — always creates role='user', no role param)
**Auth:** None
**Description:** A second, independent Google login using Google's official verification library. Ignores role selection entirely.
**Request body:** `{ "token": "string, required — Google ID token" }`
**Response 200:** `{ "access": "JWT", "user": { "id", "email", "full_name", "role", "phone_number" } }`, sets `refresh_token` cookie.
**Errors:** 400 (invalid token, no email)

### POST /api/v1/users/facebook-login/  *(same view also mounted at `/api/v1/auth/facebook/`)*
**Auth:** None
**Description:** Facebook Login via Graph API. Supports role selection.
**Request body:** `{ "access_token": "string (or token)", "role": "'user'|'vendor'|'pandit', optional" }`
**Response 200:** `{ "access": "JWT", "token": "JWT", "role": "string", "user": { "...UserSerializer" } }`, sets `refresh_token` cookie.
**Errors:** 400 (invalid token), 500

---

## Session

### POST /api/v1/token/refresh/
**Auth:** None (relies on the `refresh_token` cookie — cookie jar required)
**Description:** Exchange the httpOnly refresh cookie for a new access token. Refresh token rotates; the new one is set as a fresh cookie, never in the body.
**Request body:** none
**Response 200:** `{ "access": "JWT string" }`
**Errors:** 401 (`{"detail": "Refresh token cookie missing."}` or invalid/expired/blacklisted token)

### POST /api/v1/logout/
**Auth:** None (reads the cookie if present)
**Description:** Blacklists the refresh token server-side and clears the cookie.
**Response 200:** `{ "detail": "Logged out." }` (always 200, even with no active session)

### POST /api/v1/ws-ticket/
**Auth:** Bearer token required
**Description:** Mints a single-use, 30-second ticket for authenticating a WebSocket handshake (native WS clients can't send an `Authorization` header on the upgrade request). Call this immediately before opening any `ws://…` connection and append `?ticket=<ticket>` to the URL instead of a raw token.
**Response 200:** `{ "ticket": "string" }`

---

## Profile

### GET /api/v1/users/profile/
**Auth:** Bearer token required
**Description:** Get the current user's full profile.
**Response 200 (UserSerializer):**
```json
{
  "id": int, "phone_number": "string|null", "full_name": "string|null", "email": "string",
  "profile_pic": "url|null", "role": "string", "is_active": bool, "is_superuser": bool,
  "is_staff": bool, "date_joined": "ISO datetime",
  "pandit_profile": { "id", "expertise", "language", "experience_years", "bio", "rating", "is_available", "is_verified", "verification_status" } | null,
  "vendor_profile": { "id", "shop_name", "business_type", "is_verified", "verification_status", "balance" } | null,
  "is_onboarding_complete": bool
}
```

### PATCH /api/v1/users/profile/
**Auth:** Bearer token required
**Description:** Update profile fields. For pandit/vendor roles, also accepts role-specific onboarding fields which auto-complete onboarding once submitted.
**Request body (any subset):** standard fields (`full_name`, `phone_number`, `profile_pic`, ...) plus, if `role == 'pandit'`: `expertise`, `language`, `experience_years`, `bio`; if `role == 'vendor'`: `shop_name`, `business_type`, `address`, `city`, `bank_account_number`, `bank_name`, `account_holder_name`, `bio`, `phone_number`.
**Response 200:** updated UserSerializer payload.

### POST /api/v1/users/contact/
**Auth:** None
**Description:** Submit the public contact form. Notifies all admins.
**Request body:** `{ "name": "string", "email": "string", "subject": "string", "message": "string" }`
**Response 201:** `{ "detail": "Thank you for reaching out! We will get back to you soon." }`
**Errors:** 400

### GET /api/v1/users/platform-stats/
**Auth:** None
**Description:** Public, non-sensitive aggregate stats for a landing page (not admin dashboard data).
**Response 200:** `{ "verified_pandits": int, "families_served": int, "total_pujas_completed": int, "total_kundalis_generated": int, "total_reviews": int, "average_rating": float }`

---

## Public Site Content

### GET /api/v1/users/site-content/
**Auth:** None
**Description:** Flat key→value map of admin-editable CMS text blocks (hero title, footer text, contact info, announcement, etc.).
**Response 200:** `{ "hero_title": "string", "footer_text": "string", "...": "..." }` — only keys with content set are present.

### GET /api/v1/users/faqs/
**Auth:** None (published only) — admins see all, including unpublished
**Response 200:** `[ { "id", "question", "answer", "category", "order", "is_published", "created_at", "updated_at" }, ... ]`

### GET /api/v1/users/faqs/{id}/
Same shape, single object. **Errors:** 404

### GET /api/v1/users/social-links/
**Auth:** None (active only) — admins see all
**Response 200:** `[ { "id", "platform", "platform_label", "url", "label", "is_active", "order", "created_at", "updated_at" }, ... ]`
`platform` is one of: `facebook, instagram, twitter, linkedin, youtube, tiktok, whatsapp, telegram, github, other`.

### GET /api/v1/users/legal-pages/
**Auth:** None
**Description:** Both legal pages (Terms & Conditions, Privacy Policy). Auto-created empty on first access.
**Response 200:** `[ { "id", "page_type": "privacy"|"terms", "page_type_label", "title", "content": "sanitized HTML", "last_updated", "updated_by": int|null, "updated_by_name": "string|null" }, ... ]`

### GET /api/v1/users/legal-pages/{page_type}/
Single page by `privacy` or `terms`. Same shape as above. **Errors:** 404 (invalid page_type)

### POST /api/v1/users/newsletter/
**Auth:** None
**Description:** Subscribe an email to the newsletter. Idempotent — resubscribes if previously unsubscribed.
**Request body:** `{ "email": "string, required" }`
**Response 201 (new) / 200 (already existed):** `{ "id", "email", "is_active", "source", "subscribed_at", "unsubscribed_at" }`
**Errors:** 400 (missing email)

### POST /api/v1/users/newsletter/unsubscribe/
**Auth:** None
**Request body:** `{ "email": "string, required" }`
**Response 200:** `{ "detail": "Unsubscribed." }`
**Errors:** 400, 404 (no active subscription for that email)

---

## Admin: User Management
*(all require Admin only unless noted; Bearer token required for all)*

### GET /api/v1/users/admin/users/
List all `role='user'` accounts. **Response 200:** `[UserSerializer, ...]`

### POST /api/v1/users/admin/users/{user_id}/toggle-status/
Block/unblock a user. **Response 200:** `{ "message": "string" }`. **Errors:** 404

### DELETE /api/v1/users/admin/users/{user_id}/
Permanently delete a user. **Response 204**. **Errors:** 404, 500

### POST /api/v1/users/admin/users/create/
Create any account type (customer/pandit/vendor/admin/superadmin). Creating admin/superadmin requires **Superadmin only**.
**Request body:** email, password, role, full_name + role-specific fields (see AdminUserCreateSerializer: expertise, experience_years, bio, shop_name, business_type, address, city, bank_account_number, bank_name, account_holder_name).
**Response 201:** `{ "message": "string", "user": { "id", "email", "full_name", "role" } }`
**Errors:** 400, 403

### GET/POST /api/v1/users/admin/settings/
Get or partially update platform settings (singleton).
**Response 200 / POST body (partial):** `{ "commission_rate": "decimal string, e.g. '10.00'", "video_call_rate_per_min": "decimal string", "ai_daily_quota_per_user": int }`
**Errors:** 400 (POST validation)

### POST /api/v1/users/admin/change-password/
Change the current admin's own password.
**Request body:** `{ "current_password": "string", "new_password": "string, min 6 chars" }`
**Response 200:** `{ "message": "Password changed successfully" }`
**Errors:** 400 (wrong current password, too short)

### GET /api/v1/users/admin/stats/
Full admin dashboard stats (revenue, growth %, pending verifications, low stock, error log count, etc). See `AdminStatsView` for the ~15-field response shape.

### GET/POST /api/v1/users/admin/site-content/
GET: all CMS entries + available/existing keys. POST not supported — use **PUT**.
**PUT body:** `{ "items": [ { "key": "string", "value": "string" }, ... ] }`
**Response 200 (GET):** `{ "contents": [SiteContentSerializer, ...], "available_keys": [{"key","label"}, ...], "existing_keys": ["string", ...] }`
**Response 200 (PUT):** `{ "message": "string", "updated": ["key", ...] }`

### Admin write access to FAQ / Social Links / Legal Pages / Newsletter
Same base URLs as the public GETs above, **Admin only** for non-safe methods:
- `POST/PATCH/PUT/DELETE /api/v1/users/faqs/{id}/`
- `POST/PATCH/PUT/DELETE /api/v1/users/social-links/{id}/`
- `PATCH/PUT /api/v1/users/legal-pages/{page_type}/` (no create/delete — only 2 rows ever exist). Request body: `{ "content": "HTML string" }` — sanitized server-side (bleach) on save; only `p, br, strong, em, u, s, h1-h4, ul, ol, li, a, blockquote, span` tags survive.
- `GET /api/v1/users/newsletter/` (list all subscribers) / `DELETE /api/v1/users/newsletter/{id}/` (remove one)

---

## Admin: Superadmin-only — Manage Admins

### GET /api/v1/users/admin/admins/
List all admin/superadmin accounts. **Superadmin only.**

### POST /api/v1/users/admin/admins/create/
Create a new admin/superadmin account directly.
**Request body:** `{ "email", "full_name", "phone_number", "password", "role": "'admin'|'superadmin'" }`
**Response 201:** `{ "id", "full_name", "email", "phone_number", "role", "is_active", "date_joined" }`

### PATCH /api/v1/users/admin/admins/{user_id}/
**Request body:** `{ "action": "'toggle_status'|'change_role'", "role": "required if change_role" }`
Cannot demote/deactivate/change your own account via this endpoint.
**Response 200:** `{ "message": "string" }`. **Errors:** 400, 404

### DELETE /api/v1/users/admin/admins/{user_id}/
Cannot delete yourself. **Response 204**. **Errors:** 400, 404

---

## Admin 2FA Login (separate portal — `admin_auth` app)

This is a distinct login flow used by the hidden admin portal, separate from the standard login endpoints above.

### POST /api/v1/admin-auth/login/
**Auth:** None
**Description:** Step 1 — validates identifier+password and role (`admin`/`superadmin`/`audit` only).
**Request body:** `{ "identifier": "username or email", "password": "string" }`
**Response 200 (no TOTP device yet):** `{ "requires_setup": true, "pre_auth_id": "string", "detail": "string" }`
**Response 200 (TOTP already configured):** `{ "requires_2fa": true, "pre_auth_id": "string", "detail": "string" }`
**Errors:** 401 (invalid credentials, wrong role, inactive account)

### POST /api/v1/admin-auth/verify-totp/
**Description:** Step 2 — verify the 6-digit code, receive tokens.
**Request body:** `{ "token": "string, 6 digits", "pre_auth_id": "string" }`
**Response 200:** `{ "access": "JWT", "user_id": int, "full_name": "string", "role": "string" }`, sets `refresh_token` cookie (with an internal `2fa_verified` claim required to pass admin-route middleware).
**Errors:** 401 (session expired, invalid code), 404

### POST /api/v1/admin-auth/setup-totp/
**Description:** Generate QR code for first-time 2FA setup.
**Request body:** `{ "pre_auth_id": "string" }`
**Response 200:** `{ "qr_code": "data:image/png;base64,...", "secret": "string", "otp_uri": "string" }`
**Errors:** 401 (session expired)

### PATCH /api/v1/admin-auth/setup-totp/
**Description:** Confirm setup with the first code — completes login.
**Request body:** `{ "pre_auth_id": "string", "token": "string, 6 digits" }`
**Response 200:** `{ "access": "JWT", "role": "string", "detail": "2FA successfully enabled." }`, sets `refresh_token` cookie.
**Errors:** 400 (invalid code), 401 (session expired)
</content>
## Pandits, Bookings, Vendors, Samagri Shop, Payments & Delivery

> There is no single `marketplace` Django app in this backend. The functionality is split across the `pandits`, `bookings`, `vendors`, `samagri`, and `payments` apps, all mounted directly under the `/api/v1/` prefix. Legacy unversioned aliases exist at `/api/<app>/...` and simply resolve to the same views — new mobile clients should use `/api/v1/...` exclusively.

---

## Pandits

### GET /api/v1/pandits/services/catalog/
**Auth:** None
**Description:** Public catalog of all active Puja services (used to populate booking/service pickers).
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Satyanarayan Puja",
    "category": 2,
    "category_details": { "id": 2, "name": "Home Pujas", "slug": "home-pujas", "description": "...", "image": "...", "icon": "home", "order": 1 },
    "description": "string",
    "base_duration_minutes": 90,
    "base_price": "2500.00",
    "base_price_usd": "19.00",
    "is_available": true,
    "image": "https://.../puja_images/x.jpg"
  }
]
```
> `base_price_usd` is computed on the fly from `base_price` via the live NPR→USD exchange rate if not explicitly set in the DB.

### POST /api/v1/pandits/register/
**Auth:** None (anonymous signup only — see note)
**Description:** Register a new Pandit account. Creates a `PanditUser` with `verification_status=PENDING`.
**Request body** (multipart/form-data, for `certification_file`):
```json
{
  "phone_number": "string (optional)",
  "full_name": "string (optional)",
  "password": "string, min 6 chars (required if anonymous)",
  "expertise": "string, required",
  "language": "string, required",
  "experience_years": "int 0-100, required",
  "bio": "string, optional, max 500",
  "certification_file": "file, required",
  "email": "string, optional"
}
```
**Response:** `201 Created` — created Pandit record.
**Errors:** `400` — email/phone already registered, missing password for anonymous signup, or validation errors.
> If called by an already-authenticated non-pandit user, registration fails with `400` — this serializer does not support "promoting" an existing account to Pandit.

### GET /api/v1/pandits/
**Auth:** None
**Description:** Public directory listing of all Pandits, ordered by `-rating`.
**Query params:** `service_id` (int, optional) — filter to pandits offering a given Puja.
**Response:** `200 OK` — paginated list of:
```json
{
  "id": 5,
  "user_details": { "id": 5, "full_name": "string", "email": "string", "phone_number": "string", "profile_pic": "url|null" },
  "expertise": "string",
  "experience_years": 10,
  "language": "string",
  "bio": "string",
  "rating": "4.50",
  "is_available": true,
  "is_verified": true,
  "verification_status": "APPROVED",
  "certification_file": "url|null",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

### GET /api/v1/pandits/{id}/
**Auth:** None
**Description:** Pandit detail.
**Response:** `200 OK` — base pandit fields plus:
```json
{
  "services": [ { "id": 1, "pandit": 5, "puja_id": 1, "puja_details": {"...": "Puja shape"}, "custom_price": "2000.00", "duration_minutes": 90, "is_active": true, "is_online": false, "is_offline": true } ],
  "average_rating": "4.50",
  "review_count": 12,
  "total_reviews": 12,
  "reviews": [ "... Review objects, see Reviews section ..." ]
}
```
**Errors:** `404` — pandit not found.

### GET /api/v1/pandits/{id}/profile/
**Auth:** None
**Description:** Same as `GET /api/v1/pandits/{id}/` but also logs a `VIEW_PROFILE` admin-activity event. Prefer this action for profile-page views on mobile.

### PATCH/PUT /api/v1/pandits/{id}/
**Auth:** Bearer token required (must be the pandit themself or an admin)
**Description:** Update a pandit's profile. Supports nested `user_data.<field>` keys (e.g. `user_data.full_name`, `user_data.profile_pic`) to update the underlying `User` record in the same call.
**Request body:** any subset of `expertise`, `language`, `experience_years`, `bio`, `is_available`, `certification_file`, plus optional `user_data.*` fields.
**Errors:** `403` — not the owner and not an admin; `400` — invalid `user_data` payload.

### DELETE /api/v1/pandits/{id}/
**Auth:** Bearer token required (self or admin)
**Description:** Delete a pandit profile. If the caller is the pandit themself, their `role` is reset to `user` afterward instead of deleting the underlying `User`.
**Errors:** `403` — not the owner and not an admin.

### GET /api/v1/pandits/public-stats/
**Auth:** None
**Description:** Aggregate stats for a public "About Us" page.
**Response:** `200 OK`
```json
{ "verified_pandits": 512, "total_reviews": 10042, "happy_customers": 2530, "last_updated": "2026-08-31T12:00:00Z" }
```

### GET/POST /api/v1/pandits/my-services/
**Auth:** Bearer token required (pandit role)
**Description:** List or create the logged-in pandit's own `PanditService` offerings.
**Request body (POST):**
```json
{ "puja_id": 1, "custom_price": "2500.00", "duration_minutes": 90, "is_active": true, "is_online": false, "is_offline": true }
```
**Errors:** `400` — pandit already offers this puja, or user is not a `PanditUser`.

### PUT/PATCH/DELETE /api/v1/pandits/my-services/{id}/
**Auth:** Bearer token required (owning pandit only)

### GET /api/v1/pandits/dashboard/stats/
**Auth:** Bearer token required (pandit role)
**Description:** Pandit-app home dashboard: today's bookings, pending requests, earnings snapshot, next puja, today's schedule, upcoming queue, unread message count.
**Response:** `200 OK`
```json
{
  "stats": {
    "todays_bookings": 3, "pending_requests": 1, "todays_earnings": "0.00",
    "available_balance": "1200.00", "total_earned": "5400.00",
    "week_earnings": "800.00", "month_earnings": "3200.00",
    "unread_messages": 2, "is_online": true, "is_verified": true, "verification_status": "APPROVED"
  },
  "next_puja": { "id": 10, "customerName": "string", "pujaName": "string", "date": "2026-09-01", "time": "10:00:00", "location": "ONLINE", "status": "ACCEPTED", "videoLink": "url|null", "payment_status": true, "payment_method": "KHALTI", "transaction_id": "string" },
  "schedule": [ { "id": 10, "title": "string", "time": "10:00:00", "customer": "string", "status": "ACCEPTED", "video_link": "url|null", "payment_status": true, "payment_method": "KHALTI", "transaction_id": "string" } ],
  "queue": [ { "id": 11, "customer": "string", "service": "string", "date": "2026-09-02", "time": "09:00:00", "status": "PENDING", "payment_status": false, "payment_method": null, "transaction_id": null } ]
}
```
> If the authenticated user has `role='pandit'` but no `PanditUser`/`PanditWallet` row yet, this endpoint auto-creates minimal ones on first call.

### GET /api/v1/pandits/dashboard/earnings-history/
**Auth:** Bearer token required (pandit role)
**Description:** Daily completed-booking earnings for the last 30 days (gap-filled with zeros).
**Response:** `200 OK` — `[ { "date": "2026-08-01", "amount": 0.0 }, ... ]`

### POST /api/v1/pandits/dashboard/toggle-availability/
**Auth:** Bearer token required (pandit role)
**Description:** Flip the pandit's `is_available` (online/offline) flag.
**Response:** `200 OK` — `{ "is_available": true }`

### GET /api/v1/pandits/me/calendar/
**Auth:** Bearer token required (pandit role)
**Description:** Calendar feed combining bookings (color-coded by status) and manual unavailability blocks, in a FullCalendar-style event shape.
**Response:** `200 OK` — array of `{ id, title, start, end, backgroundColor, extendedProps: { type: "booking"|"block", status?, location? } }`.
**Errors:** `403` — not a pandit.

### POST /api/v1/pandits/me/calendar/
**Auth:** Bearer token required (pandit role)
**Description:** Create a manual "unavailable" block on the pandit's calendar.
**Request body:** `{ "start_time": "ISO datetime", "end_time": "ISO datetime", "title": "string (optional, default 'Unavailable')" }`
**Errors:** `400` — validation errors; `403` — not a pandit.

### DELETE /api/v1/pandits/me/calendar/blocks/{block_id}/
**Auth:** Bearer token required (owning pandit)
**Description:** Remove one availability block.
**Response:** `200 OK` — `{ "success": "Block removed" }`
**Errors:** `400` — block not found / not owned.

### GET /api/v1/pandits/wallet/
**Auth:** Bearer token required (pandit role)
**Response:** `200 OK` — `{ "total_earned": "0.00", "available_balance": "0.00", "total_withdrawn": "0.00" }`
**Errors:** `404` — no wallet found.

### GET /api/v1/pandits/withdrawals/
**Auth:** Bearer token required (pandit role)
**Response:** `200 OK` — `[ { "id": 1, "amount": "500.00", "status": "PENDING", "created_at": "..." } ]`

### POST /api/v1/pandits/withdrawal/request/
**Auth:** Bearer token required (pandit role)
**Request body:** `{ "amount": "500.00" }`
**Response:** `200 OK` — `{ "success": "Withdrawal requested successfully" }`
**Errors:** `400` — missing/invalid amount, non-positive amount, or amount exceeds available balance.

### Pandit admin endpoints (brief)
**Auth:** Admin (`is_staff` or `role in (admin, superadmin)`)
- `GET /api/v1/pandits/admin/pending/` — list pandits with `verification_status=PENDING`.
- `GET /api/v1/pandits/admin/all/` — all pandits with aggregate rating/review stats + counts.
- `POST /api/v1/pandits/admin/verify/{pandit_id}/` — body `{ "notes": "string" }` → approves and verifies.
- `POST /api/v1/pandits/admin/reject/{pandit_id}/` — body `{ "reason": "string" }` → sets `REJECTED`.
- `GET /api/v1/pandits/admin/withdrawals/` — all pandit withdrawal requests.
- `POST /api/v1/pandits/admin/withdrawals/{withdrawal_id}/approve/` — approves and deducts from wallet.
- `GET /api/v1/pandits/admin/earnings/{pandit_id}/` — earnings/verification detail for one pandit.

---

## Bookings

> A `Booking` links a customer, a `PanditUser`, and optionally a `services.Puja`. Status flow: `PENDING → ACCEPTED → COMPLETED`, with `CANCELLED`, `FAILED`, `MISSED`, `RESCHEDULED` as terminal/side states.

### GET /api/v1/bookings/
**Auth:** Bearer token required
**Description:** List bookings visible to the caller — customers see their own, pandits see bookings assigned to them, admins see all.
**Response:** `200 OK` — paginated list:
```json
{
  "id": 1, "user_full_name": "string", "pandit": 5, "pandit_full_name": "string", "pandit_expertise": "string", "pandit_id": 5,
  "service_name": "string", "service_location": "ONLINE", "booking_date": "2026-09-01", "booking_time": "10:00:00",
  "full_name": "string", "phone_number": "string", "service_address": "string|null",
  "status": "PENDING", "service_fee": "2000.00", "samagri_fee": "500.00", "total_fee": "2500.00",
  "payment_status": false, "payment_method": null, "transaction_id": null,
  "service_duration": 90, "service_image": "url|null", "created_at": "...", "is_reviewed": false,
  "daily_room_url": null, "video_room_url": null, "recording_url": null, "recording_available": false
}
```

### POST /api/v1/bookings/
**Auth:** Bearer token required (`role='user'` only — pandits/vendors get `403`)
**Description:** Create a new booking request (status forced to `PENDING`).
**Request body:**
```json
{
  "pandit": 5, "service": "int, optional (Puja id)", "service_name": "string (optional, defaults to Puja name)",
  "service_location": "ONLINE|HOME|TEMPLE|PANDIT_LOCATION (optional, default ONLINE)",
  "booking_date": "YYYY-MM-DD, required", "booking_time": "HH:MM:SS, required",
  "notes": "string (optional)", "samagri_required": "bool (optional, default true)",
  "full_name": "string (optional)", "phone_number": "string (optional)", "service_address": "string (optional)",
  "customer_timezone": "string (optional)", "customer_location": "string (optional)"
}
```
> Fees are computed server-side: `service_fee = puja.base_price`, `samagri_fee = 500` (flat, NPR) if `samagri_required`, `total_fee = service_fee + samagri_fee`. There is no dedicated payment step here — payment is initiated separately via the Payments endpoints below.
**Errors:** `400` — booking date in the past, or the pandit already has a `PENDING`/`ACCEPTED` booking at that exact date/time; `403` — non-verified pandit, or caller is not a customer.

### GET /api/v1/bookings/{id}/
**Auth:** Bearer token required (must be within caller's scoped queryset)
**Description:** Full booking detail — superset of the list fields plus `service`, `service_description`, `user_phone`, `pandit_language`, `notes`, `customer_timezone`, `customer_location`, `updated_at`, `accepted_at`, `completed_at`, `chat_room_id`, `daily_room_name`.
**Errors:** `404` — not found or not in scope.

### PATCH/PUT /api/v1/bookings/{id}/
**Auth:** Bearer token required
> **Callout:** The detail serializer used for this action declares every field as `read_only`. A PATCH/PUT here validates and returns `200 OK` but does not actually change any field — it's effectively a no-op fetch. Use `update_status`, `cancel`, or `reschedule` below to actually mutate a booking.

### DELETE /api/v1/bookings/{id}/
**Auth:** Bearer token required
**Description:** Hard-deletes the booking row (no status check or refund logic runs).
> **Callout:** Prefer `PATCH /{id}/cancel/` for user-initiated cancellation — it preserves history and triggers notifications; this raw `DELETE` removes the record outright.

### PATCH /api/v1/bookings/{id}/update_status/
**Auth:** Bearer token required (must be the assigned pandit)
**Description:** Pandit transitions a booking's status. Valid transitions: `PENDING → ACCEPTED|CANCELLED`, `ACCEPTED → COMPLETED|CANCELLED`.
**Request body:** `{ "status": "ACCEPTED" }`
> On `ACCEPTED` for an `ONLINE` booking, a Daily.co video room is auto-created. On `COMPLETED`, 80% of `total_fee` is credited to the pandit's wallet.
**Errors:** `403` — not the assigned pandit; `400` — invalid status transition.

### PATCH /api/v1/bookings/{id}/cancel/
**Auth:** Bearer token required (must be the booking's customer)
**Description:** Customer cancels their own booking. Only allowed while `status=PENDING`.
**Errors:** `403` — not the owner; `400` — booking not in `PENDING` state.

### POST /api/v1/bookings/{id}/admin_cancel/
**Auth:** Admin
**Description:** Admin cancels + auto-refunds (Stripe/Khalti) a booking.
**Response:** `200 OK` — `{ "detail": "...", "booking_id": 1, "refund_processed": true }`
**Errors:** `400` — booking already `CANCELLED`/`COMPLETED`, or gateway refund failed.

### POST /api/v1/bookings/{id}/reschedule/
**Auth:** Bearer token required (must be the booking's customer)
**Description:** Free, one-time reschedule of a `MISSED` or `CANCELLED` booking into a brand-new `PENDING` booking, within 7 days of the original date. Fees carried as `0.00`.
**Request body:** `{ "booking_date": "YYYY-MM-DD", "booking_time": "HH:MM:SS" }`
**Response:** `200 OK` — `{ "detail": "...", "new_booking_id": 12, "status": "PENDING" }`
**Errors:** `403` — not the owner; `400` — wrong original status, already rescheduled once, 7-day window expired, missing date/time, or slot conflict.

### GET /api/v1/bookings/my_bookings/
**Auth:** Bearer token required
**Description:** Convenience alias returning the same role-scoped list as `GET /api/v1/bookings/`.

### GET /api/v1/bookings/available_slots/
**Auth:** Bearer token required
**Description:** Compute free 30-minute-stepped time slots for a pandit on a given day (business hours 08:00–20:00).
**Query params:** `pandit_id` (int, required), `date` (`YYYY-MM-DD`, required), `service_id` (int, optional, default 60 min).
**Response:** `200 OK` — `{ "available_slots": ["08:00", "08:30", ...] }`
**Errors:** `400` — missing params or bad date format; `404` — pandit not found or not verified.

### GET /api/v1/bookings/{id}/invoice/
**Auth:** Bearer token required (must be the booking's customer)
**Description:** Download a PDF invoice for the booking.
**Response:** `200 OK`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="PanditYatra_Invoice_Booking_{id}.pdf"`.
**Errors:** `404` — booking not found / not owned.

### POST /api/v1/admin/refund-cancel/{booking_id}/
**Auth:** Admin
**Description:** Alternate admin endpoint that cancels a booking and issues a Stripe/Khalti refund if paid. Mounted at the *root* `/api/v1/admin/...`, not under `/api/v1/bookings/...`.
**Response:** `200 OK` — `{ "message": "...", "booking_id": 1, "status": "CANCELLED" }`
**Errors:** `403` — not admin; `404` — not found; `400` — already cancelled.

---

## Vendors & Products

### GET /api/v1/vendors/ping/
**Auth:** None
**Description:** Liveness check. **Response:** `{ "message": "Vendors API is alive" }`

### POST /api/v1/vendors/register/
**Auth:** None
**Description:** Register a new Vendor shop account (or upgrade an existing `User` account by matching email).
**Request body** (multipart for `id_proof`):
```json
{
  "email": "string", "password": "string (required for brand-new accounts)",
  "full_name": "string", "phone_number": "string", "profile_pic": "file (optional)",
  "shop_name": "string", "business_type": "string", "address": "string", "city": "string",
  "bank_account_number": "string", "bank_name": "string", "account_holder_name": "string",
  "id_proof": "file (optional)", "bio": "string (optional)"
}
```
**Errors:** `400` — email required, phone/email already used by a different account, vendor already exists, or password missing for new accounts.

### GET /api/v1/vendors/profile/
**Auth:** Bearer token required
**Description:** Returns only the caller's own vendor record (or all, for admins).
**Response:** `200 OK` — array of:
```json
{
  "id": 1, "user_details": { "email": "...", "full_name": "...", "phone_number": "...", "profile_pic": "url|null", "is_active": true },
  "email": "string", "full_name": "string", "phone_number": "string", "profile_pic": "url|null", "user_active": true,
  "shop_name": "string", "business_type": "string", "address": "string", "city": "string",
  "bank_account_number": "string", "bank_name": "string", "account_holder_name": "string",
  "is_verified": true, "balance": "0.00", "bio": "string|null",
  "is_accepting_orders": true, "auto_approve_orders": false, "notification_email": "string|null",
  "is_low_stock_alert_enabled": true, "created_at": "...", "id_proof": "url|null"
}
```

### GET/PUT/PATCH /api/v1/vendors/profile/{id}/
**Auth:** Bearer token required (own record, or admin)
**Description:** `is_verified` and `balance` are read-only.

### POST /api/v1/vendors/profile/{id}/toggle_status/
**Auth:** Admin only
**Description:** Block/unblock a vendor account.
**Response:** `200 OK` — `{ "detail": "...", "is_active": false }`

### GET /api/v1/vendors/profile/stats/
**Auth:** Bearer token required (vendor role)
**Response:** `200 OK`
```json
{
  "total_revenue": 15000.0, "total_orders": 5, "total_products": 20, "low_stock_count": 2,
  "low_stock_items": [ { "id": 3, "name": "string", "stock_quantity": 4, "image": "url|null" } ],
  "current_balance": "1200.00", "total_withdrawn": "0.00", "is_verified": true, "verification_status": "APPROVED"
}
```
**Errors:** `404` — caller has no vendor account.

### GET/POST /api/v1/vendors/products/
**Auth:** Bearer token required
**Description:** List/create the logged-in vendor's own `SamagriItem` products (admins see all). New vendor items start `is_approved=false` until an admin approves (auto-approved if the vendor itself is `verification_status=APPROVED`).
**Request body (POST):** `SamagriItemSerializer` shape (see Samagri section) — `vendor` forced server-side to the caller's own vendor account.

### GET/PUT/PATCH/DELETE /api/v1/vendors/products/{id}/
**Auth:** Bearer token required (must own the product, or be admin)

### GET /api/v1/vendors/orders/
**Auth:** Bearer token required (vendor role)
**Description:** Read-only list of shop orders containing at least one of the vendor's items (admins see all).
**Response:** `200 OK`
```json
{
  "id": 1, "customer_name": "string", "customer_email": "string", "buyer_role": "user",
  "total_amount": "2500.00", "status": "PAID", "shipping_address": "string", "city": "string", "phone_number": "string",
  "items": [ { "id": 1, "item_name": "string", "quantity": 2, "price_at_purchase": "500.00" } ],
  "created_at": "..."
}
```
> `items` is filtered to only the calling vendor's line items within that order.

### GET /api/v1/vendors/orders/{id}/
**Auth:** Bearer token required — same scoping as list.

### POST /api/v1/vendors/orders/{id}/update_status/
**Auth:** Bearer token required (vendor role)
**Description:** Vendor marks an order `SHIPPED` or `DELIVERED`.
**Request body:** `{ "status": "SHIPPED" }`
**Response:** `200 OK` — `{ "status": "updated" }`
**Errors:** `400` — invalid status value.
> **Callout:** This is a *different, older* status-update path than `/api/v1/samagri/checkout/{id}/vendor-update-status/` below, and it does **not** update the linked `OrderDelivery` record or set `dispatched_at`/`delivered_at`. Prefer the samagri checkout endpoints for delivery-tracking.

### GET/POST /api/v1/vendors/payouts/
**Auth:** Bearer token required (vendor role for POST; admins see all)
**Request body (POST):** `{ "amount": "1000.00" }`
**Response:** `200/201` — `{ "id": 1, "vendor": 1, "amount": "1000.00", "status": "PENDING", "transaction_id": null, "requested_at": "...", "paid_at": null }`
**Errors:** `400` — non-vendor caller.

### Vendor admin endpoints (brief)
**Auth:** Admin only
- `GET /api/v1/vendors/pending/` — unverified vendors.
- `GET /api/v1/vendors/all/` — all vendors + `{total, verified, pending}` stats.
- `POST /api/v1/vendors/verify/{vendor_id}/` — approve.
- `POST /api/v1/vendors/reject/{vendor_id}/` — body `{ "reason": "string" }` → reject.

---

## Samagri — Categories, Items & AI Recommendations

### GET /api/v1/samagri/categories/
**Auth:** None (read); Admin (write)
**Description:** List active Samagri categories with their approved/active items nested.
**Response:** `200 OK`
```json
{
  "id": 1, "name": "string", "slug": "string", "description": "string|null",
  "image": "url|null", "icon": "lucide-icon-name|null", "order": 0, "is_active": true,
  "items": [ "... item objects, see below ..." ]
}
```

### GET /api/v1/samagri/categories/{id}/
**Auth:** None — category detail, same shape as above.

### POST/PUT/PATCH/DELETE /api/v1/samagri/categories/[{id}/]
**Auth:** Admin only

### GET /api/v1/samagri/items/
**Auth:** None (read — only `is_approved=true, is_active=true` items shown to non-admins); Admin (write, sees all)
**Description:** Samagri (puja materials) product catalog.
**Query params:** `category` (int, optional).
**Response:** `200 OK`
```json
{
  "id": 1, "name": "string", "category": 1, "category_name": "string",
  "price": "150.00", "price_usd": "1.15", "stock_quantity": 40, "unit": "pcs",
  "image": "url|null", "description": "string|null", "is_active": true, "is_approved": true,
  "vendor": 3, "vendor_details": { "id": 3, "shop_name": "string" }, "created_at": "..."
}
```
> `vendor_details` is `{ "id": 0, "shop_name": "PanditYatra Official" }` for items with no vendor. `price_usd` is computed on the fly if `0.00`/unset.

### POST/PUT/PATCH/DELETE /api/v1/samagri/items/[{id}/]
**Auth:** Admin only (vendors add their own items via `/api/v1/vendors/products/`, not this endpoint).

### POST /api/v1/samagri/items/{id}/approve/
**Auth:** Admin only — sets `is_approved=true`.
**Response:** `200 OK` — `{ "status": "approved" }`

### POST /api/v1/samagri/items/{id}/reject/
**Auth:** Admin only — sets `is_approved=false`.
**Response:** `200 OK` — `{ "status": "rejected" }`

### GET/POST/PUT/PATCH/DELETE /api/v1/samagri/requirements/
**Auth:** None (read); Admin (write)
**Description:** Recommended Samagri items/quantities for a given Puja.
**Query params (GET):** `puja` (int, optional).
**Response:** `200 OK` — `{ "samagri_name": "string", "samagri_unit": "string", "quantity": 1, "samagri_price": "150.00" }`
> **Callout:** The serializer wired to this endpoint marks every field read-only and doesn't expose `puja`/`samagri_item` for writing — in the current code, `POST`/`PUT` cannot actually succeed with real data. Treat this endpoint as **read-only** until the backend is fixed.

### POST /api/v1/samagri/ai_recommend/
**Auth:** Bearer token required (throttled — `ai_endpoint` scope, 30/hour)
**Description:** Groq-LLM-powered Samagri shopping list recommendation for a given Puja + context, matched against the real product catalog where possible.
**Request body:**
```json
{
  "puja_id": 1, "user_notes": "string (optional)", "location": "ONLINE|HOME|TEMPLE|PANDIT_LOCATION (optional)",
  "customer_timezone": "string (optional)", "customer_location": "string (optional)", "budget_preference": "string (optional)"
}
```
**Response:** `200 OK`
```json
{
  "recommendations": [
    { "name": "Rice", "quantity": 1, "unit": "kg", "is_essential": true, "confidence": 0.95,
      "reason": "string", "alternatives": ["Basmati rice"], "price": 100.0, "id": 12, "in_stock": true, "category": "Grains" }
  ],
  "context": { "puja_name": "string", "location": "ONLINE", "total_items": 4, "essential_items": 3, "estimated_total": 480.0 }
}
```
**Errors:** `400` — missing `puja_id`; `404` — puja not found; `500` — AI provider error; `429` — AI quota/rate limit exceeded.

---

## Wishlist

### GET /api/v1/samagri/wishlist/
**Auth:** Bearer token required
**Response:** `200 OK` — `[ { "id": 1, "item": {"... samagri item ..."}, "created_at": "..." } ]`

### POST /api/v1/samagri/wishlist/add/
**Auth:** Bearer token required
**Request body:** `{ "item_id": 5 }`
**Response:** `201 Created` (newly added) or `200 OK` (already present) — `{ "message": "string", "item": {...} }`
**Errors:** `400` — item not found.

### DELETE /api/v1/samagri/wishlist/remove/{item_id}/
**Auth:** Bearer token required
**Response:** `200 OK` — `{ "message": "Item removed from favorites" }`
**Errors:** `404` — not in favorites.

### GET /api/v1/samagri/wishlist/check/{item_id}/
**Auth:** Bearer token required
**Response:** `200 OK` — `{ "is_favorite": true }`

### POST /api/v1/samagri/wishlist/toggle/
**Auth:** Bearer token required
**Request body:** `{ "item_id": 5 }`
**Response:** `201 Created` — `{ "action": "added", "message": "...", "is_favorite": true, "item": {...} }`, or `200 OK` — `{ "action": "removed", "message": "...", "is_favorite": false }`

---

## Cart

### GET /api/v1/samagri/cart/
**Auth:** Bearer token required
**Description:** Not paginated.
**Response:** `200 OK` — `[ { "id": 1, "item": {"..."}, "quantity": 2, "created_at": "...", "updated_at": "..." } ]`

### POST /api/v1/samagri/cart/
**Auth:** Bearer token required
**Description:** Add an item to the cart, or **increment** quantity if already present.
**Request body:** `{ "item_id": 5, "quantity": 1 }` (`quantity` optional, default `1`)
**Errors:** `404` — samagri item not found; `400` — validation error.

### PUT/PATCH /api/v1/samagri/cart/{id}/
**Auth:** Bearer token required (own cart line)
**Description:** Set (not increment) the quantity of a cart line.
**Request body:** `{ "quantity": 3 }`

### DELETE /api/v1/samagri/cart/{id}/
**Auth:** Bearer token required (own cart line)
**Response:** `204 No Content`

### DELETE /api/v1/samagri/cart/clear/
**Auth:** Bearer token required
**Response:** `204 No Content` — `{ "message": "Cart cleared" }`

---

## Orders (Samagri Shop Checkout)

### POST /api/v1/samagri/checkout/initiate/
**Auth:** Bearer token required (`role != 'vendor'` — vendors get `403`)
**Description:** Places a `ShopOrder` from a client-supplied item list (**not** read from the server-side cart), deducts stock, computes delivery charge, and kicks off payment with the chosen gateway.
**Request body:**
```json
{
  "items": [ { "id": 5, "quantity": 2 } ],
  "full_name": "string", "phone_number": "string", "shipping_address": "string", "city": "string",
  "payment_method": "STRIPE|KHALTI|ESEWA|COD",
  "delivery_method": "DELIVERY|PICKUP (default DELIVERY)",
  "delivery_address_id": "int (optional — overrides full_name/phone/address/city with the saved address)",
  "latitude": "decimal (optional)", "longitude": "decimal (optional)"
}
```
**Response:** `200 OK`, shape depends on `payment_method`:
- `KHALTI`: `{ "payment_url": "string", "order_id": 1 }`
- `STRIPE`: `{ "payment_url": "string", "order_id": 1 }`
- `ESEWA`: `{ "payment_url": "string", "form_data": {"...": "fields to POST"}, "order_id": 1, "gateway": "ESEWA" }`
- `COD`: `{ "order_id": 1, "gateway": "COD", "status": "PENDING" }` — no gateway redirect.
**Errors:** `400` — insufficient stock, gateway initiation error; `403` — vendor accounts cannot buy; `404` — item not found.
> **Callout — eSewa flow differs from Khalti/Stripe:** for `KHALTI`/`STRIPE` simply redirect to `payment_url`. For `ESEWA` you must render/submit an HTML form with the returned `form_data` fields to `payment_url` (eSewa expects a signed POST form submission, not a plain redirect).

### GET /api/v1/samagri/checkout/my-orders/
**Auth:** Bearer token required
**Response:** `200 OK` — array of:
```json
{
  "id": 1, "user_email": "string", "total_amount": "2650.00", "status": "PAID", "buyer_role": "user",
  "full_name": "string", "phone_number": "string", "shipping_address": "string", "city": "string",
  "payment_method": "KHALTI", "transaction_id": "string",
  "items": [ { "id": 1, "samagri_item": 5, "item_name": "string", "item_image": "url|null", "quantity": 2, "price_at_purchase": "150.00" } ],
  "delivery": { "id": 1, "delivery_method": "DELIVERY", "delivery_address": {"..."}, "delivery_zone": {"..."}, "delivery_charge": "150.00", "status": "PENDING", "assigned_agent": null, "assigned_agent_email": null, "tracking_notes": null, "dispatched_at": null, "delivered_at": null, "created_at": "...", "updated_at": "..." },
  "created_at": "..."
}
```
`status` is one of `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

### GET /api/v1/samagri/checkout/{id}/detail/
**Auth:** Bearer token required (must own the order)
**Errors:** `404` — not found / not owned.

### GET /api/v1/samagri/checkout/{id}/invoice/
**Auth:** Bearer token required (must own the order)
**Response:** `200 OK`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="PanditYatra_Invoice_SHOP_{id}.pdf"`.
**Errors:** `404` — not found / not owned.

### PATCH /api/v1/samagri/checkout/{id}/admin-update-status/
**Auth:** Admin only
**Description:** Force-set an order's status. Cancelling restores stock.
**Request body:** `{ "status": "PAID|SHIPPED|DELIVERED|CANCELLED|PENDING" }`
**Errors:** `400` — invalid/missing status; `404` — order not found.

### GET /api/v1/samagri/checkout/vendor-orders/
**Auth:** Bearer token required (vendor role)
**Description:** Orders containing at least one of the vendor's items — same underlying data as `/api/v1/vendors/orders/`, but returns the full order shape including delivery info.
**Errors:** `403` — caller has no vendor account.

### PATCH /api/v1/samagri/checkout/{id}/vendor-update-status/
**Auth:** Bearer token required (vendor role, must have an item in the order)
**Description:** Vendor sets order status to `SHIPPED` or `DELIVERED`.
**Request body:** `{ "status": "SHIPPED" }`
**Errors:** `403` — not a vendor; `400` — status not in `["SHIPPED", "DELIVERED"]`; `404` — order not found or has none of the vendor's items.

### GET /api/v1/samagri/checkout/admin-all-orders/
**Auth:** Admin only
**Query params:** `status` (optional), `role` (optional — filters by `buyer_role`).

---

## Delivery Tracking

### GET/POST /api/v1/samagri/addresses/
**Auth:** Bearer token required
**Description:** List/create the caller's saved delivery addresses. Setting `is_default=true` automatically un-defaults other addresses.
**Request body (POST):**
```json
{ "name": "Home", "full_name": "string", "phone_number": "string", "address_line": "string", "city": "string", "latitude": "27.7172 (optional)", "longitude": "85.3240 (optional)", "is_default": true }
```

### GET/PUT/PATCH/DELETE /api/v1/samagri/addresses/{id}/
**Auth:** Bearer token required (own address only)

### GET /api/v1/samagri/zones/
**Auth:** None (read); Admin (write)
**Description:** Delivery pricing zones (distance-band shipping estimate).
**Response:** `200 OK` — `[ { "id": 1, "name": "string", "radius_min_km": "0.00", "radius_max_km": "5.00", "charge_npr": "100.00", "is_active": true } ]`

### GET /api/v1/samagri/deliveries/
**Auth:** Bearer token required
**Description:** List `OrderDelivery` records visible to the caller — customers see their own, vendors see deliveries for orders containing their items, admins see all.

### GET /api/v1/samagri/deliveries/{id}/
**Auth:** Bearer token required (scoped as above)

### PATCH /api/v1/samagri/deliveries/{id}/update-delivery-status/
**Auth:** Bearer token required — role-gated:
- **Admin/staff:** any status (`PENDING|ASSIGNED|PREPARING|DISPATCHED|DELIVERED|CANCELLED`), can assign a delivery agent.
- **Vendor:** only `PREPARING` or `DISPATCHED`. Setting `DISPATCHED` also flips the parent order's status to `SHIPPED`.
- **Customer:** forbidden (`403`).
**Request body:** `{ "status": "DISPATCHED", "tracking_notes": "string (optional)", "assigned_agent": "int (optional, admin only)" }`
> Setting `status=DELIVERED` (admin path) also sets the parent order's `status` to `DELIVERED` and stamps `delivered_at`; `DISPATCHED` stamps `dispatched_at`.
**Errors:** `400` — missing status; `403` — role not permitted for the requested status; `404` — delivery agent id not found.
> **Callout — polling, not push:** there is no WebSocket/SSE channel for delivery status. Mobile clients must poll `GET /api/v1/samagri/deliveries/{id}/` or `GET /api/v1/samagri/checkout/{id}/detail/` to reflect status changes.

### GET /api/v1/samagri/deliveries/estimate-charge/
**Auth:** Bearer token required
**Description:** Pre-checkout helper to estimate delivery charge for a given lat/long using Haversine distance from a fixed Kathmandu-center point, matched against `DeliveryZone` bands (falls back to `Rs. 150` flat + `Rs. 15/km` beyond the outermost zone, or a flat `Rs. 150` if no zones exist).
**Query params:** `latitude` (required), `longitude` (required).
**Response:** `200 OK` — `{ "estimated_charge": 150.0, "zone_name": "string|Default / Remote Area", "currency": "NPR" }`
**Errors:** `400` — missing lat/long.

---

## Payments

> Three gateways are supported: **Khalti** and **eSewa** (NPR, Nepal-local) and **Stripe** (USD, international). A `Payment` row is only created for **booking** payments — shop orders track payment state directly on `ShopOrder.status`/`transaction_id`.

### POST /api/v1/payments/create/
### POST /api/v1/payments/initiate/
**Auth:** Bearer token required
**Description:** Both paths route to the same view — initiate payment for a booking.
**Request body:**
```json
{ "booking_id": 1, "gateway": "STRIPE|KHALTI|ESEWA (default STRIPE)", "currency": "USD|NPR (default USD, Stripe only)" }
```
**Response:** `200 OK`, shape by gateway:
- `STRIPE`: `{ "success": true, "gateway": "STRIPE", "session_id": "string", "checkout_url": "string", "payment_id": 1 }`
- `KHALTI`: `{ "success": true, "gateway": "KHALTI", "pidx": "string", "payment_url": "string", "payment_id": 1 }`
- `ESEWA`: `{ "success": true, "gateway": "ESEWA", "payment_url": "string", "form_data": {...}, "transaction_uuid": "string", "payment_id": 1 }`
**Errors:** `400` — booking already paid, invalid gateway, or gateway rejected the request; `404` — booking not found/not owned; `500` — gateway/Stripe not configured or unexpected error.

### GET /api/v1/payments/verify-stripe/
**Auth:** None
**Description:** Landing-page check after a Stripe Checkout redirect — finalizes the booking or shop order if `payment_status == 'paid'` (idempotent).
**Query params:** `session_id` (required), `order_id` (optional, shop flow), `booking_id` (optional, booking flow).
**Response:** `200 OK`
```json
{ "success": true, "status": "PAID", "payment_method": "STRIPE", "order_id": "1|null", "booking_id": "1|null", "transaction_id": "string", "amount": 2500.0, "type": "BOOKING|SHOP_ORDER|UNKNOWN", "is_first_booking": false, "date": 1735689600 }
```
or `{ "success": false, "status": "<stripe payment_status>", "message": "Payment not completed" }`.
**Errors:** `400` — missing `session_id`; `500` — Stripe API error.

### GET /api/v1/payments/khalti/verify/
**Auth:** None
**Description:** Landing-page handler for Khalti — looks up the payment (or shop order) by `pidx` and confirms status via Khalti's Lookup API.
**Query params:** `pidx` (required).
**Response:** `200 OK` — `{ "success": true, "booking_id": 1, "transaction_id": "string", "payment_method": "KHALTI", "is_first_booking": false, "type": "BOOKING" }` (booking) or `{ "success": true, "order_id": 1, "transaction_id": "string", "payment_method": "KHALTI", "type": "SHOP_ORDER" }` (shop).
**Errors:** `400` — missing `pidx`, or gateway verification failed; `404` — no matching record; `500` — unexpected error.

### GET /api/v1/payments/esewa/verify/
**Auth:** None
**Description:** Landing-page handler for eSewa — decodes the base64 `data` query param, verifies with eSewa, and strictly compares the paid amount to the expected amount.
**Query params:** `data` (required, base64-encoded JSON), `order_id` (optional fallback for shop flow).
**Response:** shape mirrors the Khalti verify responses above.
**Errors:** `400` — missing `data`, amount mismatch, or verification failed; `404` — no matching record; `500` — unexpected error.

### GET /api/v1/payments/check-status/{booking_id}/
**Auth:** Bearer token required (must own the booking)
**Response:** `200 OK` — `{ "payment_status": "PENDING|PROCESSING|COMPLETED|FAILED|REFUNDED", "payment_method": "string", "amount_npr": 2500.0, "amount_usd": 19.0, "currency": "NPR", "transaction_id": "string", "completed_at": "..." }`, or `{ "payment_status": "NOT_INITIATED", "booking_paid": false }` if no `Payment` row exists yet.
**Errors:** `404` — booking not found / not owned.

### GET /api/v1/payments/exchange-rate/
**Auth:** None
**Query params:** `npr` (optional).
**Response:** `200 OK` — `{ "rate": 133.5, "base": "NPR", "target": "USD", "converted": { "npr": 1000.0, "usd": 7.49 } }` (`converted` present only if `npr` supplied).

### POST /api/v1/payments/webhooks/stripe/
**Auth:** None (gateway-to-server only — not for mobile clients)
**Description:** Stripe webhook receiver for `checkout.session.completed`.
> **Callout — signature verification:** validated via the `Stripe-Signature` header against `settings.STRIPE_WEBHOOK_SECRET`. Requests with a missing/invalid signature get `400`.
**Errors:** `400` — invalid payload or invalid signature.

### POST /api/v1/payments/webhooks/khalti/
**Auth:** None (gateway-to-server only)
> **Callout:** Khalti does **not** cryptographically sign its webhook payloads. The handler only uses the incoming body to extract `pidx`, then makes a trusted server-to-server call to Khalti's Lookup API to confirm payment status — the webhook body itself is never trusted for final state. Idempotent.
**Response:** always `200` (errors are logged server-side, per Khalti's webhook contract).

### Payment admin endpoints (brief)
**Auth:** Admin only
- `GET /api/v1/payments/admin/` — full payment ledger.
- `GET /api/v1/payments/admin/payouts/` — all pandits' wallet balances.
- `GET /api/v1/payments/admin/withdrawals/` — all pandit withdrawal requests.
- `POST /api/v1/payments/admin/withdrawals/{id}/approve/` — approve a withdrawal, deduct from wallet.
- `POST /api/v1/payments/{payment_id}/refund/` — refund via Stripe/Khalti (eSewa refunds not supported — returns `400`).
- `POST /api/v1/payments/{payment_id}/verify-manual/` — manually mark a pending payment `COMPLETED` (cash/offline reconciliation).

---

> **Currency handling:** all monetary model fields are NPR by default, with a parallel `*_usd` field computed on the fly via a live/cached exchange rate. Prefer the `*_usd` value already present in a response rather than converting client-side, since the backend's exchange rate may not match a client-fetched rate exactly.
</content>
## Kundali

> All Kundali endpoints live under `/api/v1/kundali/`. Charts are calculated with Swiss Ephemeris using the **Lahiri (Chitrapaksha) sidereal ayanamsa** and a **Whole Sign** house system. Every degree/longitude field in every response is sidereal, not tropical.

### POST /api/v1/kundali/generate/

**Auth:** Bearer token required

**Description:** Generates a complete Vedic birth chart (planets, houses, Vimshottari Dasha, Navamsa/D9, Yogas) and persists it against the logged-in user, plus a non-blocking AI interpretation.

**Request body:**
```json
{
  "dob": "1998-04-12",          // required, "YYYY-MM-DD"
  "time": "14:35",              // required, "HH:MM" (24h) or "H:MM AM/PM" — also accepts "HH:MM:SS" / "H:MM:SS AM/PM"
  "latitude": 27.7172,          // required, float, -90..90
  "longitude": 85.3240,         // required, float, -180..180
  "timezone": "Asia/Kathmandu", // optional, IANA tz name, default "Asia/Kathmandu"
  "place": "Kathmandu, Nepal"   // optional, string, default ""
}
```

> Birth time precision matters: the ascendant/lagna shifts roughly 1° every 4 minutes, so an inaccurate `time` visibly shifts which house every planet falls in. There is no fallback for "unknown birth time."
> `timezone` must be a valid IANA name (e.g. `Asia/Kathmandu`, `America/New_York`); an unrecognized string silently falls back to UTC inside the ephemeris layer rather than erroring — always send a real IANA tz.

**Response** `201 Created`:
```json
{
  "kundali_id": 42,
  "lagna_degree": 123.4567,
  "lagna_rashi": "Simha",
  "lagna_rashi_en": "Leo",
  "mc_degree": 33.1122,
  "ayanamsa": 24.123456,
  "timezone": "Asia/Kathmandu",
  "planets": [
    {
      "planet": "Sun",
      "longitude": 28.1234,
      "rashi": "Mesha",
      "rashi_en": "Aries",
      "rashi_index": 0,
      "nakshatra": "Bharani",
      "pada": 2,
      "nakshatra_lord": "Venus",
      "house": 9,
      "retrograde": false,
      "combust": false,
      "speed": 0.9856
    }
  ],
  "houses": [
    { "house_number": 1, "cusp_longitude": 120.0 }
  ],
  "ai_prediction": "Namaste! Your Lagna in Simha suggests...",
  "dashas": [
    {
      "lord": "Venus",
      "start_date": "1998-04-12",
      "end_date": "2018-04-12",
      "years": 20,
      "antardashas": [
        { "lord": "Venus", "start_date": "1998-04-12", "end_date": "2001-08-12", "years": 3.4 }
      ]
    }
  ],
  "current_dasha": {
    "mahadasha": { "lord": "Rahu", "start_date": "2018-04-12", "end_date": "2036-04-12" },
    "antardasha": { "lord": "Jupiter", "start_date": "2022-01-01", "end_date": "2023-04-01" }
  },
  "navamsa": {
    "lagna": {
      "d9_lagna_rashi": "Vrischika",
      "d9_lagna_rashi_en": "Scorpio",
      "d9_lagna_rashi_index": 7,
      "d9_lagna_degree": 12.5
    },
    "planets": [
      { "planet": "Sun", "d9_rashi": "Mesha", "d9_rashi_en": "Aries", "d9_rashi_index": 0, "d9_degree": 4.2 }
    ]
  },
  "yogas": [
    {
      "name": "Gaja Kesari Yoga",
      "description": "Jupiter is angular to the Moon...",
      "planets_involved": ["Jupiter", "Moon"],
      "strength": "Strong",
      "houses_involved": [1, 4]
    }
  ]
}
```

> `ai_prediction` is generated by Groq (Llama 3.3 70B) synchronously as the last step of chart generation — if the AI call fails or `GROQ_API_KEY` is unset, `ai_prediction` is silently `""` rather than failing the whole request. The chart is always saved even if the AI step fails.

**Errors:**
- `400 Bad Request` — `{"detail": "Invalid input", "errors": {...}}` when a field fails validation (bad date/time format, lat/lon out of range).
- `401 Unauthorized` — missing/invalid Bearer token.
- `500 Internal Server Error` — `{"detail": "Chart calculation failed: ..."}` if the Swiss Ephemeris calculation raises.

---

### GET /api/v1/kundali/list/

**Auth:** Bearer token required

**Description:** Lists every Kundali owned by the logged-in user, most recent first, fully expanded (planets, houses, dashas, navamsa, yogas).

**Query params:** none.

**Response** `200 OK` — array of objects shaped like:
```json
[
  {
    "id": 42,
    "dob": "1998-04-12",
    "time": "14:35:00",
    "place": "Kathmandu, Nepal",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "timezone": "Asia/Kathmandu",
    "lagna_degree": 123.4567,
    "lagna_rashi": "Simha",
    "moon_rashi": "Karka",
    "sun_rashi": "Mesha",
    "ayanamsa": 24.123456,
    "created_at": "2026-08-20T09:12:00Z",
    "ai_prediction": "...",
    "planets": [ { "planet": "Sun", "longitude": 28.1234, "rashi": "Mesha", "nakshatra": "Bharani", "pada": 2, "nakshatra_lord": "Venus", "house": 9, "retrograde": false, "combust": false } ],
    "houses": [ { "house_number": 1, "cusp_longitude": 120.0 } ],
    "dashas": [ { "lord": "Venus", "start_date": "1998-04-12", "end_date": "2018-04-12", "antardashas": [ { "lord": "Venus", "start_date": "1998-04-12", "end_date": "2001-08-12" } ] } ],
    "current_dasha": { "mahadasha": null, "antardasha": null },
    "navamsa": [ { "planet": "Sun", "d9_rashi": "Mesha", "d9_rashi_index": 0, "d9_degree": 4.2 } ],
    "yogas": [ { "name": "Gaja Kesari Yoga", "description": "...", "planets_involved": ["Jupiter","Moon"], "strength": "Strong", "houses_involved": [1,4] } ]
  }
]
```

> Unlike the `generate/` response, the per-planet objects returned here (and by `get_kundali`/`list_kundalis`) omit `speed` and `rashi_en`/`rashi_index`, and the `dashas`/`antardashas` entries omit `years` — they are reconstructed from the saved `KundaliDasha` rows rather than the freshly-computed dasha tree. Don't assume field parity between the `generate/` response and the list/detail responses.
> `place` falls back to `"{latitude}, {longitude}"` if it was left blank at generation time.

**Errors:** `401 Unauthorized` if not logged in.

---

### GET /api/v1/kundali/{id}/

**Auth:** Bearer token required (must own the Kundali)

**Description:** Fetch a single saved Kundali by ID, fully expanded, same shape as one list item (plus `place` is returned as-stored, not backfilled, and planet objects include `speed`).

**Response** `200 OK`: same shape as an item in `GET /kundali/list/`'s array, but as a single object (see above; `planets[]` here includes a `speed` field).

**Errors:**
- `404 Not Found` — `{"detail": "Not found."}` if the Kundali doesn't exist or belongs to another user.
- `401 Unauthorized`.

---

### DELETE /api/v1/kundali/{id}/delete/

**Auth:** Bearer token required (must own the Kundali)

**Description:** Permanently deletes a Kundali and its related planets/houses/dashas/navamsa/yogas (cascade).

**Response:** `204 No Content`, empty body.

**Errors:** `404 Not Found` — `{"detail": "Not found."}` if not owned/doesn't exist. `401 Unauthorized`.

---

### GET /api/v1/kundali/public-stats/

**Auth:** None (public)

**Description:** Landing-page stats: total charts generated site-wide and a combined rating (blends pandit-booking reviews and site reviews).

**Response** `200 OK`:
```json
{
  "total_kundalis": 1532,
  "average_rating": 4.6,
  "total_reviews": 218,
  "languages_supported": 2
}
```

---

### POST /api/v1/kundali/expert-predict/

**Auth:** Bearer token required

**Description:** Streaming, chat-style "expert Vedic astrologer" endpoint (Groq LLM). Supports a first ("initial reading") call as well as multi-turn follow-up chat, and optional PDF/image attachments. Response is a **streamed plain-text body**, not JSON.

**Request body:** `multipart/form-data`
```
planets   : JSON string (optional) — array of {planet, rashi, house, longitude, nakshatra, pada, retrograde} used as chart context for the reading
messages  : JSON string (optional) — chat history, array of {"role":"user"|"assistant","content":"..."}; only the last 20 messages are kept, each message capped to 4000 chars, and any entry with an invalid role/content shape is dropped
attachment: file (optional) — PDF or image (jpg/jpeg/png/webp); PDF text is extracted, images are sent to a Groq vision model and also uploaded to Cloudinary
name      : string (optional) — used for the AI's greeting
dob, time, place, lagna_rashi/lagna, moon_rashi, sun_rashi: optional context fields echoed into the prompt
```

> This endpoint is throttled at `ai_endpoint` scope (**30 requests/hour per user**), on top of a separate **daily AI quota** shared across all AI features (`ai`, `kundali`, `samagri`, `chat`) — default 50/day, configurable by admins via `PlatformSetting.ai_daily_quota_per_user`.
> Response content-type is `text/plain; charset=utf-8` with `Cache-Control: no-cache` and `X-Accel-Buffering: no` — a mobile client must consume it as a stream/SSE-like chunked body, not parse it as JSON.
> If `GROQ_API_KEY` is missing or the Groq call errors, the error is streamed back as plain text (e.g. `"The cosmic alignment is temporarily blurred. Groq Error: ..."`) with an HTTP 200 — it is **not** surfaced as a non-2xx status.

**Errors:**
- `429 Too Many Requests` — daily AI quota exceeded: `{"error": "Daily AI usage limit reached. Please try again tomorrow.", "quota": 50, "used": 50}`.
- `429 Too Many Requests` — hourly throttle exceeded (DRF's standard throttle response).
- `401 Unauthorized`.

---

### GET /api/v1/kundali/daily-horoscope/

**Auth:** None (public)

**Description:** Public daily transit ("Gochara") reading keyed only by Moon sign (Rashi) — no login or saved chart needed. Does not include the Nakshatra Tara Chakra section (needs a birth Nakshatra).

**Query params:**
```
rashi : string, required — Sanskrit (e.g. "Mesha") or English (e.g. "Aries") sign name, case-insensitive. Also tolerates the legacy stored format "Meena (Pisces)".
```

**Response** `200 OK`:
```json
{
  "date": "2026-08-31",
  "birth_rashi": "Mesha",
  "birth_rashi_en": "Aries",
  "birth_nakshatra": null,
  "moon_transit": {
    "rashi": "Karka",
    "rashi_en": "Cancer",
    "nakshatra": "Pushya",
    "house_from_birth_moon": 4,
    "is_chandrashtama": false
  },
  "tara_chakra": null,
  "sade_sati": null,
  "categories": {
    "health": { "score": 4, "label": "Good" },
    "wealth": { "score": 3, "label": "Neutral" },
    "love": { "score": 3, "label": "Neutral" },
    "career": { "score": 2, "label": "Challenging" }
  },
  "overall": { "score": 3, "label": "Neutral", "summary": "The transiting Moon is in a neutral house from your birth Moon today." },
  "transits": {
    "Sun": { "rashi": "Simha", "rashi_en": "Leo", "nakshatra": "Magha", "is_retrograde": false }
  }
}
```

> `sade_sati` is `null` unless Saturn is currently transiting the 12th, 1st, or 2nd sign from the given Moon sign; when present it looks like `{"phase": "peak", "label": "Sade Sati — Peak Phase (Saturn on your Moon)"}`.
> Results are cached server-side per `(rashi, nakshatra, day)` for 6 hours — expect the same payload on repeat calls within that window, and don't assume real-time freshness on every request.

**Errors:** `400 Bad Request` — `{"detail": "Provide a valid ?rashi= (e.g. Mesha or Aries).", "valid_rashis": [...]}` if `rashi` is missing/unrecognized.

---

### GET /api/v1/kundali/{kundali_id}/daily-horoscope/

**Auth:** Bearer token required (must own the Kundali)

**Description:** Personalized version of the daily transit reading, using the user's saved birth chart's actual Moon sign and Moon Nakshatra — includes the Nakshatra Tara Chakra section that the public endpoint omits.

**Response** `200 OK`: same shape as `GET /kundali/daily-horoscope/`, plus `"kundali_id": <id>` and a populated `tara_chakra`:
```json
{
  "...": "...",
  "birth_nakshatra": "Ashwini",
  "tara_chakra": {
    "distance": 3,
    "category": "Vipat",
    "rating": "bad",
    "meaning": "Obstacles and setbacks are more likely — avoid major decisions and risks."
  },
  "kundali_id": 42
}
```

**Errors:**
- `404 Not Found` — `{"detail": "Not found."}` if the Kundali doesn't exist or isn't owned by the caller.
- `400 Bad Request` — `{"detail": "This Kundali has no recorded Moon sign."}` (only possible on very old/corrupt records).
- `401 Unauthorized`.

> There is currently no Kundali-matching / compatibility (guna milan) endpoint in the codebase — only chart generation, list/detail/delete, AI prediction, and the two daily-horoscope endpoints above exist.

## Panchang

> Mounted at `/api/v1/panchang/`. Only one endpoint exists.

### GET /api/v1/panchang/data/

**Auth:** None (public)

**Description:** Returns Panchang (Nepali/Vedic daily almanac) data — Tithi, Nakshatra, Yoga, Karana, BS date, festivals — for one or more consecutive days. Auto-calculates and caches (persists) a day's data the first time it's requested.

**Query params:**
```
date : string, optional — "YYYY-MM-DD", defaults to today (server date)
days : integer, optional — how many consecutive days starting at `date`, defaults to 1, hard-capped at 31
```

**Response** `200 OK` — array (one entry per day):
```json
[
  {
    "id": 187,
    "date": "2026-08-31",
    "bs_date": "2083-05-15",
    "bs_year": 2083,
    "bs_month": 5,
    "bs_day": 15,
    "tithi": "Panchami",
    "nakshatra": "Rohini",
    "yoga": "Siddhi",
    "karana": "Bava",
    "sunrise": "06:40:00",
    "sunset": "18:20:00",
    "festivals": [],
    "muhurat_hints": "Routine day for puja.",
    "is_holiday": false,
    "created_at": "2026-08-31T00:05:00Z",
    "updated_at": "2026-08-31T00:05:00Z"
  }
]
```

> `PanchangSerializer` uses `fields = '__all__'`, so every model column is exposed as-is above.
> `sunrise`/`sunset` are currently **hardcoded placeholders** (`06:40:00` / `18:20:00`) for every date/location — they are not astronomically computed per day.
> The Tithi/Nakshatra/Yoga calculation uses a fixed 5:30 (Kathmandu-approximate) reference time for the Julian Day, not a per-location sunrise; treat these as Kathmandu-centric readings, not geolocation-aware.
> Once a date's row is computed it is saved via `get_or_create` and reused on subsequent calls for that date — an existing DB row is never recalculated/overwritten even if the calculation logic later changes.

**Errors:** `400 Bad Request` — `{"error": "Invalid date format. Use YYYY-MM-DD."}` if `date` doesn't parse.

## Banners

> Mounted at `/api/v1/banners/`, backed by a DRF `ModelViewSet` + router, so standard REST routes apply (`GET /banners/`, `GET /banners/{id}/`, `POST /banners/`, `PUT/PATCH /banners/{id}/`, `DELETE /banners/{id}/`) alongside two custom actions. `list`, `retrieve`, `active_banners`, `track_view`, `track_click` are public; every other action (create/update/partial_update/destroy) requires an admin (`IsAdminUser` — `is_staff=True`) user.

### GET /api/v1/banners/

**Auth:** None (public)

**Description:** Lists all banners (no status/date filtering — see `active_banners/` for that).

**Response** `200 OK` — array of Banner objects (see shape below).

### GET /api/v1/banners/{id}/

**Auth:** None (public)

**Description:** Retrieve a single banner by ID.

**Response** `200 OK`:
```json
{
  "id": 5,
  "title": "Dashain Special Puja Offer",
  "description": "20% off on all Dashain puja bookings",
  "image_url": "https://res.cloudinary.com/.../banner.jpg",
  "mobile_image_url": "https://res.cloudinary.com/.../banner_mobile.jpg",
  "mobile_image": "https://res.cloudinary.com/.../banner_mobile.jpg",
  "link_url": "/samagri/dashain-kits",
  "link_text": "Shop Now",
  "button_text": "Shop Now",
  "banner_type": "OFFER_BANNER",
  "status": "ACTIVE",
  "discount_percentage": 20,
  "priority_order": 1,
  "priority": 1,
  "background_color": "#FFD700",
  "text_color": "#000000",
  "start_date": "2026-09-01T00:00:00Z",
  "end_date": "2026-09-30T23:59:59Z",
  "view_count": 1240,
  "click_count": 87,
  "created_by": { "id": 3, "...": "UserSerializer fields" },
  "created_at": "2026-08-20T10:00:00Z",
  "updated_at": "2026-08-25T12:00:00Z"
}
```

> `mobile_image` / `button_text` / `priority` are write-friendly aliases (`source=`) for `mobile_image_url` / `link_text` / `priority_order` — both the alias and canonical field name appear in every response and either name can be used when writing.
> `banner_type` is one of `MAIN_BANNER`, `SALE_BANNER`, `FESTIVAL_BANNER`, `OFFER_BANNER`, `DISCOUNT_BANNER`. `status` is one of `ACTIVE`, `INACTIVE`, `SCHEDULED`.
> `discount_percentage` (1–100) is **required** when `banner_type` is `SALE_BANNER`, `OFFER_BANNER`, or `DISCOUNT_BANNER`, and **must be omitted/null** for every other type — enforced both at the serializer and model level.

**Errors:** `404 Not Found` if the ID doesn't exist.

### GET /api/v1/banners/active_banners/

**Auth:** None (public)

**Description:** The endpoint mobile clients should actually use for a home-screen carousel — returns only `status="ACTIVE"` banners whose `start_date`/`end_date` window (if set) includes now, ordered by `priority_order` then newest first.

**Response** `200 OK`: array of Banner objects, same shape as above.

### POST /api/v1/banners/{id}/track_view/

**Auth:** None (public)

**Description:** Increments the banner's `view_count` by 1. Call once when a banner is rendered/shown to a user.

**Response** `200 OK`: `{"status": "view tracked"}`

**Errors:** `404 Not Found` if the banner doesn't exist.

### POST /api/v1/banners/{id}/track_click/

**Auth:** None (public)

**Description:** Increments the banner's `click_count` by 1. Call when a user taps a banner.

**Response** `200 OK`: `{"status": "click tracked"}`

**Errors:** `404 Not Found` if the banner doesn't exist.

### POST /api/v1/banners/

**Auth:** Admin (`is_staff=True`) Bearer token required

**Description:** Create a new banner. `created_by` is set automatically from the requester.

**Request body:** any writable fields from the Banner shape above (`title` required; `image_url` required; `link_url` if present must start with `http://`, `https://`, or `/`; see the `discount_percentage` rule above; `end_date` must be after `start_date` if both are set).

**Response** `201 Created`: the created Banner object.

**Errors:** `400 Bad Request` on validation failure (bad `link_url`, missing/extra `discount_percentage`, `end_date <= start_date`). `401`/`403` if not an admin.

### PUT / PATCH /api/v1/banners/{id}/

**Auth:** Admin required

**Description:** Full or partial update of a banner. `updated_by` is set automatically.

**Errors:** same validation rules as create; `404` if not found; `401`/`403` if not an admin.

### DELETE /api/v1/banners/{id}/

**Auth:** Admin required

**Description:** Permanently deletes a banner.

**Response:** `204 No Content`.

**Errors:** `404 Not Found`; `401`/`403` if not an admin.

## Reviews

> Mounted at `/api/v1/reviews/` (and, for backward compatibility, also `/api/reviews/`). Two kinds of reviews exist in this codebase: **`Review`** — a customer's rating of a **pandit**, tied 1:1 to a completed **booking**; and **`SiteReview`** — a rating of the PanditYatra platform itself, one per user. There is no review object attached to a product/vendor/samagri item.

### POST /api/v1/reviews/create/

**Auth:** Bearer token required

**Description:** Submit a review for a pandit, tied to one of the caller's own bookings.

**Request body:**
```json
{
  "booking": 118,     // required, int — id of a Booking belonging to the caller
  "rating": 5,         // required, int 1-5
  "comment": "Excellent puja, very punctual."  // required, string
}
```

> The serializer only exposes `rating` and `comment` as writable model fields (`professionalism`, `knowledge`, `punctuality` exist on the `Review` model with a default of 5 but are **not** accepted through this endpoint — they can't currently be set by a mobile client). `booking` is read directly off the raw request body, not through the serializer.
> The code checks `booking.status != BookingStatus.COMPLETED` but currently takes no action on that check (it's effectively a no-op) — in practice a review can be created against a non-completed booking today.

**Response** `201 Created`:
```json
{
  "id": 77,
  "customer_name": "Anil Thapa",
  "customer_avatar": "https://.../avatar.jpg",
  "pandit_name": "Ram Prasad Sharma",
  "service_name": "Griha Pravesh Puja",
  "rating": 5,
  "comment": "Excellent puja, very punctual.",
  "created_at": "2026-08-31T09:00:00Z"
}
```

**Errors:**
- `404 Not Found` — the given `booking` id doesn't exist.
- `403 Forbidden` — the booking doesn't belong to the caller, or a review for that booking already exists (`"You can only review your own bookings."` / `"You have already reviewed this booking."`).
- `401 Unauthorized`.

---

### GET /api/v1/reviews/pandit-reviews/

**Auth:** None (public)

**Description:** Recent pandit reviews for a public home-page feed (most recent 20, across all pandits), plus site-wide pandit rating aggregation.

**Response** `200 OK`:
```json
{
  "reviews": [
    {
      "id": 77,
      "customer_name": "Anil Thapa",
      "customer_avatar": "https://.../avatar.jpg",
      "pandit_name": "Ram Prasad Sharma",
      "rating": 5,
      "comment": "Excellent puja, very punctual.",
      "created_at": "2026-08-31T09:00:00Z"
    }
  ],
  "average_rating": 4.7,
  "total_reviews": 312
}
```

---

### GET /api/v1/reviews/my-reviews/

**Auth:** Bearer token required

**Description:** Lists reviews the logged-in user has written (as a customer), newest first.

**Response** `200 OK`: array of objects shaped like `ReviewSerializer` — `{id, customer_name, customer_avatar, pandit_name, service_name, rating, comment, created_at}`.

**Errors:** `401 Unauthorized`.

---

### GET /api/v1/reviews/pandit/my-reviews/

**Auth:** Bearer token required (must be a `pandit`-role account)

**Description:** Lists reviews received by the logged-in pandit.

**Response** `200 OK`: array of `ReviewSerializer` objects (same shape as above). Returns an **empty array** (not an error) if the caller's `role` isn't `"pandit"`.

**Errors:** `401 Unauthorized`.

---

### GET /api/v1/reviews/site-reviews/

**Auth:** None (public)

**Description:** Lists the most recent 30 approved platform ("site") reviews plus a 1-5 star rating breakdown.

**Response** `200 OK`:
```json
{
  "reviews": [
    {
      "id": 14,
      "user_name": "Anil Thapa",
      "user_avatar": "https://.../avatar.jpg",
      "role": "customer",
      "rating": 5,
      "comment": "Great platform, easy to book a pandit.",
      "created_at": "2026-08-30T18:00:00Z"
    }
  ],
  "average_rating": 4.5,
  "total_reviews": 96,
  "breakdown": { "5": 60, "4": 20, "3": 10, "2": 4, "1": 2 }
}
```

### POST /api/v1/reviews/site-reviews/

**Auth:** Bearer token required

**Description:** Submit (or, on a repeat call, update — see below) the caller's platform review. Only one `SiteReview` per user is allowed at the DB level.

**Request body:**
```json
{
  "rating": 5,       // required, int 1-5
  "comment": "..."   // required, string
}
```

> `role` is **not** taken from the request — it's derived server-side from `request.user.role` (falling back to `customer`, then checking for a `pandit_profile`/`vendor_profile` attribute if `role` isn't one of `customer`/`pandit`/`vendor`).
> If the caller already has a `SiteReview`, this call **updates it in place** (partial update) and returns `200 OK` instead of creating a duplicate and returning `201`. A mobile client should treat both status codes as success and simply refresh from the response.

**Response:** `201 Created` (first submission) or `200 OK` (update) — the `SiteReviewSerializer` object: `{id, user_name, user_avatar, role, rating, comment, created_at}`.

**Errors:**
- `401 Unauthorized` — `{"detail": "Authentication required."}` (note: this is a custom 401, not DRF's default, since the view is `AllowAny` at the class level to also serve GET).
- `400 Bad Request` — validation errors from the serializer (e.g. missing `rating`/`comment`, rating out of 1-5).

---

### GET /api/v1/reviews/admin-reviews/

**Auth:** Admin (`is_staff=True`) Bearer token required

**Description:** Admin dashboard endpoint returning both pandit reviews and site reviews together with aggregate stats.

**Query params:** `type` — one of `pandit`, `site`, `all` (default `all`).

**Response** `200 OK`:
```json
{
  "pandit_reviews": [
    {
      "id": 77, "type": "pandit",
      "customer_name": "Anil Thapa", "customer_email": "anilthapa4200@gmail.com",
      "customer_avatar": "https://.../avatar.jpg",
      "pandit_name": "Ram Prasad Sharma",
      "rating": 5, "professionalism": 5, "knowledge": 5, "punctuality": 5,
      "comment": "Excellent puja.",
      "is_verified": false,
      "created_at": "2026-08-31T09:00:00Z",
      "booking_id": 118
    }
  ],
  "site_reviews": [
    {
      "id": 14, "type": "site",
      "user_name": "Anil Thapa", "user_email": "anilthapa4200@gmail.com",
      "user_avatar": "https://.../avatar.jpg",
      "role": "customer", "rating": 5, "comment": "Great platform.",
      "is_approved": true, "created_at": "2026-08-30T18:00:00Z"
    }
  ],
  "stats": { "pandit_avg": 4.7, "pandit_total": 312, "site_avg": 4.5, "site_total": 96 }
}
```

### PATCH /api/v1/reviews/admin-reviews/

**Auth:** Admin required

**Description:** Toggles `is_verified` (pandit review) or `is_approved` (site review) for one review.

**Request body:** `{"type": "pandit" | "site", "id": 77}`

**Response** `200 OK`: `{"status": "ok", "is_verified": true}` or `{"status": "ok", "is_approved": false}`.

**Errors:** `400 Bad Request` — `{"detail": "Invalid type"}` if `type` isn't `pandit`/`site`. `404 Not Found` if the id doesn't exist. `401`/`403` if not admin.

### DELETE /api/v1/reviews/admin-reviews/

**Auth:** Admin required

**Description:** Deletes a pandit or site review.

**Query params:** `type` (`pandit`|`site`), `id`.

**Response:** `204 No Content`.

**Errors:** `400 Bad Request` — `{"detail": "Invalid type"}`. `404 Not Found` if the id doesn't exist. `401`/`403` if not admin.

> There is no self-service delete for a regular user's own review in this codebase — only the admin `DELETE /reviews/admin-reviews/` route can remove a review.
</content>
## Chat

Chat covers two distinct systems that share the `Message`/`ChatMessage` models:

1. **Room-based chat** (`ChatRoom` + `Message`) — persistent customer↔pandit / customer↔vendor conversations, usable both pre-booking and post-booking, with a REST history/send API and a live WebSocket.
2. **Quick Chat / Guide Mode** (`ChatMessage`) — a stateless AI helper chat (see also `## AI Assistant`, which is functionally the same orchestrator).
3. **Puja interaction chat** — a WebSocket-only live chat channel tied to a `Booking`, used during an active puja/video session.

All REST paths below are relative to `/api/v1/chat/`.

### GET /api/v1/chat/rooms/

**Auth:** Required (JWT).
**Description:** List all chat rooms for the current user. Visibility is role-scoped: pandits/vendors see rooms where they are the provider (excluding self-chats); customers see rooms where they are the customer.
**Request:** No body/query params.
**Response:** `200 OK`, plain JSON array (no pagination) of:
```json
[
  {
    "id": 12,
    "booking": 45,
    "order": null,
    "customer": { "id": 3, "username": "ram123", "full_name": "Ram Sharma", "profile_pic": "https://.../pic.jpg" },
    "pandit": { "id": 7, "user": { "id": 7, "username": "pandit_hari", "full_name": "Hari Acharya", "profile_pic": "...", "profile_picture": "..." }, "full_name": "Hari Acharya", "rating": 4.8, "expertise": "Vedic rituals" },
    "vendor": null,
    "user": { "id": 3, "full_name": "Ram Sharma", "profile_pic": "...", "profile_picture": "..." },
    "created_at": "2026-08-20T10:00:00Z",
    "is_active": true,
    "is_pre_booking": false,
    "last_message": "Namaste, see you tomorrow",
    "last_message_time": "2026-08-30T18:22:00Z",
    "unread_count": 2
  }
]
```
> `user` mirrors `customer` — it exists so a pandit/vendor client can render "who I'm talking to" without branching on role. `pandit` and `vendor` are mutually exclusive (a room has at most one of them set).

### GET /api/v1/chat/rooms/{id}/

**Auth:** Required. Only accessible if the requester is the customer, pandit, or vendor on the room.
**Description:** Retrieve a single chat room (same shape as the list item above).
**Errors:** `404` if not found or not a participant (queryset is scoped to the user).

### PATCH /api/v1/chat/rooms/{id}/

**Auth:** Required, same access rule as GET.
**Description:** Partially update a chat room (e.g. `is_active`). Accepts any writable `ChatRoom` field.
**Response:** Updated room object, same shape as above.

### POST /api/v1/chat/rooms/initiate/

**Auth:** Required.
**Description:** Get-or-create a pre-booking chat room with a pandit (before any booking exists).
**Request body:**
```json
{ "pandit_id": 7 }
```
`pandit_id` required.
**Response:** `201 Created` (new room) or `200 OK` (existing room found) — `ChatRoomSerializer` shape as above, with `is_pre_booking: true`.
**Errors:** `400` if `pandit_id` missing; `404` if pandit not found.

### POST /api/v1/chat/rooms/initiate-vendor/

**Auth:** Required.
**Description:** Get-or-create a chat room with a vendor, optionally scoped to a shop order.
**Request body:**
```json
{ "vendor_id": 4, "order_id": 91 }
```
`vendor_id` required, `order_id` optional.
**Response:** `201`/`200` with `ChatRoomSerializer` shape, `is_pre_booking: false`.
**Errors:** `400` if `vendor_id` missing; `404` if vendor or order not found.

### GET /api/v1/chat/rooms/{room_id}/messages/

**Auth:** Required.
**Description:** List all messages in a room, ordered by timestamp ascending. **Side effect:** calling this marks every message not sent by the caller as read (`is_read=True`, `read_at=now`).
**Response:** `200 OK`, plain array of `MessageSerializer`:
```json
[
  {
    "id": 501,
    "chat_room": 12,
    "sender": "pandit",
    "sender_obj": { "id": 7, "username": "pandit_hari", "full_name": "Hari Acharya", "profile_pic": "..." },
    "sender_name": "Hari Acharya",
    "message_type": "TEXT",
    "content": "Namaste, see you tomorrow",
    "content_ne": null,
    "file_url": null,
    "timestamp": "2026-08-30T18:22:00Z",
    "is_read": true
  }
]
```
> `sender` here is a role label (`"user"` / `"pandit"` / `"vendor"`), derived by comparing `sender.id` against `chat_room.pandit`/`chat_room.vendor` — not the numeric user id. Use `sender_obj.id` for the actual user id.

### POST /api/v1/chat/rooms/{room_id}/messages/

**Auth:** Required. Caller must be the customer, pandit, or vendor on the room.
**Description:** Send a message via REST (in addition to the WebSocket path below). Triggers a notification to the recipient.
**Request body:**
```json
{ "content": "Namaste, when should I arrive?", "message_type": "TEXT" }
```
`content` required (string); `message_type` optional, one of `TEXT | IMAGE | FILE | SYSTEM`, defaults to `TEXT`.
**Response:** `201 Created`, single `MessageSerializer` object (shape above).
**Errors:** `403` `{"error": "Access denied"}` if not a room participant; `404` `{"error": "Chat room not found"}`.

### PATCH /api/v1/chat/messages/{id}/mark-read/

**Auth:** Required.
**Description:** Mark a single message as read.
**Request body:** none required (any body is ignored; the view force-sets `is_read=True`).
**Response:** `200 OK`, the updated `MessageSerializer` object.

> Note the endpoint is registered as `UpdateAPIView` — send `PUT` or `PATCH`; both hit the same overridden `update()`.

### GET /api/v1/chat/unread-count/

**Auth:** Required.
**Description:** Total unread message count for the current user across all their rooms (customer, pandit, and vendor roles combined), excluding messages they sent themselves.
**Response:**
```json
{ "unread_count": 5 }
```

### POST /api/v1/chat/quick-chat/  (also aliased at `POST /api/v1/chat/`)

**Auth:** Required.
**Description:** Consolidated "Guide Mode" AI helper chat — identical orchestrator (`AIOrchestrator`) to the AI Assistant endpoints documented below. Not tied to a chat room; used for general app help.
**Throttle scope:** `ai_endpoint` (`30/hour` per user — see `## AI Assistant` for the shared quota system).
**Request body:**
```json
{ "message": "How do I book a puja?" }
```
**Response:** `200 OK` — same payload shape as `POST /api/v1/ai/chat/` (see below).
**Errors:** `400` if `message` empty; `429` on daily AI quota exceeded; `502` `{"error": "The AI guide is temporarily unavailable. Please try again in a moment."}` on upstream failure.

### GET /api/v1/chat/history/

**Auth:** Required.
**Description:** Guide-mode chat history for the current user (`ChatMessage` rows where `mode='guide'`), ordered by timestamp ascending.
**Response:** `200 OK`, array serialized with `MessageSerializer` (note: model mismatch in source — `GuideHistoryView` uses `MessageSerializer`, not `ChatMessageSerializer`, so several fields such as `chat_room`, `sender_obj` will be empty/absent for these rows since `ChatMessage` doesn't have them).

> Mobile clients should treat this endpoint's response shape as unreliable for `ChatMessage`-only fields (`mode`, `booking`, `pandit`) — those exist on the model and in `ChatMessageSerializer` but are not actually returned by this view.

---

### WS /ws/chat/{room_id}/

**Auth:** Ticket-based via `?ticket=<ticket>` query param, minted from `POST /api/v1/ws-ticket/` (30-second single-use ticket; see middleware note below).
**Description:** Real-time messaging for a `ChatRoom`. Connect as:
```
wss://<host>/ws/chat/<room_id>/?ticket=<ticket>
```
On connect the server verifies the user is a participant (customer/pandit/vendor on the room) and immediately pushes the last 50 messages, oldest-first:
```json
{ "type": "message_history", "messages": [ { "id": 501, "sender": "pandit_hari", "sender_id": 7, "content": "...", "content_ne": null, "message_type": "TEXT", "timestamp": "2026-08-30T18:22:00Z", "is_read": false }, ... ] }
```
**Client → server** (send to post a message):
```json
{ "type": "TEXT", "content": "Namaste!", "content_ne": null }
```
**Server → client** (broadcast to all room members, including sender):
```json
{ "id": 502, "sender": "pandit_hari", "sender_id": 7, "content": "Namaste!", "content_ne": null, "message_type": "TEXT", "timestamp": "2026-08-30T18:23:00Z", "is_read": false }
```
On error (e.g. pre-booking message limit hit):
```json
{ "type": "error", "message": "Pre-booking message limit reached (10 msgs/day). Book a puja for unlimited chat!" }
```
> **Pre-booking limit:** non-pandit senders in a room where `is_pre_booking=true` are capped at 10 messages per rolling 24h; pandits are unlimited.
> Connection is rejected (closed) if the user is unauthenticated, the ticket is invalid/expired/already used, or the user isn't a room participant.
> **Reconnect-with-fresh-ticket:** tickets are single-use and expire after 30 seconds, so a dropped connection requires calling `POST /api/v1/ws-ticket/` again before reconnecting — the same ticket cannot be reused.

### WS /ws/puja/{booking_id}/

**Auth:** Ticket-based, same flow as above:
```
wss://<host>/ws/puja/<booking_id>/?ticket=<ticket>
```
**Description:** Live "interaction mode" chat during an active puja, scoped to a `Booking` rather than a `ChatRoom`, persisted to the `ChatMessage` model (`mode='interaction'`). Access is limited to the booking's customer or pandit.
On connect, server sends message history plus a `mode` flag:
```json
{ "type": "message_history", "messages": [ { "id": 90, "sender": "user", "sender_id": 3, "content": "...", "content_ne": null, "message_type": "TEXT", "timestamp": "..." } ], "mode": "interaction" }
```
then broadcasts a join event to the group:
```json
{ "type": "user_joined", "username": "ram123", "user_id": 3 }
```
**Client → server:**
```json
{ "content": "Can you hear me?", "content_ne": null, "message_type": "TEXT" }
```
**Server → client** (broadcast):
```json
{ "type": "message", "data": { "id": 91, "sender": "ram123", "sender_id": 3, "content": "Can you hear me?", "content_ne": null, "message_type": "TEXT", "timestamp": "..." } }
```
On disconnect, all members receive `{ "type": "user_left", "username": "...", "user_id": ... }`.
**Errors over the socket:** `{"error": "Message cannot be empty"}`, `{"error": "Invalid JSON format"}`.

> This is a separate signaling channel from the video-call WebSocket below — `video`'s own consumer also has an in-band `"chat"` message type over the same `ChatMessage` model for use during a live video call, so a given booking's puja chat can arrive through either `/ws/puja/<booking_id>/` or `/ws/video/<room_id>/` depending on which screen the client is on.

---

## AI Assistant

The `ai` app exposes the same `AIOrchestrator` used by Chat's Guide Mode. **These are not streaming endpoints** — despite the name "AI chat," every endpoint here returns a single synchronous JSON response (`rest_framework.response.Response`); there is no `StreamingHttpResponse`, chunked transfer, or Server-Sent Events anywhere in this app. Mobile clients should treat these as ordinary blocking POST requests (expect up to a few seconds latency while the Groq LLM call completes) and render the full reply once the response lands — no incremental/typing-indicator parsing is needed or possible.

All paths below are relative to `/api/v1/ai/`.

### POST /api/v1/ai/chat/

**Auth:** Required.
**Throttle scope:** `ai_endpoint` — `30 requests/hour` per user (DRF `ScopedRateThrottle`, configured in `DEFAULT_THROTTLE_RATES`).
**Description:** Main AI Guide chat endpoint. Handles greetings, canned Q&A ("how to book", "what is kundali", etc.) via rule-based pattern matching, and otherwise calls Groq (`llama`-family model via `GroqClient`) with a tool-calling loop over the app's internal tools (search samagri, recommend puja samagri, find pandits, booking status/list).
**Request body:**
```json
{ "message": "I need samagri for Bratabandha" }
```
`message` required, non-empty string.
**Response:** `200 OK`
```json
{
  "reply": "I prepared puja-specific samagri for Bratabandha...",
  "response": "I prepared puja-specific samagri for Bratabandha...",
  "response_type": "product_list",
  "cards": { "products": [ { "id": 1, "name": "Agarbatti", "quantity": 2, "unit": "pcs", "price": 120, "image": "https://..." } ], "pandits": [], "bookings": [] },
  "products": [ { "id": 1, "name": "Agarbatti", "quantity": 2, "unit": "pcs", "price": 120, "image": "https://..." } ],
  "pandits": [],
  "bookings": [],
  "actions": [],
  "tool_log": [ { "tool": "recommend_puja_samagri", "ok": true, "message": "..." } ],
  "trace_id": "8f2c1a..."
}
```
`response_type` is one of `text | product_list | pandit_list | booking_status | booking_list | mixed`. `reply` and `response` are always identical (kept for backward-compat frontend naming). `products`/`pandits`/`bookings` are flattened copies of `cards.*` for convenience.
**Errors:** `400` `{"error": "Message is required"}`; `429` (quota, see below) — same shape as `enforce_ai_quota`; `500` `{"error": "<exception message>"}` on unhandled failure.

> **Quota enforcement:** every AI-backed endpoint (`ai`, `kundali`, `samagri`, `chat` guide mode) shares one daily-per-user cap read from `PlatformSetting.ai_daily_quota_per_user` (admin-configurable). `AIChatView` checks the `message` body first, *then* quota; `QuickChatView`/chat's guide endpoint checks quota first. On breach, both return:
> ```json
> { "error": "Daily AI usage limit reached. Please try again tomorrow.", "quota": 50, "used": 50 }
> ```
> with status `429`. There is no dedicated "check my quota" GET endpoint — a client can only discover remaining quota by hitting the `429` from an actual chat call.

### POST /api/v1/ai/puja-samagri/

**Auth:** Required.
**Throttle scope:** `ai_endpoint` (same as above).
**Description:** Directly invoke the "recommend puja samagri" tool for a given puja, bypassing the LLM tool-routing loop (used for a dedicated "shop for this puja" UI flow rather than free-text chat).
**Request body:**
```json
{
  "puja_id": 3,
  "location": "ONLINE",
  "budget_preference": "standard",
  "user_notes": "keep it simple",
  "auto_add_alternatives": true,
  "limit": 12
}
```
Only `puja_id` is required; `location` defaults `"ONLINE"`, `budget_preference` defaults `"standard"`, `user_notes` defaults `""`, `auto_add_alternatives` defaults `true`, `limit` defaults `12`.
**Response:** `200 OK` (or `400` if the tool result is not `ok`):
```json
{
  "reply": "I prepared puja-specific samagri for Bratabandha...\nWould you like me to add these to your cart?",
  "response": "same as reply",
  "response_type": "product_list",
  "puja": "Bratabandha",
  "recommended_items": [ { "id": 1, "name": "Agarbatti", "quantity": "2 pcs", "price_npr": 120, "image_url": "https://..." } ],
  "products": [ ... raw product dicts ... ],
  "actions": [],
  "missing_items": [],
  "suggested_alternatives": [],
  "context": { "puja_name": "Bratabandha" }
}
```
**Errors:** `400` `{"error": "puja_id is required"}` or tool-level failure; `500` `{"error": "<exception>"}`.

### GET /api/v1/ai/guide/

**Auth:** None (`AllowAny`).
**Description:** Trivial discovery stub, not a functional endpoint.
**Response:** `200 OK` `{"detail": "Use POST /api/ai/chat/"}`.
> The message text is stale (still references the legacy unversioned `/api/ai/chat/` path, not `/api/v1/ai/chat/`) — treat this endpoint as a no-op placeholder rather than documentation of the real path.

---

## Video Calls

`video` handles WebRTC-based video puja sessions. Rooms are backed by Daily.co (`provider` field, currently always `"daily"`), and signaling is peer-to-peer over a WebSocket rather than through Daily's own client SDK for the newer flow — the older `create-token/` endpoint is kept for a legacy Daily.co-hosted-room path. All paths below are relative to `/api/v1/video/`.

### GET /api/v1/video/ice-servers/

**Auth:** Required.
**Description:** Returns STUN/TURN server config for the mobile WebRTC client, keeping TURN credentials server-side.
**Response:**
```json
{
  "ice_servers": [
    { "urls": ["stun:stun.l.google.com:19302"] },
    { "urls": ["turn:turn.example.com:3478?transport=udp", "turn:turn.example.com:3478?transport=tcp"], "username": "...", "credential": "..." }
  ],
  "turn_enabled": true,
  "issued_at": "2026-08-31T09:00:00Z"
}
```

### POST /api/v1/video/rooms/create/

**Auth:** Required. Caller must be the booking's customer or pandit (`can_access_booking`).
**Description:** Create (or fetch, if already created) the `VideoRoom` for a booking. Validates the booking is `ONLINE`, paid, and `ACCEPTED`/`COMPLETED` before creating.
**Request body:**
```json
{ "booking_id": 45 }
```
**Response:** `201 Created`
```json
{ "room_id": "pandityatra-45-a1b2c3", "room_url": "https://<daily-domain>/pandityatra-45-a1b2c3", "start_time": "2026-08-31T14:00:00Z" }
```
**Errors:** `400` `{"error": "booking_id is required"}` or validation reason (e.g. `"Booking payment is not completed"`, `"Booking must be accepted before joining video room"`); `403` `{"error": "Not authorized"}`; `404` if booking not found.

### GET / PATCH /api/v1/video/rooms/{room_id}/

`room_id` accepts either the numeric `VideoRoom` PK or its `room_name` slug.
**Auth:** Required, same booking-access check as above.
**Description:** GET fetches full room detail; PATCH updates `status`/`recording_url`/`ended_at`. GET also enforces the join time window (see below).
**Request body (PATCH only):**
```json
{ "status": "live" }
```
Any subset of `status | recording_url | ended_at`.
**Response:**
```json
{
  "room_id": "pandityatra-45-a1b2c3",
  "booking_id": 45,
  "room_url": "https://...",
  "status": "live",
  "provider": "daily",
  "start_time": "2026-08-31T14:00:00Z",
  "created_at": "2026-08-30T10:00:00Z",
  "ended_at": null,
  "recording_url": null,
  "participants": [
    { "user_id": 3, "username": "ram123", "role": "customer", "is_host": false, "joined_at": "2026-08-31T14:00:05Z", "left_at": null }
  ]
}
```
`status` is one of `scheduled | live | ended`.
**Errors:** `403` `{"error": "Not authorized", "code": "unauthorized"}`; `400` with `code` in `{"config_missing", "cancelled", "expired"}` if outside the join window (window = booking start time up to +4 hours, or booking cancelled); `500` on serialization failure.

### GET /api/v1/video/{room_id}/validate/

**Auth:** Required, same access rule.
**Description:** Lightweight pre-join check — validates booking video-eligibility and the time window without returning full room detail. Intended to be polled/checked right before opening the call UI.
**Response:** `200 OK`
```json
{ "valid": true, "room_id": "pandityatra-45-a1b2c3", "booking_id": 45, "status": "scheduled", "start_time": "2026-08-31T14:00:00Z", "timezone": "Asia/Kathmandu" }
```
**Errors:** all return `200`-shaped bodies with `"valid": false` at non-200 statuses: `403` not authorized, `400` `{"valid": false, "reason": "...", "code": "config_missing"|"cancelled"|"expired"}`, `404` `{"valid": false, "reason": "Room not found"}`.

### POST /api/v1/video/rooms/{room_id}/start/

**Auth:** Required, booking access.
**Description:** Marks the room `live` and stamps `booking.puja_start_time` (only on first call).
**Response:** `{ "success": true, "room_status": "live", "started_at": "2026-08-31T14:00:03Z" }`

### POST /api/v1/video/rooms/{room_id}/end/

**Auth:** Required, booking access.
**Description:** Marks the room `ended`, stamps `ended_at` on the room and `puja_end_time` on the booking.
**Response:** `{ "success": true, "room_status": "ended", "ended_at": "2026-08-31T15:10:00Z" }`

### POST /api/v1/video/rooms/{room_id}/upload-recording/

**Auth:** Required, booking access.
**Description:** Attach a recording to the room/booking, either by URL or direct file upload.
**Request body:** `multipart/form-data` with either `recording` (file) or JSON `{"recording_url": "https://..."}`.
**Response:** `{ "success": true, "recording_url": "https://..." }`
**Errors:** `400` if neither provided; `403` if not authorized.

### POST /api/v1/video/rooms/{room_id}/upload-recording-chunk/

**Auth:** Required, booking access.
**Description:** Chunked recording upload (for `MediaRecorder`-style incremental capture on mobile/web).
**Request body:** `multipart/form-data`: `upload_id` (str), `chunk_index` (int), `total_chunks` (int), `chunk` (file part).
**Response:** `202 Accepted` `{ "success": true, "upload_id": "...", "chunk_index": 3, "total_chunks": 10 }`
**Errors:** `400` on missing fields or invalid indices.

### POST /api/v1/video/rooms/{room_id}/finalize-recording/

**Auth:** Required, booking access.
**Description:** Merge previously uploaded chunks into a final recording file and attach it to the room/booking (triggers `notify_recording_ready_review`).
**Request body:** `{ "upload_id": "...", "total_chunks": 10, "extension": "webm" }` (`extension` optional, one of `webm|mp4|mkv`, defaults `webm`).
**Response:** `201 Created` `{ "success": true, "recording_url": "https://..." }`
**Errors:** `400` if chunks missing (`{"error": "Some chunks are missing", "missing": [...], "missing_count": n}`) or bad params.

### GET /api/v1/video/history/

**Auth:** Required.
**Description:** List the current user's completed (`status="ended"`) video calls.
**Response:** `200 OK`, array:
```json
[
  {
    "id": 8,
    "booking_id": 45,
    "puja_name": "Bratabandha",
    "date": "2026-08-31",
    "start_time": "14:00:00",
    "partner_name": "Hari Acharya",
    "duration_seconds": 3720,
    "status": "COMPLETED",
    "recording_url": "https://...",
    "created_at": "2026-08-30T10:00:00Z",
    "ended_at": "2026-08-31T15:10:00Z"
  }
]
```

### Legacy Daily.co endpoints (kept for backward compatibility)

- `GET /api/v1/video/room/{booking_id}/` — returns `{room_name, room_url, status, recording_url}` for a booking (auto-creates the room).
- `POST /api/v1/video/create-token/` — body `{"booking_id": 45}`; returns `{"token": "...", "room_url": "...", "is_owner": true}`, a Daily.co meeting token (for the older Daily-hosted-UI flow, not the custom WebRTC signaling flow below). `500` `{"error": "Failed to generate token"}` if Daily API fails.
- `POST /api/v1/video/room/{booking_id}/join/` — deprecated alias that re-routes into `create-token/`.
- `POST /api/v1/video/generate-link/{booking_id}/` — manually (re-)trigger room creation if it previously failed; body none required. `503` on config error, `500` on other failure.
- `POST /api/v1/video/webhook/` — `AllowAny`, Daily.co server-to-server webhook receiver (handles `recording.ready` events); not a mobile-client endpoint.

> Rate/billing: there is **no separate call-rate or billing endpoint** in this app — video puja access is gated purely by the booking's payment/status fields (`payment_status`, `status in {ACCEPTED, COMPLETED}`), checked inline in `create_room_auto`/`validate_room_access`. Pricing itself lives entirely in the `bookings`/`payments` apps, not here.

---

### WS /ws/video/{room_id}/

**Auth:** Ticket-based via `?ticket=<ticket>` query param, minted from `POST /api/v1/ws-ticket/`:
```
wss://<host>/ws/video/<room_id>/?ticket=<ticket>
```
`room_id` accepts either the numeric `VideoRoom` PK or its `room_name` slug.
**Description:** Custom WebRTC signaling channel (offer/answer/ICE exchange) plus an in-band text chat for the call, and live participant-count tracking used to auto-trigger Daily.co server-side recording once both sides have joined.

On connect, server responds:
```json
{
  "type": "connected",
  "room_id": "pandityatra-45-a1b2c3",
  "resolved_room_id": 8,
  "user_id": 3,
  "username": "ram123",
  "is_waiting": true,
  "peer_role": "pandit",
  "peer_name": "Hari Acharya"
}
```
then immediately:
```json
{ "type": "chat-history", "messages": [ { "chat_id": 12, "message": "...", "user_id": 3, "username": "ram123", "sender": "user", "booking_id": 45, "timestamp": "..." } ] }
```
then broadcasts to the group: `{ "type": "participant-joined", "user_id": 3, "username": "ram123" }`. If this makes 2 active participants, everyone additionally receives `{ "type": "call-started", "message": "Both participants joined. Puja starting...", "timestamp": "..." }` and server-side recording is triggered if `DAILY_ENABLE_RECORDING` is on.

**Client → server** message `type` must be one of `join | offer | answer | ice-candidate | chat | leave | heartbeat`:
```json
{ "type": "offer", "target_user_id": 7, "sdp": { "...": "..." } }
{ "type": "ice-candidate", "target_user_id": 7, "candidate": { "...": "..." } }
{ "type": "chat", "message": "Can you hear me?" }
{ "type": "heartbeat" }
```
`join`/`offer`/`answer`/`ice-candidate` are relayed to the room group verbatim (with `user_id`, `username`, `timestamp` added server-side) as:
```json
{ "type": "offer", "user_id": 3, "username": "ram123", "target_user_id": 7, "sdp": {...}, "candidate": null, "message": null, "timestamp": "..." }
```
`chat` (max 2000 chars, persisted to `ChatMessage` with `mode="interaction"`) broadcasts:
```json
{ "type": "chat", "chat_id": 13, "message": "Can you hear me?", "user_id": 3, "username": "ram123", "sender": "user", "booking_id": 45, "timestamp": "..." }
```
`heartbeat` gets a direct (non-broadcast) `{ "type": "heartbeat-ack", "timestamp": "..." }` reply. `leave` closes the socket (code `1000`).
On disconnect, the group receives `{ "type": "participant-left", "user_id": 3, "username": "ram123" }`.
**Close codes:** `4401` unauthenticated, `4404` room not found, `4403` not authorized (not the booking's customer/pandit/staff).
**Errors over the socket:** `{"type": "error", "message": "Invalid JSON payload"}`, `{"type": "error", "message": "Unsupported signaling type"}`, `{"type": "error", "message": "Chat message cannot be empty"}`, `{"type": "error", "message": "Chat message too long"}`.

> `target_user_id` is advisory only — the server broadcasts every signaling message to the whole room group (`group_send`), it does not route point-to-point; clients must filter by `target_user_id`/`user_id` themselves in a >2-party scenario (though in practice rooms are always 2 participants: one customer, one pandit).

---

## Notifications

All REST paths below are relative to `/api/v1/notifications/`.

### GET /api/v1/notifications/

**Auth:** Required.
**Description:** List all notifications for the current user, newest first (model default ordering `-created_at`). No pagination or filter query params are implemented server-side.
**Response:** `200 OK`, plain array:
```json
[
  {
    "id": 210,
    "notification_type": "BOOKING_ACCEPTED",
    "type": "booking",
    "title": "Booking Accepted",
    "title_ne": null,
    "message": "Hari Acharya accepted your booking for Bratabandha",
    "message_ne": null,
    "booking": 45,
    "is_read": false,
    "read_at": null,
    "created_at": "2026-08-31T09:00:00Z",
    "user_timezone": "Asia/Kathmandu",
    "action_url": "/my-bookings"
  }
]
```
`type` is a coarse frontend category derived from `notification_type` (`booking | payment | message | review | system | reminder | puja`). `action_url` is derived server-side: `/video/room/{booking_id}` for `PUJA_ROOM_READY`/`VIDEO_CALL_INCOMING`, `/my-bookings/{booking_id}?tab=recording-review` for `RECORDING_READY_REVIEW`, `/my-bookings` for any other type with a `booking`, else `null`.

### POST /api/v1/notifications/

**Auth:** Required.
**Description:** Create a notification (server-side/admin use — `user` is force-set to `request.user`, so this cannot notify another user). Not typically called by mobile clients.
**Request body:** any writable `Notification` fields, e.g. `{"notification_type": "REMINDER", "title": "...", "message": "..."}`.
**Response:** `201 Created`, same shape as list item.

### GET /api/v1/notifications/{id}/

**Auth:** Required, scoped to own notifications.
**Response:** single notification object (shape as above). `404` if not found/not owned.

### PATCH /api/v1/notifications/{id}/

**Auth:** Required, scoped to own notifications.
**Description:** Update a notification — used by clients to mark one as read.
**Request body:**
```json
{ "is_read": true }
```
Setting `is_read: true` stamps `read_at` server-side.
**Response:** updated object.

### DELETE /api/v1/notifications/{id}/

**Auth:** Required, scoped to own notifications.
**Response:** `204 No Content`.

### POST /api/v1/notifications/mark-all-read/

**Auth:** Required.
**Description:** Marks every unread notification belonging to the current user as read.
**Response:** `200 OK` `{ "status": "all notifications marked as read" }`.

### GET / POST / DELETE /api/v1/notifications/push-token/

**Auth:** Required.
**Description:** Register/list/deactivate a device push token — this is the FCM/APNs (and web-push) registration endpoint.
- `GET` — lists the caller's active tokens: `[{ "id": 1, "token": "...", "device_type": "android", "endpoint": null, "subscription": null, "is_active": true, "updated_at": "..." }]`.
- `POST` — upsert (by `user` + `token`) via `update_or_create`. Request body:
```json
{ "token": "fcm-device-token-abc123", "device_type": "android", "endpoint": null, "subscription": null }
```
`token` required. `device_type` one of `web | android | ios`, default `web`. **`subscription` is required when `device_type == "web"`** (web-push endpoint/keys payload) — not required for `android`/`ios` (native FCM/APNs token registration only needs `token`). `endpoint` is a URL, used for web-push.
Response: `200 OK`, the created/updated token object.
- `DELETE` — deactivate a token (soft-delete, `is_active=False`). Body: `{"token": "..."}`. Response: `{"deactivated": 1}`.
**Errors:** `400` `{"subscription": ["Web device requires subscription payload."]}` if a web token omits `subscription`; `400` `{"detail": "token is required"}` on DELETE without a token.

### GET /api/v1/notifications/vapid-key/

**Auth:** Required.
**Description:** Returns the VAPID public key needed to create a browser `PushSubscription` for Web Push. Not needed for native FCM/APNs (mobile) clients — only relevant if the mobile client is a PWA/webview using the browser Push API.
**Response:** `{ "vapid_public_key": "BF3...base64url..." }`.

> **Real-time delivery mechanism:** despite a `NotificationConsumer` class existing in `chat/consumers.py` (group name `notifications_{user_id}`, message type `notification_message`), **it is not wired into any routing table** — `chat/routing.py`'s `websocket_urlpatterns` only registers `ws/chat/` and `ws/puja/`, and `asgi.py` only includes `chat`, `video`, and `bug_reports` routing modules. There is currently **no live `/ws/notifications/` endpoint** to connect to. Real-time push delivery instead goes out via Web Push (`pywebpush`, using the registered `subscription` + VAPID keys) for `device_type="web"` tokens; there is no FCM/APNs *sending* implementation visible in this app (only *registration* of `android`/`ios` tokens) — mobile push send integration appears to be pending/handled elsewhere. Mobile clients should poll `GET /api/v1/notifications/` (or rely on push once that plumbing exists) rather than assuming a notifications WebSocket.

---

## Shared: WebSocket ticket auth

Every WebSocket endpoint above (`/ws/chat/...`, `/ws/puja/...`, `/ws/video/...`) uses the same short-lived ticket flow, implemented once in `chat/middleware.py` (`WSTicketAuthMiddleware`, wrapping all Channels routing in `asgi.py`):

1. `POST /api/v1/ws-ticket/` (`Authorization: Bearer <access token>` required) → `200 OK` `{ "ticket": "<url-safe token>" }`. The ticket is cached server-side (`ws_ticket:<ticket>` → `user_id`) with a **30-second TTL**.
2. Connect: `wss://<host>/ws/<...>/?ticket=<ticket>`.
3. The ticket is deleted from cache on first use (single-use), regardless of whether the subsequent connection succeeds — a ticket cannot be reused even after a failed/rejected connection.

> Browsers/mobile WebSocket clients can't attach custom `Authorization` headers to the handshake, so the long-lived JWT is never put in the URL (which would otherwise leak into proxy/server access logs); this ticket indirection is the reason. **Any reconnect — including automatic reconnect-on-drop logic in a mobile client — must mint a fresh ticket first**; reusing an old ticket or querystring will always fail auth (socket closes immediately, `scope['user']` resolves to `AnonymousUser`).
</content>
## Admin Dashboard

> Mounted from `adminpanel/urls.py` under `path('admin/', include('adminpanel.urls'))` in `pandityatra_backend/urls_v1.py`. All endpoints in this file use the custom `IsAdmin` permission (`users.permissions.IsAdmin`), which allows the request if `request.user.is_superuser` **or** `request.user.is_staff` **or** `request.user.role in ('admin', 'superadmin')`. This is distinct from Django's built-in `IsAdminUser` (staff-only) used by `bug_reports` below.

#### GET /api/v1/admin/dashboard/

**Auth:** Admin only (`IsAdmin` — superuser, staff, or role `admin`/`superadmin`)

**Description:** High-level platform counters for the admin dashboard landing page.

**Request body / query params:** None.

**Response:**
```json
{
  "total_users": 1240,
  "total_pandits": 87,
  "pending_pandits": 5,
  "total_bookings": 3021,
  "total_vendors": 34,
  "pending_vendors": 2,
  "system_status": "OK"
}
```

**Errors:** `401` not authenticated, `403` authenticated but not admin.

---

#### GET /api/v1/admin/analytics/deep/

**Auth:** Admin only (`IsAdmin`)

**Description:** Deep platform analytics — revenue, popular pujas, pandit performance, geographic and user-behavior breakdowns — for the admin analytics dashboard.

**Request body / query params:** None.

**Response:**
```json
{
  "overview": {
    "totalUsers": 1240,
    "totalBookings": 2011,
    "totalRevenue": 452300.0,
    "averageRating": 4.6,
    "growthRate": 12.5
  },
  "revenueAnalytics": {
    "monthly": [
      { "month": "Jan", "revenue": 38000.0, "bookings": 210 }
    ],
    "averageOrderValue": 225.0
  },
  "bookingAnalytics": {
    "byPuja": [
      { "puja": "Satyanarayan Puja", "count": 120, "popularity": 100 }
    ],
    "byLocation": [
      { "location": "ONLINE", "count": 900, "revenue": 0 },
      { "location": "HOME", "count": 1111, "revenue": 0 }
    ]
  },
  "panditPerformance": {
    "topPandits": [
      { "name": "Ram Sharma", "bookings": 55, "rating": 4.9, "revenue": 12500.0 }
    ]
  },
  "geographicData": {
    "countries": [ { "country": "Nepal", "users": 1240, "revenue": 452300.0 } ],
    "timezones": [ { "timezone": "Asia/Kathmandu", "users": 1240, "peakHours": ["09:00", "18:00"] } ]
  },
  "userBehavior": {
    "userFlow": [
      { "step": "Landing", "users": 2480, "dropoffRate": 0 },
      { "step": "Browse", "users": 1860, "dropoffRate": 25 },
      { "step": "Booking", "users": 2011, "dropoffRate": 20 }
    ],
    "conversionRate": 81.1
  }
}
```

> `averageRating` falls back to a hardcoded `4.5` when there are no verified pandits with ratings. `growthRate` (`12.5`) is currently a static placeholder in the view, not a computed value — treat it as illustrative only.

**Errors:** `401`, `403`.

---

## Activity Logs

#### GET /api/v1/admin/activity-logs/

**Auth:** Admin only (`IsAdmin`)

**Description:** Lists system activity events (logins, profile views, bookings, payments, video calls, reviews, etc.) recorded by the `ActivityLog` model, for admin audit/review.

**Request body / query params (all optional, combinable):**
| Param | Type | Notes |
|---|---|---|
| `user` | integer | Filter by acting user's ID |
| `pandit` | integer | Filter by acting pandit's ID (`PanditUser` ID) |
| `action_type` | string | Case-insensitive exact match, e.g. `LOGIN`, `VIEW_PROFILE`, `BOOKING`, `PAYMENT`, `VIDEO_CALL`, `REVIEW` |
| `date` | string (`YYYY-MM-DD`) | Filters on `created_at`'s date component |

> No `page`/`limit` params exist — the queryset is hard-capped at the **500** most recent matching rows (`queryset[:500]`, already ordered `-created_at` via model `Meta.ordering`). There is no cursor/offset pagination and no total-count field in the response; it is a bare JSON array.

**Response:** JSON array of:
```json
[
  {
    "id": 501,
    "action_type": "BOOKING",
    "details": "Booked Satyanarayan Puja with Pandit Ram Sharma",
    "ip_address": "203.0.113.4",
    "operating_system": "Android",
    "browser": "Chrome Mobile",
    "device_type": "mobile",
    "country": "Nepal",
    "city": "Kathmandu",
    "created_at": "2026-08-30T09:12:44Z",
    "actor_name": "Anil Thapa",
    "actor_email": "anil@example.com",
    "pandit_name": ""
  }
]
```

**Errors:** `401`, `403`.

---

## Error Logs

#### GET /api/v1/admin/error-logs/

**Auth:** Admin only (`IsAdmin`)

**Description:** Lists backend payment/booking/webhook/refund error records (`PaymentErrorLog`) for admin troubleshooting.

**Request body / query params:** None supported — no filters, no pagination params.

> Response is capped at the **200** most recent logs (`.order_by("-created_at")[:200]`), returned as a bare JSON array — no page/count metadata.

**Response:**
```json
[
  {
    "id": 88,
    "error_type": "PAYMENT",
    "user": "anilthapa4200@gmail.com",
    "booking_id": 1042,
    "payment_id": 77,
    "message": "eSewa signature verification failed",
    "context": { "gateway": "esewa", "txn_id": "000ABC123" },
    "resolved": false,
    "created_at": "2026-08-29T14:02:11Z",
    "resolved_at": null,
    "admin_note": null
  }
]
```
`error_type` is one of `PAYMENT`, `WEBHOOK`, `BOOKING`, `REFUND`. `user` is the related user's email, or `null` if the user was deleted or unknown.

**Errors:** `401`, `403`.

---

#### POST /api/v1/admin/error-logs/

**Auth:** Admin only (`IsAdmin`)

**Description:** Marks an error log resolved and/or attaches an admin note. Uses the same `/api/v1/admin/error-logs/` path as the GET listing above (method distinguishes the operation — this is **not** a REST detail-URL update).

**Request body:**
```json
{
  "id": 88,
  "resolved": true,
  "admin_note": "Retried webhook manually, confirmed payment settled."
}
```
| Field | Type | Required |
|---|---|---|
| `id` | integer | Yes |
| `resolved` | boolean | Optional — when truthy, also stamps `resolved_at = now()` |
| `admin_note` | string | Optional |

**Response:**
```json
{ "success": true }
```

**Errors:**
- `404` — `{ "error": "Log not found" }` when `id` doesn't match a `PaymentErrorLog`.
- `401`, `403` as above.

---

## AI Usage & Quota

> Backed by `ai.models.AIQueryLog` (per-call audit rows written across the `ai`, `kundali`, `samagri`, and `chat` AI-backed endpoints) and the singleton `users.models.PlatformSetting` row (`ai_daily_quota_per_user`, default `50`).

#### GET /api/v1/admin/ai-usage/

**Auth:** Admin only (`IsAdmin`)

**Description:** AI usage/rate-limit dashboard — today's per-user call counts, error counts, and average latency, plus a 7-day rollup by mode, alongside the currently configured quota and throttle rate.

**Request body / query params:** None.

**Response:**
```json
{
  "quota": {
    "ai_daily_quota_per_user": 50,
    "throttle_rate": "30/hour"
  },
  "today": {
    "total_calls": 312,
    "total_errors": 4,
    "unique_users": 58,
    "per_user": [
      {
        "user_id": 12,
        "name": "Anil Thapa",
        "calls": 41,
        "errors": 0,
        "avg_latency_ms": 820,
        "over_quota": false
      }
    ]
  },
  "last_7_days": {
    "total_calls": 1980,
    "total_errors": 27,
    "by_mode": [
      { "mode": "guide", "calls": 1400 },
      { "mode": "kundali", "calls": 380 }
    ]
  }
}
```
`per_user` is capped at the top 50 users by call count for the current day (`[:50]`), ordered descending by `calls`. `name` falls back to the user's email when `full_name` is blank. `throttle_rate` reflects `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES["ai_endpoint"]` (currently `"30/hour"` in settings).

**Errors:** `401`, `403`.

---

#### GET /api/v1/admin/ai-quota/

**Auth:** Admin only (`IsAdmin`)

**Description:** Returns the current platform-wide daily AI request quota per user.

**Request body / query params:** None.

**Response:**
```json
{ "ai_daily_quota_per_user": 50 }
```

**Errors:** `401`, `403`.

---

#### PATCH /api/v1/admin/ai-quota/

**Auth:** Admin only (`IsAdmin`)

**Description:** Updates the platform-wide daily AI request quota per user. GET and PATCH share the single `/api/v1/admin/ai-quota/` URL — no separate `/reset` sub-path or ID segment.

**Request body:**
```json
{ "ai_daily_quota_per_user": 75 }
```
| Field | Type | Required |
|---|---|---|
| `ai_daily_quota_per_user` | integer (must be ≥ 1) | Yes |

**Response:** (same shape as GET, reflecting the new value)
```json
{ "ai_daily_quota_per_user": 75 }
```

**Errors:**
- `400` — `{ "error": "ai_daily_quota_per_user must be a positive integer" }` when the value is missing, non-numeric, or < 1.
- `401`, `403` as above.

---

## Bug Reports

> Mounted from `bug_reports/urls.py` under `path('bug-reports/', include('bug_reports.urls'))`. Uses a DRF `DefaultRouter` with two registrations: `reports` (full `ModelViewSet`, basename `bug-report`) and `admin/reports` (`ReadOnlyModelViewSet`, basename `admin-bug-report`) — giving the two distinct URL families below. Note the auth split: the user-facing `reports` endpoints require plain `permissions.IsAuthenticated`, while `update_status` and the entire `admin/reports` family require DRF's built-in `permissions.IsAdminUser` (checks `request.user.is_staff` only — **not** the custom role-aware `IsAdmin` used by `adminpanel`).

#### POST /api/v1/bug-reports/reports/

**Auth:** Bearer token required (any authenticated user)

**Description:** Submit a new bug report. Multipart form data (for optional attachment) or JSON is accepted.

**Request body:**
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `description` | string | Yes |
| `category` | string, one of `UI`, `FUNCTIONAL`, `PERFORMANCE`, `SECURITY`, `TEXT_ISSUE`, `INTEGRATION`, `OTHER` | Optional (default `OTHER`) |
| `severity` | string, one of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Optional (default `MEDIUM`) |
| `attachment` | file (image or PDF; Cloudinary-backed, `resource_type=auto`) | Optional |

`reported_by`, `status`, and `admin_comment` are server-set/read-only and ignored if sent by the client.

**Response:** `201 Created`
```json
{
  "id": 214,
  "title": "Payment button unresponsive on checkout",
  "description": "Tapping Pay does nothing on Android 14 / Chrome.",
  "category": "FUNCTIONAL",
  "severity": "HIGH",
  "attachment": "bug_reports/xyz123",
  "attachment_url": "https://res.cloudinary.com/.../bug_reports/xyz123.png",
  "status": "NEW",
  "reported_by": 12,
  "reported_by_detail": { "...": "nested user object, see Users section" },
  "admin_comment": null,
  "created_at": "2026-08-31T05:10:02Z",
  "updated_at": "2026-08-31T05:10:02Z"
}
```

> Submitting also triggers a real-time WebSocket toast to admins connected to the `admin_notifications` group and creates a persistent `NEW_BUG_REPORT` notification for all admins — failures in either notification path are swallowed and never surface to the reporting user.

**Errors:** `400` validation errors (missing `title`/`description`), `401` not authenticated.

---

#### GET /api/v1/bug-reports/reports/

**Auth:** Bearer token required (any authenticated user)

**Description:** Lists bug reports. Regular users see only their own reports (`reported_by=request.user`); users with `role == "admin"` or `is_superuser` see all reports.

**Request body / query params:** None (no built-in filtering/pagination on this route — `DEFAULT_PAGINATION_CLASS` is unset project-wide, so this returns the full unpaginated list as a bare JSON array).

**Response:** JSON array of the same object shape shown in the POST response above.

**Errors:** `401`.

---

#### GET /api/v1/bug-reports/reports/{id}/

**Auth:** Bearer token required

**Description:** Retrieve a single bug report. Subject to the same visibility rule as the list endpoint (non-admins can only fetch their own report — otherwise `404`, since it's filtered out of `get_queryset()` rather than checked via object permission).

**Response:** Single bug report object (same shape as above).

**Errors:** `401`, `404` (not found or not owned).

---

#### PATCH /api/v1/bug-reports/reports/{id}/

**Auth:** Bearer token required

**Description:** Partially update a bug report. Because `status`, `admin_comment`, `reported_by`, `created_at`, and `updated_at` are all `read_only_fields` on `BugReportSerializer`, an owner can effectively only edit `title`, `description`, `category`, `severity`, and `attachment`. (`PUT` is also available via the same route and behaves identically, minus partial-update semantics.)

**Request body:** Any subset of `title`, `description`, `category`, `severity`, `attachment`.

**Response:** Updated bug report object.

**Errors:** `400` validation, `401`, `404`.

---

#### DELETE /api/v1/bug-reports/reports/{id}/

**Auth:** Bearer token required

**Description:** Delete a bug report (standard `ModelViewSet` destroy — available to the owner or any admin per `get_queryset()` visibility).

**Response:** `204 No Content`.

**Errors:** `401`, `404`.

---

#### PATCH /api/v1/bug-reports/reports/{id}/update_status/

**Auth:** Admin only — DRF `IsAdminUser` (`request.user.is_staff` must be `True`; role-only `admin` accounts without `is_staff` are rejected)

**Description:** Admin action to change a bug report's status and/or leave an admin comment. This is a custom `@action(detail=True, methods=["patch"])` route, distinct from the generic detail PATCH above (which cannot touch `status`/`admin_comment` due to `read_only_fields`).

**Request body:**
```json
{ "status": "IN_PROGRESS", "admin_comment": "Reproduced on Android 14, investigating." }
```
| Field | Type | Required |
|---|---|---|
| `status` | string, one of `NEW`, `IN_PROGRESS`, `RESOLVED` | Optional |
| `admin_comment` | string | Optional |

**Response:** `200 OK` — updated `{ "status": ..., "admin_comment": ... }` (only the two fields defined on `AdminBugReportUpdateSerializer`).

**Errors:** `400` invalid `status` value, `401`, `403` (non-staff), `404`.

---

#### GET /api/v1/bug-reports/admin/reports/

**Auth:** Admin only — DRF `IsAdminUser` (`is_staff` required)

**Description:** Admin-facing read-only listing of all bug reports across all users, via the separate `AdminBugReportViewSet`.

**Request body / query params:**
| Param | Type | Notes |
|---|---|---|
| `status` | string, one of `NEW`, `IN_PROGRESS`, `RESOLVED` | Optional exact-match filter |

> Also unpaginated (no project-wide `DEFAULT_PAGINATION_CLASS`) — returns every matching row as a bare JSON array.

**Response:** JSON array of full bug report objects (same shape as the POST response above, including `reported_by_detail`).

**Errors:** `401`, `403` (non-staff).

---

#### GET /api/v1/bug-reports/admin/reports/{id}/

**Auth:** Admin only — DRF `IsAdminUser`

**Description:** Admin retrieve of a single bug report by ID, unrestricted by ownership.

**Response:** Single bug report object.

**Errors:** `401`, `403`, `404`.
</content>
