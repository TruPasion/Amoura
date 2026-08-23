# Amoura --- API Contract Inventory

## API mounting

Express mounts:

``` text
/api/auth
/api/gis
/api/users
/api/actions
/api/chat
```

Most application APIs use `authMiddleware`.

Uploads require the same auth middleware as the protected API routes.

## Authentication

### POST `/api/auth/google`

Purpose:

-   verify Google ID token
-   create/find user
-   establish auth cookie

Client:

`components/Auth/GoogleloginButton.vue`

### GET `/api/auth/verify`

Protected.

Purpose:

-   verify existing session.

### POST `/api/auth/me`

Protected.

Purpose:

-   restore current user/profile
-   optionally update location

Client sends location only when the cached location is more than 50km
away.

### POST `/api/auth/logout`

Protected.

Clears server-side authentication state/cookie.

------------------------------------------------------------------------

## Geography

### POST `/api/gis/getnearbyusers`

Protected.

Input is built from:

``` json
{
  "latitude": 0,
  "longitude": 0,
  "range": 50000,
  "gender": "",
  "minAge": 18,
  "maxAge": 40,
  "currentUserId": 123
}
```

Exact backend validation/query behavior should be preserved.

Client helper:

`client/src/apihelper/geohelper.ts`

------------------------------------------------------------------------

## User

### POST `/api/users`

Create user.

### PUT `/api/users/:id`

Update user.

### DELETE `/api/users/:id`

Delete user.

### GET `/api/users/:id`

Get user.

### POST `/api/users/profiles`

Create user profile.

Client:

`Registration/Regview.vue`

### POST `/api/users/upload-delta`

Profile photo delta persistence.

Client:

`user/UserProfile.vue`

### POST `/api/users/updateprofile`

Profile field/interests persistence.

Client:

`user/UserProfile.vue`

------------------------------------------------------------------------

## Upload

### POST `/api/upload`

Multipart image upload.

Field:

``` text
image
```

Returns:

``` json
{
  "message": "File uploaded successfully",
  "fileUrl": "/uploads/..."
}
```

MinIO stores uploaded objects in the configured S3 bucket:

``` text
MinIO S3 bucket (`S3_BUCKET`)
```

------------------------------------------------------------------------

## Feed/actions

### POST `/api/actions`

Protected.

Accepts a list of actions.

Observed action types:

``` text
like
dislike
rewind
```

Client batches this endpoint.

### GET `/api/actions/matches/:userId`

Protected.

Returns matched profiles.

### DELETE `/api/actions/reset-matches`

Protected.

Used by profile/admin-like UI.

------------------------------------------------------------------------

## Chat

### GET `/api/chat/getmessages/:userId`

Protected.

Returns conversation/message data.

Client has backward compatibility for two response shapes.

### DELETE `/api/chat/delete-conversation?toUserId=:id`

Protected.

Deletes conversation and local chat state.

------------------------------------------------------------------------

## WebSocket

Development:

``` text
ws://localhost:8000/ws
```

Production:

``` text
wss://amoura.dev/ws
```

The browser sends:

``` json
{"user_id":123}
```

and heartbeat:

``` json
{"type":"ping"}
```

Read notification:

``` json
{
  "type":"read_client",
  "userId":123,
  "touserId":456,
  "client_msg_id":"...",
  "timestamp":"..."
}
```

## Migration rule

The React migration should preserve all endpoint paths, methods, request
bodies, response expectations, credentials behavior, and WebSocket event
names before any API cleanup is attempted.
