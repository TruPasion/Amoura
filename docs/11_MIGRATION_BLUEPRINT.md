# Amoura --- Vue → React Migration Blueprint

## Goal

Preserve the existing Amoura product while replacing the Vue/Pinia
frontend with React.

## Recommended target

``` text
React
TypeScript
Vite
React Router
Redux Toolkit
React-compatible UI primitives
Tailwind CSS
```

Server:

``` text
UNCHANGED
Express
PostgreSQL/PostGIS
Chat PostgreSQL
Redis
WebSocket backend
```

## State architecture

Do not blindly reproduce four Pinia stores.

### Suggested target

``` text
Redux
├── userSlice
├── discoverySlice
├── profileEditSlice
├── navigationSlice
├── matchesSlice
└── chatSlice

Services
├── authApi
├── userApi
├── discoveryApi
├── chatApi
├── uploadApi
└── chatWebSocket

Hooks
├── useAuth
├── useDiscovery
├── useProfileEditor
├── useMatches
├── useChat
└── usePresence
```

## Why split `user` store

The current user store combines multiple domains.

A safe migration can initially keep the same state shape, then refactor
after parity.

Recommended sequence:

``` text
Phase A
Pinia user
   ↓
React userSlice
   ↓
behavior parity

Phase B
separate:
  auth
  discovery
  profile editing
  toast
```

This reduces migration risk.

## Action store migration

Do not store:

``` text
pendingNavigation: function
```

in Redux.

Instead model:

``` text
navigationIntent:
  type: "open-chat" | "open-feed"
  targetUserId?: number
```

and:

``` text
navigationConfirmation:
  visible: boolean
  intent: ...
```

The actual callback becomes an explicit reducer transition.

## Chat architecture

Use:

``` text
ChatWebSocket service
        |
        v
typed event parser
        |
        v
Redux actions
        |
        v
chatSlice
```

Timers and WebSocket objects remain outside serializable Redux state.

## Auth architecture

Use cookie-based session exactly as today.

``` text
Auth API
  |
session cookie
  |
Auth bootstrap
  |
userSlice
```

Protected routes should depend on explicit auth bootstrap state:

``` text
unknown
authenticated
unauthenticated
```

Avoid redirecting before the initial `/api/auth/me` request finishes.

## Discovery

Preserve:

-   filter semantics
-   km → meters conversion
-   50km location refresh threshold
-   batched action submission
-   rewind
-   failed-batch requeue
-   unload/hidden flush

## Profile editor

Recommended state:

``` text
profile
originalSnapshot
changes
saveStatus
```

Do not compute unsaved state only from shallow object equality.

The current app tracks photo deltas and field deltas explicitly.

## Chat

Preserve the current event catalog.

Do not migrate chat by simply fetching messages periodically.

The real-time behavior is core product behavior.

## Migration order

### Stage 0 --- freeze/reference

Create:

``` text
react-migration branch
```

Tag a known-good Vue baseline.

### Stage 1 --- target shell

Build:

-   React root
-   router
-   global styles
-   provider setup
-   Redux store

### Stage 2 --- authentication

Migrate:

-   Google login
-   `/api/auth/me`
-   protected routes
-   logout

### Stage 3 --- registration

Migrate:

-   registration form
-   upload
-   profile creation

### Stage 4 --- discovery

Migrate:

-   feed
-   filters
-   like/dislike
-   rewind
-   action batching

### Stage 5 --- profile

Migrate:

-   profile display
-   editing
-   photo grid
-   delta tracking
-   unsaved confirmation

### Stage 6 --- matches

Migrate:

-   match list
-   match refresh
-   chat entry

### Stage 7 --- chat

Migrate:

-   WebSocket
-   messages
-   status
-   presence
-   unread
-   deletion
-   reconnect

### Stage 8 --- public pages

Migrate:

-   landing
-   compliance
-   footer

### Stage 9 --- parity testing

Compare React behavior against Vue.

### Stage 10 --- cleanup

Only after parity:

-   remove redundant state
-   improve types
-   separate domains
-   improve API abstraction
-   remove legacy code

## Critical principle

**Parity first, architecture cleanup second.**
