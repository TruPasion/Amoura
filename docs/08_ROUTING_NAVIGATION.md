# Amoura --- Routing and Navigation Audit

## Routes

  Path              Component      Access
  ----------------- -------------- ----------------------------
  `/`               LandingPage    public
  `/terms`          LandingPage    public
  `/privacy`        LandingPage    public
  `/refund`         LandingPage    public
  `/userguide`      LandingPage    public
  `/app`            Home           authenticated + profile
  `/registration`   Registration   authenticated + no profile

## Route guard 1 --- unsaved profile

Before navigation:

``` text
if hasUnsavedChanges && openProfile:
    window.confirm(...)
```

Cancel blocks navigation.

Confirm allows navigation.

## Route guard 2 --- authenticated application routes

For `/app` and `/registration`:

1.  request geolocation
2.  show warning if location access fails
3.  compare with cached location
4.  refresh server location if moved \>50km
5.  POST `/api/auth/me`
6.  populate user store
7.  cache returned location
8.  redirect according to profile existence

## Navigation state outside router

Action store also manages:

-   open profile
-   open chat
-   selected chat user
-   pending navigation
-   confirmation state

This means routing and in-app modal navigation are separate layers.

## React target

Use React Router for URL routing.

Do not replicate Vue's `beforeEach` as a direct `useEffect`.

Create explicit route loaders/guards or protected-route components.

For unsaved changes, use a dedicated navigation blocker plus the
existing in-app confirmation semantics.

## Potential bug/behavior note

The `/terms`, `/privacy`, `/refund`, and `/userguide` paths all resolve
to `LandingPage` rather than dedicated route components. The landing
page itself contains compliance content.

Preserve this behavior unless intentionally redesigned.
