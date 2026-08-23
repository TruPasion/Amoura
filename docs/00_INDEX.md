# Amoura --- Phase 1 Architecture Audit

**Audit target:** uploaded Amoura repository\
**Purpose:** establish a source-of-truth architecture and behavior map
before any Vue → React migration.

## Audit scope

This audit covers the application source, backend, database
schema/migrations, frontend state, routing, authentication/session
behavior, chat/WebSocket behavior, API surface, UI/component structure,
and migration risks.

The uploaded archive contains the Git repository, dependency
installations, environment files, frontend, backend, and database
assets. The audit intentionally excludes `node_modules/` and `.git/`
from source analysis.

## Repository snapshot

-   Source/config files inspected: 57 TypeScript/Vue/SQL files
-   Approximate source/config LOC: 9,087
-   Frontend: Vue 3 + Vite + TypeScript + Pinia + Vue Router + Flowbite
    Vue + Tailwind
-   Backend: Express 5 + TypeScript
-   Data: PostgreSQL/PostGIS + a separate chat PostgreSQL database +
    Redis
-   Realtime: browser WebSocket client with a backend WebSocket service
    proxied through Express
-   Authentication: Google ID token verification + JWT stored in an
    `auth_token` cookie
-   Uploads: authenticated multipart requests stream directly into MinIO
-   Development entry point: root `npm run dev`, which starts Vite and
    Express

## Documents

  -----------------------------------------------------------------------
  File                                Purpose
  ----------------------------------- -----------------------------------
  `AGENTS.md`                         Rules for an AI agent working on
                                      the migration

  `01_SYSTEM_ARCHITECTURE.md`         End-to-end architecture and runtime
                                      topology

  `02_FRONTEND_ARCHITECTURE.md`       Vue application structure and
                                      dependency map

  `03_PINIA_STORE_LOGIC.md`           Detailed store/state/business
                                      behavior

  `04_SESSION_AUTH.md`                Authentication, session
                                      restoration, routing and unload
                                      behavior

  `05_CHAT_WEBSOCKET.md`              Chat state machine, WebSocket
                                      events, reconnect and unread logic

  `06_BUSINESS_LOGIC.md`              Product/domain behavior
                                      reconstructed from frontend/backend

  `07_API_CONTRACTS.md`               HTTP/WebSocket API surface and
                                      client usage

  `08_ROUTING_NAVIGATION.md`          Routes, guards and navigation
                                      confirmation behavior

  `09_DATA_MODEL.md`                  Database tables, relationships and
                                      persistence model

  `10_COMPONENT_MAP.md`               Component/view responsibilities and
                                      store dependencies

  `11_MIGRATION_BLUEPRINT.md`         Recommended Vue → React migration
                                      architecture and phases

  `12_RISKS_GOTCHAS.md`               Migration hazards, hidden behavior
                                      and known code smells

  `13_INVENTORY.md`                   File-by-file inventory

  `14_OPEN_QUESTIONS.md`              Items that should be verified
                                      before migration

  `15_MIGRATION_ACCEPTANCE.md`        Behavioral acceptance criteria for
                                      proving parity
  -----------------------------------------------------------------------

## Critical conclusion

**Do not rewrite Amoura from scratch.**

The existing code contains accumulated product behavior that is easy to
forget: profile delta tracking, unsaved-change protection, batched feed
actions, unload flushing, location gating, session restoration,
WebSocket reconnect behavior, message ordering, delivery/read queues,
cross-store dependencies, and UI overlay coordination.

The React migration should therefore be treated as:

> **Behavior-preserving reimplementation of the existing frontend, with
> the Vue code acting as the reference implementation.**

The backend and database should remain unchanged during the first
migration stage unless a concrete incompatibility is found.

## Security note

The uploaded archive contains `.env` files. Treat the uploaded archive
as sensitive. Before sharing the repository elsewhere, remove secrets
and rotate any credentials that were real production credentials.
