# Render deployment verification — WeatherWear

Date: 2026-11-03
GitHub Issue: [#14](https://github.com/T1mleR/weatherwear/issues/14)
CI/CD Issue: [#16](https://github.com/T1mleR/weatherwear/issues/16)

## Deployment details

| Field | Value |
| --- | --- |
| Host | Render |
| Runtime | Docker (single Next.js frontend + backend app image) |
| Public URL | https://weatherwear-app.onrender.com |
| Service | weatherwear-app |
| Plan | Free ($0/month) |
| Region | Frankfurt |
| Repository | https://github.com/T1mleR/weatherwear |
| Branch deployed | feat/postgresql-docker-compose |
| Database | weatherwear-db (Render Free PostgreSQL 16, Frankfurt) |
| Health check | /api/health |
| CI workflow | .github/workflows/infrastructure-smoke.yml |
| Auto-Deploy | After CI Checks Pass |

## Confirmed evidence

- Initial deploy `dep-dbkquomk1f9s73dp271g` was live after a successful Docker image build, PostgreSQL migration `20261103_init_postgresql` and Next.js startup.
- A subsequent commit `4cc7d02bb4dd32976226974c0767cb4aeb96ab7f` was automatically deployed and Render reported it live.
- The project owner opened the public website and confirmed city lookup, weather and outfit recommendations displayed.
- GitHub Actions builds and tests both app and Docker Compose, with unit, integration and Playwright feature tests.
- The Render service configuration was confirmed to be `autoDeployTrigger=checksPass` after the owner selected **After CI Checks Pass**.

## Required final proof for issue #16

The current commit adding this document is a **non-functional test commit**. Check that GitHub Actions starts on push and completes successfully before Render creates a new live deployment of that exact commit. Document the GitHub Actions run and Render deployment ID in Issue #16. Do not mark as verified until both are observed.

## Known limitations

- Render runs a Dockerfile-based Web Service and a separately managed PostgreSQL service, **not** the `docker-compose.yml` directly. Docker Compose is exercised in CI; the strict instructor requirement “Compose only” requires approval or additional evidence from a Compose-capable hosting target.
- Free database automatically expires after 30 days: 2026-12-03. Export any data beforehand.
- Initial cloud deployment is on the feature branch. Do not merge to main or switch production branch without reviewing migrations, credentials and green CI.
- A successful browser search was confirmed, but history persistence after reload and SQLite record transfer still require separate evidence.
- No paid plan or infrastructure has been provisioned.
