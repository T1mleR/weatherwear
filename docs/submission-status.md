# WeatherWear — coursework acceptance review

**Reviewed:** 2026-11-17  
**Submission repository:** https://github.com/T1mleR/weatherwear  
**Implementation PR:** https://github.com/T1mleR/weatherwear/pull/18 (OPEN, unmerged; branch `feat/postgresql-docker-compose`)  
**Source of checks:** repository workflows, issue acceptance criteria, deployed infrastructure evidence in Issues #14–#16, and owner-confirmed AWS browser tests.

## Verified functionality and evidence

| Requirement | Status | Evidence / qualification |
| --- | --- | --- |
| One production Dockerfile for frontend + backend | DONE | `Dockerfile`, Next.js standalone app/API production target |
| SQLite schema migrated to PostgreSQL | DONE (schema), DATA COPY UNVERIFIED | `prisma/schema.prisma`, SQL migrations and `scripts/export-sqlite.py` / `scripts/import-recommendations.mjs`; no confirmed import of old records |
| Docker Compose with persistent PostgreSQL | DONE | `docker-compose.yml` (`db`, `migrate`, `app`), volume; AWS Compose confirmed live |
| Frontend unit tests | DONE for display logic; COMPONENT TESTS OUTSTANDING | `tests/frontend/` runs in CI; requested independent `WeatherDashboard` component test coverage in Issue #13 not yet shown |
| Backend unit + PostgreSQL integration tests | DONE | `tests/unit/`, `tests/integration/`, `infrastructure-smoke.yml` |
| Individual Playwright E2E feature coverage | DONE | 8 separate specs with 10 tests, Issues #1–#8 tagged `e2e-test` |
| CI lint, typecheck, build, Docker+Compose smoke | DONE | [Infrastructure smoke checks: latest verified commit](https://github.com/T1mleR/weatherwear/actions/runs/44054541535) — success |
| CloudFormation and AWS overlay static checks | DONE | [AWS CloudFormation static validation](https://github.com/T1mleR/weatherwear/actions/runs/44054541543) — success |
| First public cloud deployment | DONE on Render (provider limitation) | https://weatherwear-app.onrender.com ; Docker Web Service + separately managed PostgreSQL, NOT direct remote Compose; `docs/verification-render.md` |
| Production CI-gated auto-deploy | VERIFIED on Render feature branch | Render `After CI Checks Pass` and documented successful commit-triggered deployment; not yet proven for `main` |
| AWS IaC deployment within Free account | DONE (live demo) | CloudFormation `weatherwear-coursework-free` in `ap-southeast-2` CREATE_COMPLETE; EC2 `t3.micro`; SSM access; only HTTP ingress 80; database port closed. See Issue #15 |
| AWS end-user weather and persistence | VERIFIED by owner | EC2 browser search for Алматы displays weather and outfit advice, and history survives page reload after fixing `NODE_OPTIONS=--dns-result-order=ipv4first` in the AWS Compose overlay |
| AWS automatic push-to-deploy after CI | NOT CONFIGURED | Current AWS EC2 update uses SSM git fetch + Compose recreate, documented in `docs/deploy-aws.md`. Do not claim automatic AWS deploy |
| Security dependency audit | OPEN | Issue #19; CI earlier reported moderate npm dependency advisories. Needs `npm audit` analysis and safe fixes or documented risk acceptance |
| Screenshots and final submission proof | IN PROGRESS | Capture screenshots of AWS CloudFormation CREATE_COMPLETE, AWS WeatherWear result/history, Render, and green GitHub Actions. Do not include passwords or account IDs |
| Source branch merged to `main` | NOT DONE | PR #18 is still OPEN; confirm intended submission branch or review/merge only when safe |

## Provider-specific limitations

- Render uses the repository's production Dockerfile, **not the root Compose specification as a directly hosted stack**; full Compose is tested in GitHub Actions and runs on AWS EC2. If the assignment requires Compose on the *first* cloud provider itself, document/confirm that interpretation.
- AWS direct EC2 URL uses **HTTP, not HTTPS** (CloudFront intentionally disabled to protect the Free account); use Render for an HTTPS public demo.
- Render's free PostgreSQL database is time-limited; preserve any data you need before expiration.
- A successful AWS health check covers the app and database, not upstream Open-Meteo reachability. Live weather search was verified separately by the owner.
- CloudFormation CREATE_COMPLETE is infrastructure creation only; the application also requires successful Docker startup and API checks (now confirmed).
- AWS Free Plan resources continue consuming credits while present; **delete CloudFormation stack after demonstration and evidence collection**, after backing up any data worth retaining. Budget alerts are not spending caps.

## Suggested final evidence order

1. Show [PR #18](https://github.com/T1mleR/weatherwear/pull/18), linked GitHub Issues and the completed CI runs.
2. Show [Render HTTPS app](https://weatherwear-app.onrender.com) and its deployment settings/evidence.
3. Show AWS CloudFormation CREATE_COMPLETE and EC2 live WeatherWear with a saved city still present after refreshing.
4. Explain the two different hosting models, Free Plan restrictions and manual AWS redeploy limitation honestly.
5. Resolve/explicitly disclose outstanding SQLite history migration evidence, security audit, component tests and open PR status before claiming all assignment criteria met.

This file records the **observed state**, not a claim of 100% completion or a formal grade.
