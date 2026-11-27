# Reliability and scale

Goal: Karyad keeps working for every user even when parts of the system fail,
and the backend can grow from hundreds to hundreds of thousands of users
without a rewrite. Target availability for the API: 99.9% per month
(about 43 minutes of allowed downtime).

## 1. The app does not depend on the server

The single biggest protection. Reminders, service records, the driver ledger
and the maintenance schedule all live on the phone. Reminders are scheduled
by the phone itself. If the backend, the hosting provider or the
international internet is down, users notice nothing except that the catalog
does not refresh until it is back.

Rule for every new feature: it must degrade gracefully offline. A feature
that cannot work without the server shows a clear «اتصال برقرار نیست» state
and never blocks the rest of the app.

## 2. The backend is stateless and cheap per request

- No session or user state in memory: any instance can answer any request,
  so instances can be added, removed or restarted freely.
- The catalog is validated and serialized once at boot; serving it is a
  memory copy. `ETag` + `If-None-Match` turns repeat checks into empty 304s.
- `Cache-Control: public, max-age=3600` lets a CDN answer catalog requests
  without reaching the service at all.
- Responses are gzip-compressed.

Measured on a 2-vCPU sandbox (load generator on the same machine, one Node
process): about 2,000 requests/second at 200 concurrent connections, p99
around 200 ms, zero errors. The app checks the catalog about once a day, so
one instance covers well over a million daily users for this traffic.

## 3. Protection against abuse and overload

- Per-IP rate limit (`RATE_LIMIT_PER_MINUTE`, default 120) on every route
  except `/api/health`; excess requests get HTTP 429 instead of slowing
  everyone down.
- Security headers via Helmet; `x-powered-by` removed.
- Behind a load balancer, set `TRUST_PROXY_HOPS` so limits apply to real
  client IPs, not the balancer.

## 4. Safe deploys

- Graceful shutdown: on SIGTERM the process finishes in-flight requests.
- Docker `HEALTHCHECK` and `/api/health` let the orchestrator route traffic
  only to healthy instances and replace failed ones.
- Invalid configuration or an invalid catalog stops the boot, so a bad
  release fails its health check and never receives traffic.
- CI blocks merges that fail lint, types, unit, e2e or the load test.

## 5. Production topology (when the backend is deployed)

```
users ──► CDN (ArvanCloud or similar, inside Iran)
              │  caches /api/v1/catalog*
              ▼
         load balancer
          │        │
     instance A  instance B     (2+ containers, different hosts)
          │        │
       PostgreSQL primary ──► replica + daily off-site backups
       (only once sync/auth exist)
```

- Host inside Iran so international outages do not cut users off.
- At least two instances on different physical hosts from day one of
  launch; rolling deploys replace one at a time.
- External uptime monitor on `/api/health` with alerts to the team.

## 6. Website

`karyad-web` is a static site (pre-built HTML/CSS) served from a CDN. There
is no server process to crash; it stays up as long as the CDN does, and can
be mirrored to a second CDN or GitHub Pages as a fallback.

## Checklist before public launch

- [ ] Two or more backend instances behind a load balancer
- [ ] CDN in front of the API and the website
- [ ] Uptime monitoring and alerting on `/api/health`
- [ ] Load test re-run against the real infrastructure
- [ ] Database backups tested by restoring one (once a database exists)
