# Amoura --- Business Logic Audit

## Product domain

Amoura is a location-aware dating application with:

-   Google authentication
-   user registration/profile
-   profile photos
-   profile attributes/interests
-   nearby discovery
-   like/dislike actions
-   rewind
-   mutual matches
-   real-time chat
-   presence/last-seen
-   conversation deletion
-   compliance pages

## 1. Registration

Registration collects profile data and supports photo upload.

Profile creation endpoint:

``` text
POST /api/users/profiles
```

Images are uploaded first through:

``` text
POST /api/upload
```

The upload response returns a relative URL:

``` text
/uploads/<generated-file-name>
```

## 2. Discovery

Nearby discovery is based on:

-   current latitude
-   current longitude
-   radius
-   preferred gender
-   minimum age
-   maximum age
-   current user ID

Radius entered in the UI is treated as kilometers and converted to
meters before the API call.

## 3. Like/dislike

A user action records:

``` text
user_id
seen_user_id
action
```

Actions include:

-   `like`
-   `dislike`
-   `rewind`

The client batches like/dislike actions.

## 4. Action batching

The client:

1.  immediately updates UI
2.  accumulates action payloads
3.  deduplicates exact duplicate entries
4.  waits 300ms after the most recent action
5.  POSTs all accumulated actions
6.  restores failed payloads to the queue if the request fails

When the browser is closing/hiding, `flush()` sends remaining actions
using `keepalive`.

## 5. Rewind

The last consumed profile is stored as `lastSeenProfile`.

Rewind:

1.  POSTs a `rewind` action
2.  re-adds the profile to the nearby list
3.  clears last-seen state

## 6. Match creation

The backend maintains mutual matching through `user_matches`.

The frontend learns about matches through:

-   match list HTTP request
-   WebSocket `match` event

## 7. Profile editing

Profile editing is a two-layer system:

### Current mutable profile

The user edits the live `user.profile`.

### Original snapshot

A snapshot is retained.

The difference between them is tracked in `profileChanges`.

This enables:

-   unsaved-change detection
-   discard/revert
-   save delta construction

## 8. Profile photo semantics

Photos have:

-   ID
-   URL
-   position
-   primary flag

New unsaved photos use negative client IDs.

The primary photo is synchronized with the photo list.

## 9. Unsaved changes

Navigation can be blocked if profile changes exist.

Two mechanisms exist:

### Router-level

Browser `window.confirm`.

### Action-store-level

Custom pending-navigation state.

The duplication must be understood before migration because removing
either mechanism could alter UX.

## 10. Profile options

Profile attributes are backed by database IDs:

-   drinking
-   smoking
-   exercise
-   interests

## 11. Chat

A match can become a conversation.

Chat supports:

-   history loading
-   sending
-   sending status
-   delivery status
-   read status
-   unread counts
-   presence
-   deletion
-   reconnect

## 12. Time handling

The database migration documents UTC conversion.

Frontend utilities explicitly expose IST formatting functions.

The target React app must preserve:

``` text
storage/transport = UTC
display = expected IST formatting
```

Do not convert timestamps to local browser timezone accidentally.

## 13. Location behavior

Location is required for application/registration routes.

The current router asks the browser for location before session
restoration.

Location is cached locally and refreshed if the user moves more than
50km.

## 14. Business invariants

These should survive migration:

-   user cannot enter `/app` without an authenticated session
-   user without a profile is redirected to registration
-   registered user is redirected away from registration
-   feed actions should not disappear on rapid swiping/tab close
-   rewind returns the most recently consumed profile
-   new photos have client-only IDs until persisted
-   unsaved profile edits trigger confirmation
-   chat messages remain chronologically ordered
-   unread count belongs to a conversation/user
-   delivery/read events update existing messages
-   WebSocket reconnects after unexpected closure
