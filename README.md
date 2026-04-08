# PaperNest Client (Next.js)

Frontend application for PaperNest, a collaborative academic writing workspace with LaTeX editing, AI assistance, and realtime collaboration.

![CI](https://img.shields.io/badge/CI-not%20configured-lightgrey)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-See%20LICENSE-lightgrey)

## Features

- Realtime collaborative editing with Liveblocks + Yjs for document synchronization.
- LaTeX editor flow with compile controls, logs, and side-by-side document workspace.
- AI assistant integration via streaming endpoint (`/api/ai-stream`) and tool-based editor actions.
- Workspace/document management with role-aware review views.
- Firebase-backed authentication/session-aware user loading in the frontend.

## Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs on `http://localhost:3001` by default.

## Usage

Start development mode:

```bash
pnpm dev
```

Build and run production mode:

```bash
pnpm build
pnpm start
```

Useful scripts:

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm migrate:create
pnpm migrate
pnpm migrate:push
```

## Configuration

Copy `.env.example` to `.env.local`, then provide values below.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for backend API used by frontend services and auth calls. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Firebase analytics measurement ID. |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Yes (collaboration) | Public Liveblocks key for client connection. |
| `LIVEBLOCKS_SECRET_KEY` | Yes (collaboration) | Secret key for server-side Liveblocks auth endpoint. |
| `AI_PROVIDER` | Optional | AI provider ID (default from runtime config). |
| `AI_MODEL` | Optional | AI model ID used by streaming route. |
| `AI_TEMPERATURE` | Optional | Model temperature. |
| `AI_MAX_TOKENS` | Optional | Token limit for AI responses. |
| `GOOGLE_API_KEY` | Optional* | Required when `AI_PROVIDER=google-genai`. |
| `MISTRAL_API_KEY` | Optional* | Required when `AI_PROVIDER=mistral-ai`. |
| `VERTEX_AI_PROJECT_ID` | Optional* | Required when `AI_PROVIDER=vertex-ai`. |
| `VERTEX_AI_LOCATION` | Optional | Vertex region (defaults to `us-central1`). |

## Contributing

Contribution guidelines are available in [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

See [LICENSE](./LICENSE) for repository licensing terms.
