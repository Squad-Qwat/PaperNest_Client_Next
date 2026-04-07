# Installation

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app starts at `http://localhost:3001`.

## Production Build

```bash
pnpm build
pnpm start
```

## Tooling

- Lint: `pnpm lint`
- Auto-fix lint: `pnpm lint:fix`
- Format: `pnpm format`
- Tests: `pnpm vitest --run --passWithNoTests`

## Database Migration Commands

Drizzle scripts defined in `package.json`:

```bash
pnpm migrate:create
pnpm migrate
pnpm migrate:push
```

## Troubleshooting

### Missing API or auth errors

- Ensure `NEXT_PUBLIC_API_URL` points to a running backend.
- Verify token forwarding from client to `/api/liveblocks-auth`.

### AI route returns configuration error

- Set provider credentials (`GOOGLE_API_KEY`, `MISTRAL_API_KEY`, or Vertex env vars).
- Ensure `AI_PROVIDER` and `AI_MODEL` are valid for selected provider.
