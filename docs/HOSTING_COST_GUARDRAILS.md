# Hosting Cost Guardrails

This repository contains multiple independently deployable apps. Treat cost control as a shared release gate, not a one-time Vercel setting.

## Current Local Findings

- Vercel cron usage is concentrated in `campgogo.kr` (8 crons) and `gong365kr` (6 crons).
- Turso/libsql is already used in several projects, including `campgogo.kr`, `dolbomjigi`, `gong365kr`, `nongsusangogo.kr`, `petjigi`, `roadwayskr`, `spinkorea`, `temon`, `today_yakuk`, and `yungyanggogo.kr`.
- No real `.env` files were found locally; only `.env.example` files were present.
- Added missing `.env.example` files for `campgogo.kr`, `dolbomjigi`, and `petjigi` so Turso and cron secrets are visible as required configuration names without exposing values.
- The workspace root is not currently a Git repository, so GitHub validation is provided as checked-in workflow files for whichever repository root this folder is pushed to.

## Vercel Controls

1. Enable Vercel Spend Management on the account/team and set a spend threshold below the true maximum budget.
2. Enable the production deployment pause action if the team wants Vercel to stop serving production deployments after the threshold is reached. Budget checks are not continuous, so leave headroom for delay.
3. Keep cron jobs rare by default. Prefer daily jobs, staggered schedules, and batch processing over hourly jobs.
4. Every cron-backed API route should have a clear timeout budget and idempotent retry behavior.
5. Do not run `vercel --prod` from automatic CI without environment protection and manual approval.
6. Cache static SEO artifacts, sitemaps, feeds, and generated JSON with `s-maxage` where freshness allows it.

## Turso Controls

1. Store only `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel project environment variables.
2. Use one module-scoped libsql client per server runtime, not one client per request.
3. Require missing-env guards before any write, cron, migration, or enrichment job.
4. Keep write-heavy enrichment as manual or scheduled batch jobs, not public request-time work.
5. Add a project-specific monthly usage review for row reads, row writes, storage, and locations before increasing schedules.

## GitHub Controls

The workflow in `.github/workflows/hosting-cost-guard.yml` runs:

```bash
node scripts/audit-hosting-costs.mjs --fail-on=critical
```

It runs on pull requests, pushes to `main`/`master`/`develop`, manual dispatch, and a daily schedule at 09:10 KST. The script intentionally reports warnings for frequent crons and deployment/database scripts without failing the build. Critical issues, such as invalid JSON or excessive configured function duration, fail the workflow.

The workflow in `.github/workflows/live-cost-watch.yml` runs daily at 09:20 KST and manually. It checks static hosting risk first, then attempts live usage checks:

- Vercel usage through `vercel usage --format json`.
- Turso database usage through the Turso `/usage` API.

If the required secrets are missing, the workflow fails on purpose so GitHub sends a workflow failure notification.

For multi-repo accounts, run live usage checks from one representative repository to avoid duplicate account-level alerts. Set these GitHub Variables:

- Representative alert repository: `RUN_VERCEL_LIVE_CHECK=1`, `RUN_TURSO_LIVE_CHECK=1`
- Other repositories: `RUN_VERCEL_LIVE_CHECK=0`, `RUN_TURSO_LIVE_CHECK=0`

Required GitHub Secrets for live checks:

- `VERCEL_TOKEN`: Vercel token with permission to read usage.
- `VERCEL_SCOPE` or `VERCEL_TEAM_ID`: optional Vercel team selector when the token belongs to multiple scopes.
- `TURSO_API_TOKEN`: Turso platform API token.
- `TURSO_ORG_SLUG`: Turso organization or user slug.
- `TURSO_DATABASES`: comma-separated Turso database names to check.

Optional GitHub Variables for thresholds:

- `VERCEL_BILLED_COST_WARN_USD`
- `VERCEL_BILLED_COST_FAIL_USD`
- `TURSO_ROWS_READ_WARN`
- `TURSO_ROWS_READ_FAIL`
- `TURSO_ROWS_WRITTEN_WARN`
- `TURSO_ROWS_WRITTEN_FAIL`
- `RUN_VERCEL_LIVE_CHECK`
- `RUN_TURSO_LIVE_CHECK`

## Local Command

```bash
node scripts/audit-hosting-costs.mjs
```

Use this before adding a new Vercel cron, production deploy script, Turso migration script, or long-running API route.

The audit also checks cron route files for an obvious `CRON_SECRET`, `Authorization`, or equivalent guard. This is heuristic: it does not prove the route is secure, but it catches the common expensive failure mode where a public cron endpoint can be called by anyone.

## Manual Dashboard Checklist

- Vercel account/team: hard spend cap enabled.
- Vercel account/team: production pause action enabled if an actual stop condition is desired.
- Vercel project: production deployments protected if the plan supports it.
- Vercel project: cron paths require a secret or are otherwise non-publicly abusable.
- Turso database: usage alerts checked before increasing cron frequency.
- Turso tokens: rotate if exposed, and keep tokens scoped to the project that needs them.

## Official References

- Vercel Spend Management: https://vercel.com/docs/spend-management
- Vercel usage CLI: https://vercel.com/docs/cli/usage
- Vercel Project Configuration: https://vercel.com/docs/project-configuration
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Turso TypeScript quickstart: https://docs.turso.tech/sdk/ts/quickstart
- Turso database usage API: https://docs.turso.tech/api-reference/databases/usage
