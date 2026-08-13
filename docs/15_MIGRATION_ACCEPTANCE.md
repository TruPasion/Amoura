# Amoura --- Migration Acceptance Criteria

## Authentication

-   [ ] Google login succeeds
-   [ ] JWT cookie is established
-   [ ] Refreshing `/app` restores the session
-   [ ] unauthenticated `/app` redirects to `/`
-   [ ] authenticated user without profile goes to `/registration`
-   [ ] authenticated user with profile cannot remain on `/registration`
-   [ ] logout clears session/UI state

## Location

-   [ ] location permission is requested where expected
-   [ ] denial produces the existing warning
-   [ ] cached location is reused when movement is \<=50km
-   [ ] location is refreshed when movement exceeds 50km
-   [ ] returned location is cached

## Registration

-   [ ] profile form loads
-   [ ] image upload works
-   [ ] uploaded URL is stored
-   [ ] profile creation works
-   [ ] successful registration routes to application

## Discovery

-   [ ] nearby profiles load
-   [ ] radius conversion remains km → meters
-   [ ] gender filter works
-   [ ] age range works
-   [ ] like works
-   [ ] dislike works
-   [ ] rapid actions are batched
-   [ ] duplicate actions are deduplicated
-   [ ] failed batches are requeued
-   [ ] page hide/unload flushes pending actions
-   [ ] rewind restores the previous profile

## Profile

-   [ ] profile loads
-   [ ] editable fields mutate local state
-   [ ] changed fields are tracked
-   [ ] reverted fields stop being considered changed
-   [ ] interest changes are tracked
-   [ ] add photo works
-   [ ] remove photo works
-   [ ] primary photo selection works
-   [ ] new photo IDs remain client-only until persistence
-   [ ] save persists expected deltas
-   [ ] successful save resets change tracking
-   [ ] discard restores original snapshot

## Navigation

-   [ ] profile with unsaved changes triggers confirmation
-   [ ] cancel keeps profile open
-   [ ] confirm leaves profile
-   [ ] chat navigation respects unsaved changes
-   [ ] feed navigation respects unsaved changes

## Matches

-   [ ] match list loads
-   [ ] new match event refreshes matches
-   [ ] match notification appears
-   [ ] selecting a match opens chat

## Chat

-   [ ] WebSocket connects
-   [ ] onboarding user ID is sent
-   [ ] ping occurs every 10 seconds
-   [ ] reconnect occurs after unexpected close
-   [ ] duplicate sockets are not created
-   [ ] history loads
-   [ ] old and new history response shapes work during compatibility
    period
-   [ ] sent message status updates
-   [ ] delivery status updates
-   [ ] failed message status updates
-   [ ] received messages appear
-   [ ] messages remain chronologically ordered
-   [ ] out-of-order messages are inserted correctly
-   [ ] unread counts increment correctly
-   [ ] opening a chat clears unread
-   [ ] read event updates messages
-   [ ] presence updates current chat user
-   [ ] conversation deletion works locally
-   [ ] remote deletion event removes local conversation

## Visual parity

-   [ ] landing page is visually equivalent
-   [ ] registration is visually equivalent
-   [ ] feed is visually equivalent
-   [ ] filters are visually equivalent
-   [ ] profile is visually equivalent
-   [ ] matches are visually equivalent
-   [ ] chat is visually equivalent
-   [ ] toast behavior is equivalent
-   [ ] mobile/responsive behavior is preserved

## Regression principle

A migration is not complete when the React app compiles.

It is complete when the observable behavior matches the Vue reference
implementation.
