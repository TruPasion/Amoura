# Amoura --- Pinia Store Logic Audit

## Store inventory

  ------------------------------------------------------------------------------------
  Store                   Status                  Primary responsibility
  ----------------------- ----------------------- ------------------------------------
  `user`                  active                  user/profile/feed/session-adjacent
                                                  state

  `actionStore`           active                  feed/profile/chat overlay
                                                  coordination + matches

  `chatStore`             active                  WebSocket + conversations +
                                                  unread/read/delivery

  `geoStore`              effectively unused      empty placeholder
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 1. User store

File: `client/src/stores/user.ts`

## State

### User/session-adjacent

-   `user`
-   current authenticated user object

### Feed

-   `nearbyUsers`
-   `lastSeenProfile`
-   `range`
-   `gender`
-   `ageRange`
-   `isRewind`

### Toast

-   `type`
-   `message`
-   `duration`

### Profile snapshot

`originalData` stores a copy of:

-   profile photo
-   photos
-   bio
-   job title
-   company
-   education
-   height
-   drinking
-   smoking
-   exercise
-   interests

This snapshot is the baseline used for unsaved-change detection.

### Profile delta

`profileChanges` tracks:

-   primary photo changed
-   added photos
-   deleted photos
-   profile fields changed
-   individual field values

### Feed batching

-   `accumulatedPayload`
-   `debounceTimer`

### Photo IDs

`nextPhotoId` starts at `-1` and decrements for new client-side photos.

This is an important convention:

``` text
positive id = persisted/original photo
negative id = newly added client-side photo
```

## Derived state

`hasUnsavedChanges` is true when any of:

-   profile photo changed
-   added photos exist
-   deleted photos exist
-   profile fields changed

## Methods

### `setUser`

Sets the authenticated user and creates a deep-ish profile snapshot for
change tracking.

Then clears pending changes.

### `logout`

Clears user state.

### `getnearbyusers`

Builds a geo payload:

-   latitude
-   longitude
-   range converted from km to meters
-   gender
-   min age
-   max age
-   current user ID

Calls the geo helper and replaces `nearbyUsers`.

### `setMessage` / `resetMessage`

Global toast mechanism.

### `userProfileAction`

Core feed interaction.

Behavior:

1.  takes the last nearby profile
2.  records like/dislike
3.  deduplicates identical action payloads
4.  immediately removes profile from UI
5.  stores last seen profile for rewind
6.  debounces network submission for 300ms
7.  batches multiple actions into one POST
8.  requeues payload on failure
9.  refills nearby users when the list becomes empty

Important note: the source comment says 500ms but the actual delay is
300ms. The actual code behavior is authoritative.

### `flush`

Immediately sends accumulated actions with:

``` text
keepalive: true
```

Used on:

-   `beforeunload`
-   `visibilitychange -> hidden`

This is critical for preserving feed actions during navigation/tab
close.

### `undoUserAction`

Sends a special:

``` json
{
  "action": "rewind"
}
```

Then restores the last seen profile into the feed.

### Photo mutations

-   `updateProfilePhoto`
-   `updatePhotos`
-   `addPhoto`
-   `removePhoto`

These mutate local profile state and update the profile delta tracker.

### `resetChanges`

Clears the profile delta.

### `revertToOriginalData`

Restores the profile from `originalData`.

This is used when navigation is confirmed/discarded.

### `saveProfileChanges`

Currently constructs and returns a photo delta object.

It does not itself perform the API call.

The actual profile field and photo persistence is handled by
UI/controller flows.

### `updateOriginalData`

Re-baselines the current profile after successful save.

### `updateProfileField`

Mutates a profile field and compares it to the original snapshot.

If different, adds it to `field_changes`.

If reverted, removes it.

### `updateProfileInterests`

Mutates interests and compares sorted arrays to the original snapshot.

Important subtlety: `.sort()` mutates the arrays passed to it. Preserve
behavior carefully and preferably fix this only after parity is
established.

------------------------------------------------------------------------

# 2. Action store

File: `client/src/stores/actionStore.ts`

## State

-   `matches`
-   `openchat`
-   `chatUser`
-   `openProfile`
-   `showNavigationConfirm`
-   `pendingNavigation`

## Responsibilities

This store is effectively the UI overlay/navigation coordinator.

### `openChat(user)`

If profile is open:

-   checks user store for unsaved changes
-   if changes exist, stores a pending callback
-   opens confirmation
-   otherwise opens chat directly

If profile is not open, opens chat directly.

### `openUserProfile`

-   opens profile
-   closes chat
-   clears chat user
-   clears pending navigation

### `openFeed`

Similar to `openChat`, but closes profile/chat.

### Navigation confirmation

-   `confirmNavigation`
-   `cancelNavigation`
-   `discardAndNavigate`

`discardAndNavigate` reverts the user store to its original snapshot
before proceeding.

### `getMatches`

GET:

``` text
/api/actions/matches/:userId
```

and replaces the matches array.

## Architectural warning

This store contains callbacks as state:

``` text
pendingNavigation: () => void
```

Do not blindly put functions into Redux state because Redux expects
serializable state.

In React/Redux, use an explicit navigation-intent state machine instead.

------------------------------------------------------------------------

# 3. Chat store

File: `client/src/stores/chatStore.ts`

## State

-   `ws`
-   `pingInterval`
-   `reconnectTimeout`
-   `openedChat`
-   `userMessages`
-   `userStatus`
-   `statusUpdateQueue`

## Responsibilities

This is both:

1.  chat domain state
2.  WebSocket connection manager

It should become a dedicated WebSocket service plus Redux/domain state
in the React migration.

## Message storage

``` text
userMessages: Record<number, ChatData>

ChatData:
  messages[]
  unread
```

## Message insertion

`addUserMessage` is optimized for chronological insertion:

-   append in O(1) when the message is newer than the last message
-   binary search for out-of-order messages
-   insert at correct position
-   increment unread count for received messages when the chat isn't
    open

This behavior must be preserved.

## Status queue

Delivery/read events are queued and processed asynchronously.

Two handlers:

-   `processDeliveryEvent`
-   `processReadEvent`

The queue prevents large synchronous status-update loops.

## WebSocket lifecycle

### Connect

`connectWebSocket(userId)`

1.  creates WebSocket
2.  waits for open
3.  sends `{ user_id }`
4.  starts 10-second ping

### Close/error

-   cleanup
-   schedule reconnect after 3 seconds

### Cleanup

Clears ping interval and closes socket.

### Reconnect

Uses a 3-second timer.

## WebSocket events

See `05_CHAT_WEBSOCKET.md`.

## HTTP chat loading

`loadUserMessages(userId)`:

``` text
GET /api/chat/getmessages/:userId
```

It supports two server response formats:

-   old format: user ID -\> message array
-   new format: user ID -\> `{ messages, unread }`

This backward compatibility is intentional behavior.

## Conversation deletion

DELETE:

``` text
/api/chat/delete-conversation?toUserId=:id
```

On success, local conversation state is deleted.

## Important migration rule

Do not make the WebSocket lifecycle dependent on React component
mount/unmount unless the original application semantics require it.

The current store represents a long-lived connection manager.
