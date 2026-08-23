# Amoura --- Migration Risks and Gotchas

## Critical

### 1. `.env` files are in the uploaded archive

Remove secrets before redistribution.

### 2. User store is overloaded

It contains auth-adjacent state, discovery, toast, profile editing and
batching.

A blind 1:1 Redux conversion will produce an oversized slice.

### 3. Action store contains functions

`pendingNavigation` is a callback.

Do not put it directly into Redux state.

### 4. Chat store owns non-serializable objects

-   WebSocket
-   timer IDs

These should not be ordinary Redux state.

### 5. WebSocket reconnect can recurse

The current code:

``` text
onclose -> cleanup -> scheduleReconnect -> connect
```

The new implementation must avoid:

-   duplicate sockets
-   duplicate timers
-   reconnect after intentional shutdown
-   multiple heartbeat intervals

### 6. Message ordering is intentional

Binary-search insertion exists for out-of-order messages.

Do not simplify to `push()`.

### 7. Unload batching is intentional

Feed actions can exist only in memory for a short period.

Preserve:

-   debounce
-   requeue on failure
-   `keepalive`
-   beforeunload
-   visibilitychange

### 8. Negative photo IDs

New local photos use negative IDs.

Do not replace this convention until the save protocol is understood.

### 9. Two unsaved-navigation mechanisms

There is both:

-   router `window.confirm`
-   action-store custom confirmation

Do not accidentally remove one.

### 10. Location is part of routing

The app asks for geolocation before session restoration on application
routes.

This is not merely a profile feature.

------------------------------------------------------------------------

## Medium

### 11. README is stale

The README says client/server have independent `npm install` workflows,
but the uploaded root package contains the dependencies and scripts.

The actual repository should be treated as the source of truth.

### 12. `geoStore.ts` is empty

It appears unused and should not be migrated as meaningful state.

### 13. API calls are inconsistent about credentials

Some use:

``` text
credentials: "include"
```

while others rely on browser defaults.

Preserve actual behavior first, then standardize.

### 14. `wsenv` environment usage

The chat store checks:

``` text
import.meta.env.wsenv
```

The expected Vite environment variable naming convention normally uses
`VITE_...`.

Do not change this during parity migration without checking current
deployment configuration.

### 15. Time handling

Backend/database and frontend utilities have explicit UTC/IST decisions.

A React rewrite can accidentally introduce browser-local timezone
conversion.

### 16. `updateProfileInterests`

The current implementation sorts arrays in place.

Avoid introducing a behavior change while refactoring.

### 17. Uploads are stored in MinIO

Uploads are now decoupled from the frontend deployment. The backend stores
objects in the configured MinIO/S3 bucket and serves them through the
existing `/uploads/*` endpoint.

------------------------------------------------------------------------

## Architectural debt to address after parity

-   typed API client
-   centralized credentials behavior
-   typed WebSocket events
-   domain-separated state
-   better server-state caching
-   test coverage
-   route guard simplification
-   upload storage separation
-   environment variable validation
-   removal of stale README/config
