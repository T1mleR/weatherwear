# WeatherWear first cloud deployment — Railway (Compose import)

This is the procedure for coursework issues [#14](https://github.com/T1mleR/weatherwear/issues/14) and [#16](https://github.com/T1mleR/weatherwear/issues/16). **No deployment has occurred solely because this file exists.** Requires an authenticated Railway account and a confirmed free-plan budget.

## 0. Free-only safety gate

1. Use only Railway **Trial** or **Free** — not Hobby/Pro. Trial currently includes a one-time $5 credit for up to 30 days; after trial Free includes $1/month. The app and database both consume resources while running.
2. Confirm available credits and select workspace **Usage → Set Usage Limits → Hard limit** no greater than the available credits, with an alert below that threshold. Workloads can stop when limits are reached.
3. Free/trial volume and RAM restrictions are tight; inspect resource metrics. Never upgrade automatically, never add paid resources, and do not store cards or tokens in the repository.
4. A restricted/limited trial can block external requests to Open-Meteo even if the app is healthy. Account verification is preferable to a paid upgrade.

Authoritative docs:
- https://docs.railway.com/pricing/free-trial
- https://docs.railway.com/pricing/cost-control
- https://docs.railway.com/builds/dockerfiles

## 1. Use Docker Compose as the deployment source

1. Open https://railway.com/new and create an **empty project** in a free/trial workspace.
2. In the Railway project canvas **drag and drop the root `docker-compose.yml`** from this repository. This stages app, db, migrate and a volume if supported. Review the staged changes **before deployment**; Railway imports Compose into its native services and does **not** run Docker Compose as a single remote process.
3. If the importer does not support `build.target` or `depends_on`, keep two services imported from the Compose definition: **app** (Dockerfile default final `runner` stage) and **db** (`postgres:16-alpine`). The app now executes `prisma migrate deploy` automatically at startup, so an unsupported/extra **migrate** one-off service may be omitted on Railway. The full three-service Compose file remains the local and CI source of truth.
4. Connect **app** to the GitHub repository `T1mleR/weatherwear` and the **main** branch only after PR #18 is reviewed and merged. The root Dockerfile final target is `runner`.
5. Ensure the database has a named persistent volume mounted at `/var/lib/postgresql/data`; use a small volume within free/trial quota.

**Do not publish PostgreSQL port 5432.** Only generate a public domain for **app** (internal PORT=3000). App/API/static assets run from a single image.

## 2. Configure Railway secrets and private network

Set db service environment variables in Railway's **Variables** UI:

| Service | Variable | Value |
| --- | --- | --- |
| db | POSTGRES_USER | weatherwear |
| db | POSTGRES_DB | weatherwear |
| db | POSTGRES_PASSWORD | Unique random, long, preferably URL-safe password. Do not commit. |
| app | NODE_ENV | production |
| app | PORT | 3000 |
| app | DATABASE_URL | `postgresql://weatherwear:<secret>@db.railway.internal:5432/weatherwear?schema=public` |

Change `db.railway.internal` if the imported database service is named differently. Railway private DNS uses `SERVICE_NAME.railway.internal`, not the local Compose hostname `db`. If using secret interpolation, use the Railway variable-reference UI rather than copying literal placeholders. Database credentials stay only in Railway variables.

See https://docs.railway.com/networking/private-networking and https://docs.railway.com/variables.

**Startup:** Production app image runs `prisma migrate deploy` before `node server.js`. This fails closed when the database is unavailable, rather than presenting a half-configured website. Confirm the first app deployment logs show migrations succeeded.

## 3. Configure CI-gated redeploy

1. In **app → Settings → Source**, confirm GitHub repository and **main** branch.
2. Enable **Autodeploy** and **Wait for CI**. The GitHub Actions workflow at `.github/workflows/infrastructure-smoke.yml` runs on `push` to main. Railway will deploy only if all relevant GitHub checks finish successfully.
3. Configure an app health check `/api/health` with a reasonable timeout; Next.js binds to `0.0.0.0` and the configured PORT.
4. Verify one benign commit on main triggers Actions, then Railway deployment, without any manual button click. Record commit SHA, passed workflow, and Railway deployment ID/URL.
5. Keep Railway secrets out of GitHub; GitHub → Railway integration is sufficient for CI-gated native autodeploy, no Railway token needs to be committed.

See https://docs.railway.com/deployments/github-autodeploys.

## 4. Final live evidence (required for submission)

1. Open the generated `https://...up.railway.app` domain.
2. Run locally or in a safe CI manual dispatch:

   ```bash
   npm run test:deployment -- https://YOUR-APP.up.railway.app
   ```

3. In browser search a *real* city, verify result and history; this tests external Open-Meteo connectivity, which mocked Playwright E2E cannot prove.
4. Restart app or push a benign new commit; verify history persists in PostgreSQL.
5. Save screenshots of project services/volume, successful Deploy logs, HTTPS app URL, Actions run and successful commit-triggered redeploy.
6. Add the final live URL, deployment ID, screenshots and cost-control configuration (without secrets) to GitHub Issue #14 and README. Mark Issues complete only after evidence exists.

## Current status

Prepared: Compose, single image, database migrations, CI, Playwright, smoke test.

Not performed here: Railway account login, billing/usage verification, first live deployment, public URL, CI-gated cloud redeploy. These require Railway account authorization.
