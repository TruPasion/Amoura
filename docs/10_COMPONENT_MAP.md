# Amoura --- Component and Feature Map

## Root

### `App.vue`

Shell:

-   Toaster

### `main.ts`

Bootstrap:

-   Vue
-   Pinia
-   Router
-   Tailwind
-   Flowbite
-   unload flush handlers

------------------------------------------------------------------------

## Landing

### `views/Landingpage.vue`

Composes:

-   Navbar
-   Google login
-   Terms
-   Privacy
-   Refund
-   Contact
-   Footer

### `Navbar.vue`

Landing/navigation UI.

### `Appfooter.vue`

Footer UI.

### Compliance components

-   `compliencepages/Contact.vue`
-   `compliencepages/Privacy.vue`
-   `compliencepages/Refund.vue`
-   `compliencepages/Terms.vue`
-   `compliencePages/termsAndCon.vue`

------------------------------------------------------------------------

## Authentication

### `Auth/GoogleloginButton.vue`

Dependencies:

-   UserStore
-   Router

API:

-   `/api/auth/google`

------------------------------------------------------------------------

## Registration

### `Registration/Regview.vue`

Dependencies:

-   UserStore
-   Vue Router
-   Flowbite
-   Lucide

APIs:

-   `/api/upload`
-   `/api/users/profiles`

------------------------------------------------------------------------

## Home

### `views/Home.vue`

Dependencies:

-   ActionStore
-   UserStore
-   ChatStore

Composes:

-   userChat
-   Sidenav
-   Feed
-   Toaster
-   UserProfile

### `Home/Feed.vue`

Dependencies:

-   UserStore

Responsibilities:

-   feed rendering
-   like/dislike
-   rewind
-   logout
-   nearby profile display

### `Home/FilterBox.vue`

Dependencies:

-   UserStore

Controls:

-   range
-   gender
-   age range

### `Home/Sidenav.vue`

Dependencies:

-   UserStore
-   ActionStore
-   Matches

Responsibilities:

-   current user summary
-   profile/chat navigation
-   matches UI

### `HomeContent.vue`

Mostly UI/layout.

------------------------------------------------------------------------

## Profile

### `Profile/UserProfile.vue`

Higher-level profile component.

### `user/UserProfile.vue`

Primary editable profile logic.

Dependencies:

-   UserStore
-   ActionStore
-   PhotoGrid
-   profile options

APIs:

-   `/api/actions/reset-matches`
-   `/api/upload`
-   `/api/users/updateprofile`
-   `/api/users/upload-delta`

### `user/PhotoGrid.vue`

Dependencies:

-   UserStore

Responsibilities:

-   add photo
-   remove photo
-   choose primary photo

------------------------------------------------------------------------

## Matches

### `user/Matches.vue`

Dependencies:

-   UserStore
-   ActionStore
-   ChatStore

Responsibilities:

-   match list
-   chat entry
-   chat summary/unread state

------------------------------------------------------------------------

## Chat

### `Chat/userChat.vue`

Dependencies:

-   UserStore
-   ActionStore
-   ChatStore
-   nanoid
-   Lucide

Responsibilities include:

-   conversation display
-   message entry
-   sending
-   message status
-   presence
-   deletion

------------------------------------------------------------------------

## Toast

### `toast/Toaster.vue`

Reads:

-   message
-   type
-   duration

from UserStore.

------------------------------------------------------------------------

## Migration grouping recommendation

Migrate by feature, not by file extension:

1.  application shell
2.  auth/session
3.  registration
4.  discovery/feed
5.  profile editing/photos
6.  matches
7.  chat
8.  compliance/public pages
9.  cleanup/architecture refactor
