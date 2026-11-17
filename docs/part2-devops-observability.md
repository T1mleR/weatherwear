# WeatherWear — Part 2: DevOps & Observability

**Scope:** separate development/production environments; manual CI-gated promotion; OpenTelemetry Protocol traces, metrics and logs; a real Grafana dashboard; metric alerts; AI on-call responder.

**Status:** implementation checked into `feat/devops-observability`. Local monitoring stack and AI response are **not yet demonstrated live**; the repository workflows and source code alone do not establish a completed demo. The existing AWS and Render production installations have deliberately not been changed.

## 1. Two isolated environments

| | DEVELOPMENT | PRODUCTION |
|---|---|---|
| Host | Your laptop, Docker Compose | Existing Render HTTPS site; existing AWS EC2 |
| Application | http://localhost:3001 | https://weatherwear-app.onrender.com |
| Database | Dedicated local Postgres `weatherwear-development_postgres_data` volume | Render Postgres / AWS Postgres (different machines) |
| Docker project | `weatherwear-development` | Existing Render deployment or original AWS Compose |
| Secrets | Local untracked `.env.development` | Render private env variables and GitHub production environment secrets |
| Observability | Local OTel Collector + Prometheus + Tempo + Loki + Grafana | Opt-in later to a private collector; currently no public telemetry endpoint |

Never connect the development application to a production DATABASE_URL and never expose Postgres port 5432 publicly. Do not copy production secrets into the development environment.

### Start DEVELOPMENT on the computer

You need Docker Desktop with Compose. In a terminal at the repository root:

```bash
git checkout feat/devops-observability
cp .env.development.example .env.development
```

**Edit both placeholder passwords** in `.env.development` (never commit the file).

```bash
docker compose --env-file .env.development \
  -f docker-compose.yml \
  -f infra/observability/docker-compose.dev.yml \
  up --build -d
```

Open the development app at http://localhost:3001 and search Алматы.

- Grafana: http://localhost:3002 (username `admin`, password from your local .env.development)
- Dashboard: Grafana → Dashboards → WeatherWear → **WeatherWear | Application Observability**
- Prometheus metrics and alert rules: http://localhost:9090
- Alertmanager events: http://localhost:9093

The Compose project has its own Postgres volume, so it does not interfere with the AWS/Render production databases. **Do not deploy the Grafana/Tempo/Loki stack on the AWS t3.micro Free Plan**: it has insufficient RAM, and public monitoring ports would add risk.

Stop only this development stack (keeps data volumes):

```bash
docker compose --env-file .env.development \
  -f docker-compose.yml \
  -f infra/observability/docker-compose.dev.yml down
```

Do not use `down -v` unless you explicitly want to destroy the development databases and dashboard data.

## 2. Manual CI/CD DEV → PROD promotion

Workflow: [`.github/workflows/manual-promote.yml`](../.github/workflows/manual-promote.yml).

**Production is NOT promoted automatically by this workflow.** A human has to choose the git ref in GitHub Actions, type `PROMOTE`, pass all CI checks and (if configured) approve the GitHub `production` environment deployment.

One-time setup after reviewing/merging the Part 1 and Part 2 PRs into the default branch:

1. GitHub → Settings → Environments → create `production`; set **Required reviewers** if your plan supports it.
2. Render → your existing `weatherwear-app` service → Settings → copy the **Deploy Hook URL**. Treat the hook as a secret.
3. In GitHub's `production` environment, add secret **`RENDER_PRODUCTION_DEPLOY_HOOK`** with this URL.
4. Decide whether to change Render's existing automatic deployment. For strict manual promotion, change **Auto-Deploy → Off** in the production service. This is a user-controlled change; the repository does not change it automatically.
5. GitHub → Actions → **Part 2 - manual development to production promotion** → Run workflow. Select the candidate branch/commit after testing, type **PROMOTE**.
6. The workflow runs frontend/backend tests, Postgres integration, Playwright E2E, lint, typecheck, build and Docker image checks. Only then does it call the Render deploy hook with the **exact validated git SHA** (the `ref` parameter).
7. Check Render Deploys to confirm the **exact SHA** became live and the deployed app functions. Health checks alone do not prove a specific SHA went live.

**Important:** GitHub's `workflow_dispatch` is normally shown in the Actions tab only when its workflow file is available on the **default branch**. Until the Part 2 branch is merged or the workflow is added to the default branch, the manual run button may be absent. Do not merge the unfinished Part 1 PR without review.

Render's official documentation says a deploy hook with an explicit `ref` disables ordinary auto-deploy for the service; this is appropriate for manual releases but **changes the previous Part 1 auto-deploy behavior**. Keep that trade-off explicit.

Official documentation: https://render.com/docs/deploy-hooks

## 3. OpenTelemetry metrics, traces and logs

Source: [`lib/observability.ts`](../lib/observability.ts).

