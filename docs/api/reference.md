# API Reference

This document covers frontend-owned API routes implemented in `src/app/api`.

## `POST /api/ai-stream`

Streams AI responses for editor assistance using Server-Sent Events (SSE).

### Signature

```http
POST /api/ai-stream
Content-Type: application/json
```

### Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `message` | `string` | Yes | - | User prompt sent to the AI agent. |
| `documentContent` | `string` | No | `""` | Current editor text content. |
| `documentHTML` | `string` | No | `""` | HTML representation used by tools. |
| `documentSections` | `unknown[]` | No | `[]` | [NEEDS CLARIFICATION] client-provided section metadata. |
| `conversationHistory` | `unknown[]` | No | `[]` | Prior message context. |
| `toolResults` | `ToolResult[]` | No | `undefined` | Previous tool execution results. |
| `documentId` | `string` | No | `undefined` | Active document identifier. |
| `plan` | `unknown` | No | `undefined` | [NEEDS CLARIFICATION] optional planner output. |
| `threadId` | `string` | No | generated timestamp | Conversation thread identity. |
| `reasoningEnabled` | `boolean` | No | `false` | Enables extended reasoning mode. |
| `providerId` | `string` | No | runtime default | AI provider override. |
| `modelId` | `string` | No | runtime default | AI model override. |

### Returns

- `200 text/event-stream` with JSON payload chunks in SSE `data:` frames.
- `400 application/json` when `message` is missing.
- `500 application/json` when AI credentials are invalid or stream initialization fails.

### Example

```bash
curl -N -X POST http://localhost:3001/api/ai-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Summarize this section","documentContent":"\\section{Intro}..."}'
```

Expected stream event examples:

```text
data: {"type":"connected","timestamp":...}

data: {"type":"token","content":"..."}

data: {"type":"stream_end","timestamp":...}
```

## `POST /api/liveblocks-auth`

Generates Liveblocks authorization based on backend user identity (`/auth/me`).

### Signature

```http
POST /api/liveblocks-auth
Authorization: Bearer <token>
Content-Type: application/json
```

### Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `Authorization` header | `string` | Yes | - | Bearer token forwarded to backend `auth/me`. |
| `room` | `string` | No | `undefined` | Room ID to authorize with full access in current implementation. |

### Returns

- `200`/`201`/`2xx` with Liveblocks auth payload (status depends on Liveblocks authorize response).
- `401` when token is missing/invalid.
- `400` when user payload is invalid.
- `500` on unexpected server errors.

### Example

```bash
curl -X POST http://localhost:3001/api/liveblocks-auth \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"room":"document:123"}'
```

## `POST /api/ai-chat` (Deprecated)

Legacy route kept for compatibility.

### Signature

```http
POST /api/ai-chat
```

### Behavior

Always returns:

- `404 application/json`
- Body: `{"error":"AI Chat route is deprecated. Use ai-stream instead."}`

## Review notes

- [TODO] Expand request/response schemas with typed interfaces when API types are exported for route payloads.
- [QUESTION] Should `POST /api/liveblocks-auth` continue granting `FULL_ACCESS` by default, or be role-scoped?
