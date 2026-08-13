# Amoura --- Frontend Architecture Audit

## Stack

-   Vue 3.5
-   TypeScript 5.8
-   Vite 7
-   Pinia 3
-   Vue Router 4
-   Flowbite Vue
-   Flowbite
-   Tailwind CSS 3
-   lucide-vue-next
-   nanoid
-   native Fetch API
-   native browser WebSocket

## Bootstrap

`client/src/main.ts`:

1.  creates Vue app
2.  creates Pinia
3.  installs Vue Router
4.  loads Tailwind/Flowbite styles
5.  globally registers Flowbite Vue components
6.  mounts app
7.  registers `beforeunload` handler to flush pending feed actions
8.  registers `visibilitychange` handler to flush when page becomes
    hidden

## Root component

`client/src/App.vue`

Currently acts as a small shell and renders the toast component.

## Views

### `Landingpage.vue`

Public landing experience.

Composes:

-   Navbar
-   Google login
-   compliance pages
-   footer

### `Home.vue`

Authenticated application shell.

Composes:

-   chat
-   side navigation
-   feed
-   toast
-   user profile

Uses:

-   action store
-   user store
-   chat store

Also performs profile-save/change reset interactions.

## Component groups

### Auth

`GoogleloginButton.vue`

-   Google authentication
-   user store initialization
-   router navigation

### Registration

`Regview.vue`

-   profile creation
-   image upload
-   user profile mutation
-   navigation

### Home

-   `Feed.vue`
-   `FilterBox.vue`
-   `Sidenav.vue`
-   `HomeContent.vue`

Feed behavior depends heavily on user store.

### Profile

-   `Profile/UserProfile.vue`
-   `user/UserProfile.vue`
-   `user/PhotoGrid.vue`

The `user/UserProfile.vue` component is the primary editable profile UI.

### Chat

-   `Chat/userChat.vue`
-   `user/Matches.vue`

Chat UI consumes the chat store and action store.

### Toast

`Toaster.vue`

Reads toast state from user store.

### Compliance

-   Contact
-   Privacy
-   Refund
-   Terms
-   `compliencePages/termsAndCon.vue`

## Utilities

### `utils/types.ts`

Central frontend domain types.

### `utils/geo.ts`

Distance calculation used by routing/location behavior.

### `apihelper/geohelper.ts`

Calls nearby-user endpoint.

### `utils/timeUtils.ts`

IST/UTC formatting and conversion.

### `utils/profileOptions.ts`

Profile option metadata.

### `utils/IST_UTILITIES_GUIDE.md`

Existing time-handling documentation.

## Current frontend dependency pattern

``` text
Home
 ├── ActionStore
 ├── UserStore
 └── ChatStore

Sidenav
 ├── UserStore
 └── ActionStore

Feed
 └── UserStore

FilterBox
 └── UserStore

Matches
 ├── UserStore
 ├── ActionStore
 └── ChatStore

UserProfile
 ├── UserStore
 └── ActionStore

PhotoGrid
 └── UserStore

Chat
 ├── UserStore
 ├── ActionStore
 └── ChatStore

Router
 ├── UserStore
 └── ActionStore
```

## Key frontend coupling

The user store is the central dependency hub.

The action store dynamically imports the user store to avoid a circular
dependency.

The chat store directly depends on both user and action stores.

This coupling must be explicitly modeled during migration.
