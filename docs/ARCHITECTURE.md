# Architecture

## Principles

1. **Local-first clients.** The Android app keeps every user record on the
   device and works without this service. The backend adds value (fresh
   catalog, update notices) but is never on the critical path.
2. **Modules by feature.** Each folder under `src/modules/` owns one feature:
   its controller (HTTP), service (use cases), repository (data access) and
   `domain/` (schemas and types with no framework code).
3. **Validate at the edges.** Environment variables (`src/config/env.ts`) and
   the catalog file (`domain/catalog.schema.ts`) are parsed with Zod at
   startup. Bad configuration stops the boot with a readable error.
4. **Versioned API.** Routes live under `/api/v1/...`. Breaking changes get a
   new version; old versions keep working until clients have moved.
5. **Same setup in tests and production.** `src/bootstrap.ts` holds the HTTP
   configuration and is used by both `main.ts` and the e2e tests.

## Layout

```
src/
  main.ts                 process entry: create app, listen
  bootstrap.ts            prefix, versioning, CORS, shutdown hooks
  app.module.ts           wires feature modules + validated config
  config/env.ts           environment schema
  modules/
    catalog/              maintenance catalog (read-only for now)
      domain/             Zod schema, types, cross-reference checks
      catalog.repository  loads + validates the JSON file, computes ETag
      catalog.service     lookups used by controllers
      catalog.controller  /api/v1/catalog routes
    app-version/          /api/v1/app-version
    health/               /api/health
catalog/
  maintenance-catalog.json   single source of truth for intervals
test/                      e2e tests over HTTP
```

## Data flow for the catalog

1. A contributor edits `catalog/maintenance-catalog.json` in a pull request.
2. CI validates it against the schema (unknown parts, duplicate models,
   empty intervals, severe intervals longer than normal ones all fail).
3. After merge, the deployed service serves the new version with a new ETag.
4. The app bundles a snapshot at build time and asks
   `/api/v1/catalog/version` for anything newer.

## Planned modules

| Module | Purpose | Needs a database |
| --- | --- | --- |
| `auth` | Phone-number sign-in (OTP) | yes |
| `sync` | Optional encrypted backup of a user's vehicles and records | yes |
| `subscriptions` | Plan status for paid features | yes |

When these arrive, PostgreSQL is added through `@nestjs/typeorm` or
`@nestjs/drizzle`, with migrations committed to the repo.
