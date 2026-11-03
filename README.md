# WeatherWear AI

Next.js 16 / React 19 weather and outfit recommendations. The Next.js server handles both the frontend and the API. PostgreSQL and Prisma persist recommendation history.

## Local deployment — Docker Compose

Requirements: Docker Engine with the Compose plugin. Copy the non-secret example configuration:

```bash
cp .env.example .env
```

Change `POSTGRES_PASSWORD` in `.env` to a long alphanumeric value (and update the `DATABASE_URL` password to match for optional host-side commands). **Never commit `.env`**.

```bash
docker compose up --build -d
docker compose ps
curl -f http://localhost:3000/api/health
```

Visit http://localhost:3000. The Compose stack includes:
- `db`: PostgreSQL 16 with durable named volume `postgres_data`;
- `migrate`: a one-shot `prisma migrate deploy` from the same Dockerfile;
- `app`: production Next.js standalone image, including frontend and API.

The app starts after the DB becomes healthy and migrations succeed. `docker compose logs app` and `docker compose logs migrate` provide diagnostics. Stop with `docker compose down` (keeps DB volume). **Do not run `docker compose down -v` unless you intend to delete all PostgreSQL data.**

### Export existing SQLite history (optional)

This repository previously used `prisma/dev.db`. **Back it up before changing anything.** Run:

```bash
python3 scripts/export-sqlite.py prisma/dev.db migration-backup/recommendations.json
docker compose up --build -d
docker compose run --rm --no-deps -v "$PWD/migration-backup:/backup:ro" migrate \
  node /app/scripts/import-recommendations.mjs /backup/recommendations.json
```

Export is read-only, creates a local JSON backup and refuses to overwrite an existing one. Import is idempotent by record ID (`skipDuplicates`), and reports row counts. If the source DB is empty, importing is optional. Verify history via `GET /api/recommendations` before retiring the SQLite file. Never commit export JSON, SQLite DB or credentials. Note: the original `prisma/dev.db` is already tracked in the repository's history; this change intentionally does not delete it until its data has been verified/migrated.

### Developing without Docker for Next.js

Use Node.js 22, a reachable PostgreSQL database, and set `DATABASE_URL` from `.env`. For example, start PostgreSQL with `docker compose up -d db`, then:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Run `npm run lint` to lint. Test commands:

```bash
npm run test:unit
npm run test:integration # requires running app + PostgreSQL
npx playwright install chromium
npm run test:e2e       # starts Next.js if not already running; requires DB
```

Playwright uses deterministic browser-side API mocks for all eight user-facing features; no paid API or live weather provider is needed for E2E. Backend unit tests verify cold/mild/hot/rain/wind/UV recommendation rules. Integration tests verify API and PostgreSQL persistence. GitHub Actions also builds and smoke-tests the entire Docker Compose stack. Frontend components and API routes share one Next.js codebase. Open http://localhost:3000 and check `GET /api/health`, `GET /api/recommendations`, `POST /api/recommendations` (`{"city":"Алматы"}`).

## Architecture

- UI: `components/WeatherDashboard.tsx`, Next.js App Router.
- API: `app/api/recommendations/route.ts` (GET history / POST new recommendation).
- Weather: Open-Meteo via `services/weatherService.ts`.
- Persistence: Prisma `Recommendation` model with PostgreSQL.
- Health/readiness: `app/api/health/route.ts`.
- Deployment: `Dockerfile` builds static assets plus Next.js server in **one production app image**, managed with `docker-compose.yml`.

The Dockerfile is multi-stage, so the database migrator target is not bundled into the production image. Passwords are injected at runtime rather than baked into images. Prefer deploy-time secret management and managed volumes in cloud hosting.

## Coursework status

- [x] PostgreSQL Prisma schema and initial SQL migration prepared.
- [x] Single production Dockerfile (UI + API) prepared.
- [x] Compose database + migrations + app prepared.
- [ ] Confirm build, migration, healthcheck and data import on a Docker host (not yet run here).
- [x] Playwright feature-by-feature E2E specs, backend unit and integration tests, CI jobs prepared.
- [ ] Confirm all Playwright tests and Docker Compose smoke checks pass in GitHub Actions.
- [ ] Cloud hosting and secure push-to-deploy.
- [ ] AWS CloudFormation or GCP Terraform deployment after cost/account approval.

Track all work in [GitHub Issues](https://github.com/T1mleR/weatherwear/issues); implementation PR references #1–#12 and #17.
