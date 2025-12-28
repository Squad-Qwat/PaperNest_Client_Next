# Architecture Overview

PaperNest Client is a Next.js App Router frontend focused on collaborative document authoring.

## High-Level Components

- UI Layer: route pages under `src/app` and reusable UI/components under `src/components`.
- State/Providers: auth, query, and app providers initialized in `src/app/layout.tsx`.
- Editor Layer: LaTeX editor components and hooks (`useLatexEditor`, `useLatexCollaboration`).
- Collaboration Layer: Liveblocks room context + Yjs document synchronization.
- Data Layer: frontend API services/hooks to backend and Firebase adapters.
- AI Layer: streaming endpoint (`/api/ai-stream`) and LangGraph-based tooling pipeline.

## Request Flow (Document Page)

1. User opens `/:workspaceid/documents/:documentid`.
2. Frontend validates workspace access.
3. Document is fetched (room-state API first, Firestore fallback).
4. `Room` provider initializes Liveblocks and Yjs sync.
5. Editor receives initial content and collaboration awareness.
6. Save operation runs batched backend updates (`save-content`, metadata update, checkpoint).

## Collaboration Design

- Presence/user metadata is managed via Liveblocks awareness.
- Yjs text CRDT (`latex`) is the collaborative editor source.
- Offline support is enabled in Yjs provider configuration.

## Reliability Notes

- Fallback path exists when room-state API is unavailable.
- AI routes fail fast when credentials are not configured.
- Desktop guard is used for editor-heavy pages on small screens.

## Known Gaps

- [TODO] Expand architecture docs for review and invitation modules.
- [TODO] Add sequence diagrams for save/merge flows.
