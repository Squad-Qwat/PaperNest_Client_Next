# Getting Started

Estimated time: 10-20 minutes.

## Prerequisites

- Node.js 20+
- pnpm
- A running backend API compatible with `NEXT_PUBLIC_API_URL`
- Firebase project credentials
- Liveblocks API keys (for collaboration features)

## Steps

1. Clone repository.
2. Open `frontend/PaperNest_Client_Next`.
3. Run `pnpm install`.
4. Copy `.env.example` to `.env.local`.
5. Fill `.env.local` with valid credentials.
6. Run `pnpm dev`.
7. Open `http://localhost:3001`.
8. Sign in and open a workspace document.

## Verify

Run this command and confirm HTTP 200:

```bash
curl -I http://localhost:3001
```

If collaboration is configured, verify Liveblocks auth endpoint is reachable:

```bash
curl -X OPTIONS http://localhost:3001/api/liveblocks-auth -i
```
