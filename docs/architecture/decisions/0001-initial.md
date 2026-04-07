# 0001 - Use Next.js App Router With Liveblocks + Yjs For Collaboration

## Status

Accepted

## Context

The frontend needs:

- Workspace and document routing
- Realtime multi-user editing
- Server-backed auth and metadata
- Editor extensibility for AI-assisted writing

## Decision

Use:

- Next.js App Router for frontend pages and API routes
- Liveblocks for room presence and session authorization
- Yjs for CRDT-based collaborative editor state
- Firebase integration for auth/document fallback flows where applicable

## Consequences

Positive:

- Strong realtime collaboration primitives
- Flexible route-level API handlers
- Clear composition between UI, collaboration, and AI endpoints

Trade-offs:

- Collaboration reliability depends on correct room ID conventions
- Multiple service dependencies increase environment setup complexity
- Additional care needed for fallback consistency between room state and stored state
