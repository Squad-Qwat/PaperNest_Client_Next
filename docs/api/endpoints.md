# Endpoint Catalog

## Frontend API Routes (`src/app/api`)

| Route | Method | Purpose |
|---|---|---|
| `/api/ai-stream` | `POST` | Stream AI assistant output and tool events over SSE. |
| `/api/liveblocks-auth` | `POST` | Authorize Liveblocks room access from authenticated backend user. |
| `/api/ai-chat` | `POST` | Deprecated route. Returns 404 and migration hint. |

## Runtime Notes

- `ai-stream` runs in Node.js runtime with `maxDuration = 300`.
- `liveblocks-auth` depends on `LIVEBLOCKS_SECRET_KEY` and backend `NEXT_PUBLIC_API_URL` auth endpoint.
