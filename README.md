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
npm run test:frontend   # frontend display logic
npm run test:unit       # backend recommendation rules
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

## Coursework verification (2026-11-17)

The app has been deployed to **Render** (HTTPS Docker Web Service with managed PostgreSQL) and **AWS EC2** (CloudFormation + full Docker Compose with PostgreSQL). The project owner confirmed that weather searches return outfit advice on AWS and the PostgreSQL-backed history persists after refreshing the page. Render is configured to auto-deploy **after CI checks pass** on the feature branch; AWS updates are currently **manual**.

- **Live Render:** https://weatherwear-app.onrender.com (HTTPS)
- **AWS EC2 origin:** http://ec2-54-206-140-173.ap-southeast-2.compute.amazonaws.com (HTTP only; ephemeral EC2 public DNS may change)
- **AWS infrastructure:** [CloudFormation template](infra/aws/cloudformation.yaml), [Compose overlay](infra/aws/docker-compose.aws.yml), [AWS deployment guide](docs/deploy-aws.md)
- **CI evidence:** [Infrastructure smoke checks](https://github.com/T1mleR/weatherwear/actions/runs/44054541535) and [AWS template checks](https://github.com/T1mleR/weatherwear/actions/runs/44054541543), both successful for `336a620`
- **Live-deployment evidence:** [Render verification](docs/verification-render.md), [AWS Issue #15](https://github.com/T1mleR/weatherwear/issues/15), [CI/CD Issue #16](https://github.com/T1mleR/weatherwear/issues/16)
- **Detailed pass/gap review:** [Coursework acceptance and submission checklist](docs/submission-status.md)
- **Implementation under review:** [PR #18](https://github.com/T1mleR/weatherwear/pull/18) on branch `feat/postgresql-docker-compose`; it has **not** been merged into `main`.

### Remaining evidence and limitations

The SQLite-to-PostgreSQL **schema** migration is implemented, and an optional export/import process exists, but importing **pre-existing SQLite records** has not been verified. Frontend display logic tests pass; independent component tests from Issue #13 remain open. Security dependency audit Issue #19 remains open. AWS auto-deployment after GitHub CI is not implemented; only Render's CI-gated feature-branch auto-deploy is verified.

Render does **not** host the root `docker-compose.yml` directly: Compose is run in CI and on the AWS instance. AWS uses an **HTTP** origin only; optional HTTPS CloudFront was deliberately not enabled to avoid extra Free Plan resource use. AWS Free Plan infrastructure consumes credits until the CloudFormation stack is deleted. Capture screenshots and remove the AWS stack **after** demonstration and backing up data if needed.

Track detailed scope and proof in [GitHub Issues](https://github.com/T1mleR/weatherwear/issues). Final deliverable: GitHub repository URL with the relevant feature branch/PR and evidence links.
