# typescript-fastify-rest-api

Opinionated Fastify + TypeScript REST API scaffold with Clerk auth, Drizzle/Postgres, and Zod validation. Clone it, fill in `.env`, and start building.

## Features

### Stack
- **Fastify 5** on Node 22, TypeScript strict mode ([api/tsconfig.json](api/tsconfig.json))
- **Drizzle ORM** over Postgres (`postgres-js` driver) with schema-first migrations ([api/drizzle.config.ts](api/drizzle.config.ts))
- **Zod + `fastify-type-provider-zod`** for end-to-end typed request/response validation ([api/src/app.ts:13-16](api/src/app.ts#L13-L16))
- **Clerk** (`@clerk/backend`) for authentication ([api/src/providers/auth.provider.ts](api/src/providers/auth.provider.ts))
- **Biome** as the single tool for format + lint — no eslint/prettier combo ([api/biome.json](api/biome.json))

### Auth
- **Clerk bearer-token verification** with automatic local user sync on first login ([api/src/plugins/auth.plugin.ts:41-85](api/src/plugins/auth.plugin.ts#L41-L85))
- **Secure local dev auth bypass** — gated by three independent conditions that must all be true ([api/src/plugins/auth.plugin.ts:26-40](api/src/plugins/auth.plugin.ts#L26-L40)):
  1. `NODE_ENV === "development"`
  2. Request IP is localhost (`127.0.0.1` / `::1`)
  3. `DEV_AUTH_ENABLED === "true"` plus matching `x-dev-auth-secret` and `x-dev-auth-user-id` headers

  Impossible to accidentally turn on in production. Lets you hit protected routes from Bruno without signing in through Clerk.
- **Typed `request.user` and `app.authenticate`** via Fastify module augmentation ([api/src/plugins/auth.plugin.ts:7-18](api/src/plugins/auth.plugin.ts#L7-L18))

### Developer experience
- **Bruno API client collection** checked into the repo at [api/api-client/](api/api-client/) with `Local` and `Production` environments and pre-wired dev-auth headers ([api/api-client/opencollection.yml:17-22](api/api-client/opencollection.yml#L17-L22))
- **Hot reload** via `tsx watch --env-file=.env` — no extra config ([api/package.json:7](api/package.json#L7))
- **Path alias** `@/*` → `./src/*`
- **Clean layering:** `routes/` → `services/` → `db/` with `dto/` for Zod schemas and `plugins/` for cross-cutting concerns

### Built-in protections
- **CORS** preconfigured for `http://localhost:3000` ([api/src/app.ts:20-26](api/src/app.ts#L20-L26))
- **Global rate limit** of 60 req/min via `@fastify/rate-limit` ([api/src/app.ts:28-31](api/src/app.ts#L28-L31))

### Production packaging
- **Multi-stage Dockerfile** on `node:22-alpine`, non-root user, `dumb-init` as PID 1 ([api/Dockerfile](api/Dockerfile))
- **Graceful shutdown** on SIGINT/SIGTERM ([api/src/server.ts](api/src/server.ts))
- Separate build tsconfig ([api/tsconfig.build.json](api/tsconfig.build.json))

## Project structure

```
api/
├── src/
│   ├── app.ts                 Fastify app + plugin registration
│   ├── server.ts              Entrypoint, graceful shutdown
│   ├── db/
│   │   ├── client.ts          Drizzle connection plugin
│   │   └── schemas/           Table definitions
│   ├── dto/                   Zod request/response schemas
│   ├── plugins/               Fastify plugins (auth, …)
│   ├── providers/             External service clients (Clerk, …)
│   ├── routes/                Route handlers
│   └── services/              Business logic
├── api-client/                Bruno collection
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

## Getting started

```bash
git clone <repo>
cd typescript-fastify-rest-api/api
cp .env.example .env          # fill in Postgres + Clerk values
pnpm install
pnpm db:push                  # sync schema to your database
pnpm dev
```

Requires **pnpm 10.24+** and **Node 22+**.

## Environment variables

From [api/.env.example](api/.env.example):

### Required
| Variable | Description |
|---|---|
| `PORT` | Port to listen on (e.g. `8000`) |
| `DATABASE_POOLING_URL` | Postgres connection string |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NODE_ENV` | `development` \| `production` |

### Dev-only (local auth bypass)
| Variable | Description |
|---|---|
| `DEV_AUTH_ENABLED` | `true` to enable the bypass |
| `DEV_AUTH_SECRET` | Shared secret sent as `x-dev-auth-secret` |
| `DEV_AUTH_USER_ID` | Clerk user id to impersonate, sent as `x-dev-auth-user-id` |

The bypass only works when `NODE_ENV=development` **and** the request comes from localhost **and** `DEV_AUTH_ENABLED=true`. Any of these missing falls through to normal Clerk token verification.

## Scripts

| Script | Action |
|---|---|
| `pnpm dev` | Hot-reload dev server with env file loaded |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled server |
| `pnpm format` | Format the codebase with Biome |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly (dev only) |

## API client

The [api/api-client/](api/api-client/) folder is a [Bruno](https://www.usebruno.com/) collection. Open it in Bruno, pick the `Local` environment, and the dev-auth headers are already set up — you can call protected routes without going through a Clerk sign-in flow. Use the `Production` environment against deployed instances (Clerk bearer token required there).

## Deployment

The [api/Dockerfile](api/Dockerfile) builds a slim production image in four stages: shared base, install deps, build TypeScript, install prod-only deps, then copy artifacts into a final `node:22-alpine` image running as a non-root `nodejs` user under `dumb-init`. The container exposes port `8080` and runs `node dist/server.js`.
