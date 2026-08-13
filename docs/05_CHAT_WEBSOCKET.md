# Amoura --- Chat and WebSocket Behavior

## Architecture

``` text
React/Vue UI
   |
Chat state
   |
WebSocket service
   |
ws://localhost:8000/ws
   |
WebSocket backend
```

Express also proxies `/ws` to the WebSocket backend.

## Connection

On open:

``` json
{
  "user_id": 123
}
```

Then a ping is sent every 10 seconds:

``` json
{
  "type": "ping"
}
```

## Reconnect

On close:

``` text
cleanup
  |
wait 3 seconds
  |
connect again
```

The migration must prevent multiple concurrent reconnect
timers/connections.

## Event catalog observed in frontend

### `pong`

Used to confirm heartbeat response.

### `onboard_response`

Updates user presence when the event belongs to the currently open chat
user.

### `status_update`

Updates:

-   user ID
-   status
-   last seen

Only when the status belongs to the currently open chat user.

### `match`

Behavior:

-   refresh matches
-   show success toast
-   create empty chat state for the matched user

### `message_sent`

Finds the outgoing message by `client_msg_id`.

Updates timestamp and status.

### `message_delivered`

Updates delivered timestamp and status.

### `message_unsuccessful`

Marks outgoing message as failed.

### `message_received`

Constructs a `Message` object and inserts it into the sender's chat.

If the corresponding chat is open, it sends a `read_client` WebSocket
event.

### `delivery`

Queues delivery status updates.

### `read`

Queues read status updates.

### `delete_conversation`

Removes the local conversation and shows a warning toast.

## Message model

``` text
client_msg_id
from
to
content
timestamp
status
delivered_timestamp
read_timestamp
conversation_id
```

Statuses:

``` text
sent
delivered
read
sending
failed
received
```

## Message ordering

The frontend assumes messages can arrive out of order.

Algorithm:

``` text
if new message timestamp >= last timestamp:
    append
else:
    binary-search insertion point
    insert
```

Do not replace this with an unordered map or naive append.

## Unread behavior

Unread is stored per user.

When a chat is opened:

``` text
openedChat = userId
unread = 0
```

A received message increments unread if its sender's chat is not open.

## Delivery/read processing

Delivery/read events contain maps keyed by `client_msg_id`.

The store scans the relevant chat messages and updates
timestamps/status.

## Chat loading compatibility

The frontend accepts both:

``` text
userId -> Message[]
```

and:

``` text
userId -> {
  messages: Message[],
  unread: number
}
```

Preserve this compatibility until the backend response is intentionally
standardized.

## Conversation deletion

HTTP deletion is performed by the current user.

A WebSocket `delete_conversation` event informs the other side.

Both sides must remove local conversation state.

## React target architecture

Recommended:

``` text
chat/
├── chatSlice.ts
├── chatSelectors.ts
├── chatApi.ts
├── websocket/
│   ├── ChatWebSocket.ts
│   └── chatEvents.ts
└── hooks/
    ├── useChat.ts
    └── useChatPresence.ts
```

The WebSocket object, timers and reconnect state should not live as
ordinary serializable Redux state.
