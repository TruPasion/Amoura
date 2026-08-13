# Amoura --- Open Questions Before Phase 2

These are not blockers for the architecture audit. They are items that
should be resolved while building the migration plan.

## 1. React state library

Should the final architecture use:

-   Redux Toolkit everywhere for client state
-   Redux Toolkit + TanStack Query
-   another state solution

Current recommendation: Redux Toolkit for durable client/domain state,
with a dedicated WebSocket service and optional server-state library.

## 2. UI library

The current UI depends on Flowbite Vue.

React migration needs an equivalent strategy:

-   Flowbite React if feature-compatible
-   Tailwind + custom components
-   another component library

Do not substitute visually different controls during the first parity
pass.

## 3. WebSocket backend source

The uploaded repository contains the browser WebSocket client and
Express proxy, but the actual WebSocket service on port 8000 is not
present in the inspected source tree.

The protocol is therefore partially reconstructed from the frontend.

For full chat migration confidence, obtain the WebSocket backend
source/spec.

## 4. Tests

The repository does not expose an obvious comprehensive frontend test
suite in the inspected source.

This means the migration needs a new behavioral acceptance suite.

## 5. Upload deployment

The backend writes uploaded images to:

``` text
client/public/uploads
```

Verify production deployment keeps this directory persistent.

## 6. Cookie configuration

Verify production cookie attributes in `authController.ts`:

-   HttpOnly
-   Secure
-   SameSite
-   domain/path
-   expiry

## 7. Environment variable contract

Verify all frontend variables, especially:

``` text
wsenv
VITE_GOOGLE_CLIENT_ID
```

and determine actual production configuration.

## 8. Chat database schema

The chat PostgreSQL schema is not included in the inspected
`db/init.sql`.

The chat controller references a separate chat database.

For full end-to-end migration documentation, obtain its
schema/migrations.

## 9. Backend route auth

Upload currently does not use `authMiddleware`.

Confirm whether this is intentional.

## 10. Profile photo delta lifecycle

The frontend has explicit `saveProfileChanges()` logic, but the actual
photo delta request is made by the profile component.

Phase 2 should document the exact request/response relationship.

## 11. Location permissions

Current routing treats geolocation as required for `/app` and
`/registration`.

Confirm whether this is a product requirement or legacy behavior.

## 12. Compliance routing

Several compliance paths resolve to the landing page.

Confirm whether this is intentional.

## 13. Data fetching strategy

Decide whether the React version should preserve imperative fetch calls
initially or introduce a query/cache layer.

Recommendation: preserve first; optimize later.
