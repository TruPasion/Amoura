# Amoura --- System Architecture

## 1. Runtime topology

``` text
Browser
  |
  | http://localhost:3000
  v
Express :3000
  |
  +---- /api/auth ----------> Express controllers
  +---- /api/gis -----------> Geo controller -> PostgreSQL/PostGIS
  +---- /api/users ----------> User controller -> PostgreSQL
  +---- /api/actions -------> Feed controller -> PostgreSQL + Redis
  +---- /api/chat -----------> Chat controller -> chat PostgreSQL + Redis
  +---- /api/upload ---------> Multer -> client/public/uploads
  |
  +---- / -------------------> Vite :5173
  |
  +---- /ws ------------------> WebSocket backend :8000

Frontend
  Vue 3
    |
    +-- Pinia
    |    +-- user
    |    +-- actionStore
    |    +-- chatStore
    |    +-- geoStore (currently empty)
    |
    +-- Vue Router
    +-- Flowbite Vue
    +-- Tailwind CSS
    +-- browser localStorage
    +-- browser WebSocket

Persistence
  PostgreSQL/PostGIS
    +-- users/profile/location/matches/interests
  Chat PostgreSQL
    +-- messages/conversation data
  Redis
    +-- realtime/chat/feed auxiliary state
```

## 2. Root application structure

``` text
Amoura/
├── client/
│   └── src/
├── server/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── routes/
│   └── utils/
├── db/
│   ├── init.sql
│   └── migrations/
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 3. Startup

Root package scripts:

-   `npm run dev:client` → Vite using `client/vite.config.ts`
-   `npm run dev:server` → `tsx watch server/index.ts`
-   `npm run dev` → runs both concurrently

Express listens on port 3000.

Vite is proxied behind Express at port 5173.

The WebSocket client normally connects to:

-   development: `ws://localhost:8000/ws`
-   production: `wss://amoura.dev/ws`

## 4. Architectural boundaries

### Frontend

The frontend currently mixes:

-   UI state
-   server state
-   domain state
-   network orchestration
-   WebSocket orchestration
-   persistence behavior

inside Pinia stores and components.

The migration should improve boundaries without changing behavior.

### Backend

The backend is a conventional Express controller/router architecture.

Authentication is cookie/JWT based.

The frontend migration should consume the backend as-is.

## 5. Important architectural observation

The current architecture has two distinct kinds of state:

### Server/domain state

Examples:

-   user/profile
-   nearby profiles
-   matches
-   messages
-   user presence

### UI/client coordination state

Examples:

-   open chat
-   open profile
-   navigation confirmation
-   toast
-   current filter values
-   unsaved profile edits
-   WebSocket connection object

These should not necessarily be stored in the same React mechanism.

## 6. Migration target principle

The target should separate:

``` text
React UI
   |
Hooks / feature controllers
   |
Domain/client state
   |
API services + WebSocket service
   |
Existing Express backend
```

The first migration should not alter the backend/data layer.
