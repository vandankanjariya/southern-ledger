# Deployment Runbook

Southern Ledger can run locally with Wrangler and can be deployed to Cloudflare Workers with D1. Other providers can host the static Vite build, but the included API currently targets Cloudflare Workers.

## Local Validation

```bash
npm run lint
npm run build
npm run deploy:check
```

`deploy:check` builds the React app, bundles the Worker, and performs a Wrangler dry run without publishing.

## D1 Setup

Local development uses the D1 database configured in `wrangler.jsonc`.

For your own deployment:

1. Create a Cloudflare D1 database.
2. Copy `.env.example` to `.env.local`.
3. Replace `CLOUDFLARE_D1_DATABASE_ID` with your production D1 database ID.
4. Set `FINANCE_DASHBOARD_HOSTNAME` to your own hostname if you route the Worker through a custom domain.

```bash
CLOUDFLARE_D1_DATABASE_ID=your-real-d1-uuid
CLOUDFLARE_ACCESS_ALLOWED_EMAIL=you@example.com
FINANCE_DASHBOARD_HOSTNAME=finance.example.com
```

Generate the ignored deployment config:

```bash
npm run deploy:prepare
```

This writes ignored `wrangler.deploy.jsonc` and keeps account-specific D1 UUIDs out of the committed `wrangler.jsonc`.

Apply migrations remotely:

```bash
npm run deploy:migrate
```

Do not commit account-specific database IDs, API tokens, raw bank exports, or generated deployment configs.

## Deploy

```bash
npm run deploy
```

Wrangler deploys:

- the Worker API from `worker/src/index.ts`
- the built SPA assets from `dist`
- `/api/*` requests to the Worker
- all other routes to the static app with SPA fallback
- no public `workers.dev` route by default, because `workers_dev` is disabled in `wrangler.jsonc`

## Authentication

The app does not include built-in user accounts yet. Before storing real financial data, protect the deployed dashboard with an authentication layer.

Recommended Cloudflare Access policy:

- Application type: Self-hosted
- Session duration: short, for example 12 hours
- Allowed users: only trusted identities
- Identity providers: one trusted provider initially
- Block everyone else by default

Equivalent private-access controls from another host or reverse proxy are also suitable.

## Production Checklist

- Replace the placeholder D1 `database_id`.
- Run all migrations against the remote D1 database.
- Deploy the Worker and static assets.
- Protect the deployed hostname with authentication.
- Confirm unauthenticated browser sessions are blocked.
- Confirm authenticated API requests work through `/api/health`.
- Import only non-sensitive test CSV data first.
