# karyad-backend

سرویس بک‌اند **کاریاد** — اپ یادآور سرویس خودرو و دفتر حساب رانندگان.

API for **Karyad**, a car-maintenance reminder and driver-ledger app for Iran.
The Android app works fully offline; this service publishes the vehicle
maintenance catalog and app-version information, and is the home for future
sync and web features.

| Repo | Role |
| --- | --- |
| `karyad-app` | Flutter client — Android first, then web and desktop |
| `karyad-backend` | This service (NestJS + TypeScript) |
| `karyad-web` | Public website and download page |

## Requirements

- Node.js 22+
- npm 11 (`npm install -g npm@11`) — npm 10 hits a known peer-resolution bug

## Quick start

```bash
npm ci
cp .env.example .env
npm run start:dev          # http://localhost:3000/api/health
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Run with reload |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | HTTP tests against the full app |
| `npm run lint` | Oxlint with type-aware rules |
| `npm run typecheck` | TypeScript, no emit |
| `npm run ci` | Everything CI runs, in the same order |

## API (v1)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness plus loaded catalog version |
| GET | `/api/v1/catalog` | Full maintenance catalog; supports `If-None-Match` → 304 |
| GET | `/api/v1/catalog/version` | Catalog version and ETag only |
| GET | `/api/v1/catalog/models/:modelId` | Schedule for one model, e.g. `quick`, `dena` |
| GET | `/api/v1/app-version?platform=android` | Latest and minimum supported app version |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Editing the maintenance catalog](docs/CATALOG.md)
- [Contributing](CONTRIBUTING.md)

## Docker

```bash
docker build -t karyad-backend .
docker run -p 3000:3000 karyad-backend
```