The application **manually emits OTLP/HTTP JSON signals** when the `POST /api/recommendations` endpoint runs:

- Metric counter `weatherwear_search_requests` (exported in Prometheus as `weatherwear_search_requests_total`).
- Metric counter `weatherwear_search_failures` (exported as `weatherwear_search_failures_total`).
- Metric histogram `weatherwear_search_duration_ms` (latency buckets, sum and count).
- Server-kind span `POST /api/recommendations` with a generated trace ID and result.
- Structured log with severity INFO or ERROR and the same trace/span ID.

Transport path: **Next.js → OpenTelemetry Collector**. The Collector exports metrics to **Prometheus**, traces to **Tempo**, logs to **Loki**. **Grafana** reads all three sources. The collector is on an internal Docker network; its OTLP port is not publicly published.

This implementation uses the genuine **OpenTelemetry Protocol** and manual app instrumentation, **not the official OpenTelemetry JavaScript SDK or automatic request instrumentation**. For an assignment that explicitly requires the SDK, we still need to install and configure `@opentelemetry/sdk-node` and the exporters and update the npm lockfile. No SDK is claimed here.

Telemetry exporting is best-effort and isolated from user responses; a failing collector cannot break weather lookup. Only route/result labels are exported, never weather-search city names, DB passwords, or full user input. Render/AWS have no new telemetry destination until intentionally configured.

Spec: https://opentelemetry.io/docs/specs/otlp/

## 4. App metrics dashboard + alert

Provisioned Grafana dashboard: [`infra/observability/dashboard.json`](../infra/observability/dashboard.json).

It contains 5 panels: total searches, failed searches, request rate/sec, error rate/sec and 95th-percentile search latency in ms. Create at least one successful search first so that data appears.

Prometheus alert rule: [`infra/observability/alerts.yml`](../infra/observability/alerts.yml). It fires **WeatherSearchFailures** when at least 3 upstream lookup errors occur within 5 minutes. Alertmanager routes it to the local on-call agent.

To demonstrate safely, while the local dev stack is running, perform three searches for a deliberately impossible city in the development app (for example `NoSuchCityWeatherwearXYZ`). Observe the metric increase in Grafana, then Prometheus Alerts and Alertmanager. This modifies no production data.

Expected Prometheus expression:

```promql
increase(weatherwear_search_failures_total[5m]) >= 3
```

The first Prometheus samples may take a short scrape interval. If an upstream API request legitimately fails during a test, that also counts as an error. For any incident production runbook, investigate causes instead of hard-coding a success response.

## 5. AI on-call agent: free, local, read-only

Alertmanager → [`infra/observability/oncall/oncall.py`](../infra/observability/oncall/oncall.py) → **local Ollama**. This approach does not require an OpenAI API key or a paid AI provider.

Install [Ollama](https://ollama.com/) on your computer and download the small model:

```bash
ollama pull qwen2.5:0.5b
```

Make sure the Ollama server is running on your computer's port 11434. The on-call container accesses it using Docker's `host.docker.internal`.

When the rule fires, the responder sends **sanitized** alert name, severity and description to the local model. The model gives a probable cause, diagnostic checks, and escalation steps. Each response is saved as an incident JSON file in the private Docker volume `weatherwear-development_incident_data`. You can inspect the event:

```bash
docker compose --env-file .env.development \
  -f docker-compose.yml \
  -f infra/observability/docker-compose.dev.yml \
  logs --tail 50 oncall-agent
```

**Security and truthful demo:** the AI only writes investigation advice. It never deploys, restarts services, calls AWS or accesses credentials. If Ollama is not installed/running, the receiver still records a deterministic runbook but sets `analysis_mode=runbook_only`, **which is NOT an AI response**. A legitimate `analysis_mode=ai_ollama` record is required to claim the AI-on-call task has been demonstrated.

## 6. Suggested proof for the assignment

Capture screenshots (without secrets or AWS account numbers):

1. Two environments: local DEV at localhost:3001 + separate live Render production HTTPS app.
2. Manual GitHub Actions `workflow_dispatch` with confirmation and successful checks / production approval.
3. OpenTelemetry Collector container logs or OTLP unit tests showing all three signals.
4. Grafana dashboard with non-empty search request and error/latency panels.
5. Prometheus alert in firing state and Alertmanager notification.
6. On-call logs or incident JSON with `analysis_mode=ai_ollama` and the AI's diagnosis.

**What is ready in code:** isolated dev stack, manual promotion workflow, OTLP traces/metrics/logs emitter, dashboard, alert rule, and read-only local AI responder. **What still needs actual end-to-end evidence:** run the local Compose stack, demonstrate Grafana, trigger a real alert, verify a real Ollama analysis, configure Render deploy-hook secret and carry out the manual promotion after merging workflows to default.

Do not upload a claim of full production observability if only the local development collector has been tested.
