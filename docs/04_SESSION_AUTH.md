# Amoura --- Session and Authentication Audit

## Authentication architecture

``` text
Google Identity
   |
   | Google ID token
   v
POST /api/auth/google
   |
   | verify Google token
   v
Find/create user
   |
   | JWT
   v
auth_token cookie
   |
   v
Authenticated API requests
```

## Google login

Frontend:

`client/src/components/Auth/GoogleloginButton.vue`

Calls:

``` text
POST /api/auth/google
```

The backend verifies the Google ID token using `google-auth-library`.

## JWT

`server/utils/jwt.ts`

-   algorithm: HS256
-   expiry: 3 hours
-   payload: `{ userId }`
-   secret: `JWT_SECRET`

The token is stored in the `auth_token` cookie.

## Auth middleware

`server/middlewares/authMiddleware.ts`

Reads:

``` text
req.cookies.auth_token
```

Then verifies JWT and puts the decoded value on:

``` text
req.user
```

## Session restoration

The router is the main session restoration mechanism.

For `/app` and `/registration` navigation:

1.  request browser geolocation
2.  if denied/unavailable, show warning
3.  compare current location with localStorage location
4.  if movement exceeds 50km, send new coordinates
5.  call `/api/auth/me`
6.  hydrate user store
7.  persist returned location
8.  route based on whether a profile exists

## Location cache

Key:

``` text
localStorage["location"]
```

Structure:

``` json
{
  "latitude": "...",
  "longitude": "..."
}
```

Threshold:

``` text
50,000 meters
```

## Route decisions

For `/app`:

-   auth failure → `/`
-   authenticated with profile → allow
-   authenticated without profile → `/registration`

For `/registration`:

-   authenticated without profile → allow
-   authenticated with profile → `/app`

## Logout

Frontend calls:

``` text
POST /api/auth/logout
```

Then local user state is cleared/navigation proceeds.

## Session migration rule

Do not move the auth token into localStorage just because React makes it
convenient.

The current design is cookie-based and the migration should preserve
that.

## Important browser lifecycle behavior

The main application flushes pending feed actions on:

-   `beforeunload`
-   `visibilitychange` when hidden

This is not authentication logic but is part of the session/page
lifecycle and must survive migration.

## Security observations

-   JWT is cookie-based, which is preferable to exposing the token in
    localStorage.
-   The exact cookie flags should be verified in the backend controller
    before production hardening.
-   The uploaded repository contains `.env` files; secrets should not be
    carried into migration artifacts.
