# AGENTS.md --- Amoura Migration Agent Contract

## Mission

Migrate the existing Amoura Vue 3 frontend to React while preserving
behavior.

The existing Vue application is the **behavioral specification**. Do not
simplify behavior merely because the React implementation could be
written differently.

## Non-negotiable rules

1.  Do not change backend API contracts unless explicitly required.
2.  Do not change database schema during frontend migration.
3.  Do not remove a behavior because it appears redundant.
4.  Do not replace asynchronous behavior with synchronous
    approximations.
5.  Do not blindly translate Vue syntax into React syntax.
6.  Preserve error handling and loading states.
7.  Preserve auth/session semantics.
8.  Preserve WebSocket event semantics and reconnect behavior.
9.  Preserve message ordering and delivery/read state.
10. Preserve unsaved profile change tracking.
11. Preserve batched action buffering and unload flushing.
12. Preserve route behavior and redirects.
13. Preserve localStorage behavior.
14. Preserve upload semantics and returned URLs.
15. Preserve API payload shapes.
16. Preserve timestamps and UTC/IST presentation behavior.
17. Keep TypeScript strict.
18. Prefer small, reviewable migration units.
19. After every unit, run typecheck/build/tests available in the repo.
20. Never "fix" an unrelated backend issue during a frontend migration
    unless it blocks parity.

## Required workflow

### Step 1 --- Read before editing

Before modifying a feature, read:

-   its Vue component(s)
-   all stores it uses
-   all composables/utilities it uses
-   route guards that can affect it
-   API endpoints it calls
-   backend controller for those endpoints when behavior is ambiguous

### Step 2 --- Build a migration map

For each feature record:

-   source files
-   state dependencies
-   API dependencies
-   side effects
-   lifecycle dependencies
-   browser APIs
-   navigation dependencies
-   failure behavior
-   target React files

### Step 3 --- Implement

Use idiomatic React rather than a mechanical Vue syntax translation.

Recommended target:

-   React + TypeScript
-   Vite
-   React Router
-   Redux Toolkit for global client state where appropriate
-   TanStack Query/RTK Query only where it clearly improves server-state
    handling
-   WebSocket service outside React render logic
-   custom hooks for UI lifecycle integration

### Step 4 --- Verify

At minimum:

``` bash
npm run build
npx tsc --noEmit
```

Also run project-specific lint/test commands if introduced or available.

For stateful features, manually verify:

-   login/session restore
-   registration
-   location permission
-   feed filtering
-   like/dislike
-   rewind
-   profile editing
-   photo add/remove/primary selection
-   unsaved-change navigation
-   matches
-   chat loading
-   send/delivery/read
-   reconnect
-   conversation deletion
-   logout

## State migration rules

### Pinia → React

Do not create a 1:1 Redux slice solely because a Pinia store exists.

First classify each piece of state:

-   durable client state
-   transient UI state
-   server state
-   WebSocket state
-   derived state
-   migration-only state

Then choose the target mechanism.

### User store

The existing user store is not only authentication state. It also owns:

-   current user
-   nearby users
-   feed filters
-   rewind state
-   toast state
-   batched feed action queue
-   profile change snapshots
-   profile photo mutations
-   profile field mutations

Do not split these until dependencies are understood.

### Chat store

Treat the chat WebSocket as a service/state machine.

Do not open a WebSocket directly from arbitrary React components.

## Forbidden migration shortcuts

Never do:

``` text
"replace ref with useState everywhere"
"replace computed with useMemo everywhere"
"replace watch with useEffect everywhere"
"convert every Pinia action into a Redux reducer"
"delete code until TypeScript passes"
"replace WebSocket with polling"
"replace session logic with localStorage"
"remove old behavior because React handles it differently"
```

## Definition of done

A feature is migrated only when:

1.  It compiles.
2.  It renders.
3.  Its API calls match the original contract.
4.  Its state transitions match the original behavior.
5.  Its navigation behavior matches.
6.  Its failure behavior matches.
7.  Its browser lifecycle behavior matches.
8.  Its UI interaction behavior matches.
9.  Its acceptance criteria in `15_MIGRATION_ACCEPTANCE.md` pass.
