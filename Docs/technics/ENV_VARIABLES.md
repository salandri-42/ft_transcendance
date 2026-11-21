# .env Documentation

This document lists the environment variables needed to run the project, where they are used, and how to obtain them.

## 1) Create your `.env`
From project root, copy the template and fill missing secrets:

- Source template: [/.env.example](../../.env.example)
- Target file: `/.env` (local only, never commit)

## 2) Required variables (runtime)

### Core / Infrastructure
- `POSTGRES_USER`  
  Used by: PostgreSQL container, Prisma connection strings  
  How to get: choose a local DB user (default `postgres` is fine for local dev).

- `POSTGRES_PASSWORD`  
  Used by: PostgreSQL container, Prisma connection strings  
  How to get: set a strong local password.

- `POSTGRES_DB`  
  Used by: PostgreSQL bootstrap DB  
  How to get: choose DB name (default `transcendence`).

- `NESTJS_PORT`  
  Used by: gateway container `PORT` mapping  
  How to get: choose local internal gateway port (default `3000`).

### Security / Auth
- `JWT_ACCESS_SECRET`  
  Used by: mapped as `JWT_SECRET` in identity + cosmos services  
  How to get: generate a long random secret (32+ chars).

- `MAIL_HOST`  
  Used by: identity email service  
  How to get: SMTP provider host (Brevo/Mailgun/Sendgrid/etc.).

- `MAIL_PORT`  
  Used by: identity email service  
  How to get: SMTP provider port (`587` for STARTTLS commonly).

- `MAIL_USER`  
  Used by: identity email service  
  How to get: SMTP username from your provider dashboard.

- `MAIL_PASSWORD`  
  Used by: identity email service  
  How to get: SMTP/API key from your provider dashboard.

- `FT_ID`  
  Used by: 42 OAuth strategy in identity  
  How to get: create an app in 42 intra developer settings and copy Client ID.

- `FT_SECRET`  
  Used by: 42 OAuth strategy in identity  
  How to get: same 42 app, copy Client Secret.

- `FT_CALLBACK_URL`  
  Used by: 42 OAuth callback URL  
  How to get: set to your callback route (must match 42 app config), e.g. `https://orel.page/auth/42/callback`.

### LLM / AI (pythia)
- `GEMINI_API_KEY`  
  Used by: pythia oracle/gemini service  
  How to get: create a key in Google AI Studio / Gemini API console.

### Cloudflare Tunnel (public access)
- `CLOUDFLARE_TUNNEL_TOKEN`  
  Used by: `cloudflared` service in compose profile `cloudflare`  
  How to get:
  1. In Cloudflare Zero Trust, create/select a tunnel.
  2. Add public hostname `orel.page`.
  3. Copy the tunnel token.

## 3) Blockchain variables (scribe)

> In current compose file, root `.env` values are consumed with `SCRIBE_*` names and passed to scribe runtime as generic names (`PRIVATE_KEY`, `FUJI_RPC_URL`, etc.).

- `SCRIBE_PRIVATE_KEY`  
  Used by: scribe (`PRIVATE_KEY`) + Hardhat deploy account  
  How to get: export private key of dedicated dev wallet (never use personal main wallet).

- `SCRIBE_FUJI_RPC_URL`  
  Used by: scribe (`FUJI_RPC_URL`) / Avalanche Fuji RPC  
  How to get: use public Fuji RPC or provider endpoint (Infura/Alchemy/Ankr/etc.).

- `SCRIBE_CONTRACT_ADDRESS`  
  Used by: scribe contract interaction  
  How to get: deploy contract with Hardhat then copy deployed address.

- `SCRIBE_PINATA_API_KEY`  
  Used by: scribe (`PINATA_API_KEY`)  
  How to get: create API key in Pinata dashboard.

- `SCRIBE_PINATA_SECRET_API_KEY`  
  Used by: scribe (`PINATA_SECRET_API_KEY`)  
  How to get: paired secret from Pinata API key creation.

## 4) ELK / Observability
- `ELK_USERNAME`  
  Used by: Logstash/Kibana/Elasticsearch bootstrap  
  How to get: local value for stack auth (default `elastic`).

- `ELK_PASSWORD`  
  Used by: Logstash/Kibana/Elasticsearch bootstrap  
  How to get: choose strong password for local ELK admin.

- `ELK_KEYSTORE_PASSWORD`  
  Used by: Elasticsearch TLS keystore in compose  
  How to get: choose local password (must match keystore generation step if customized).

- `ELK_RETENTION_DAYS`  
  Used by: retention policy scripts/config  
  How to get: define retention period, e.g. `30d`.

- `ELK_SNAPSHOT_RETENTION_DAYS`  
  Used by: snapshot retention policy  
  How to get: define retention period, e.g. `30d`.

- `ELK_SNAPSHOT_SCHEDULE`  
  Used by: scheduled snapshots (cron expression)  
  How to get: choose cron schedule, e.g. `0 0 2 * * ?`.

## 5) Optional / advanced overrides
- `IDENTITY_SERVICE_URL` (gateway proxy target override)
- `COSMOS_SERVICE_URL` (gateway proxy target override)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL` (service-level Redis overrides)
- `TAG` (image tag used by build flow)
- `GATEWAY_PORT` (host exposure convention, if used in local workflows)

## 6) Security checklist
- Never commit `.env`.
- Rotate leaked tokens/secrets immediately.
- Use dedicated non-production credentials for development.
- Keep 42 OAuth callback URLs and Cloudflare hostname config synchronized with deployed URL (`https://orel.page`).

## 7) Related files
- [Root env template](../../.env.example)
- [Compose variables usage](../../docker-compose.yml)
- [Tunnel notes](TUNNEL_SETUP.md)
